import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { computeScore } from '@/lib/scoring';

// POST /api/goals/quarterly — Save quarterly updates
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sheetId, quarter, updates } = await request.json();

    // Verify the sheet belongs to the user and is approved
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: sheetId,
        userId: session.id,
        status: 'APPROVED',
      },
      include: { goals: true },
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Goal sheet not found or not approved' }, { status: 404 });
    }

    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      return NextResponse.json({ error: 'Invalid quarter' }, { status: 400 });
    }

    // Enforce check-in schedule: only allow updates during the matching quarter window
    const now = new Date();
    const quarterCycle = await prisma.cycle.findFirst({
      where: { phase: quarter },
    });
    
    if (!quarterCycle || !quarterCycle.isActive) {
      return NextResponse.json({ error: `${quarter} check-in window is completely locked by Admin.` }, { status: 403 });
    }

    const windowOpen = new Date(quarterCycle.windowOpen);
    const windowClose = new Date(quarterCycle.windowClose);
    if (now < windowOpen || now > windowClose) {
      return NextResponse.json(
        { error: `${quarter} check-in window is strictly closed. Allowed window: ${windowOpen.toLocaleDateString()} — ${windowClose.toLocaleDateString()}.` },
        { status: 403 }
      );
    }

    let totalSynced = 0;

    // Process each update
    for (const update of updates) {
      const goal = sheet.goals.find(g => g.id === update.goalId);
      if (!goal) continue;

      const score = computeScore(
        goal.uomType,
        goal.target,
        parseFloat(update.actualValue) || 0,
        goal.targetDate,
        update.completionDate
      );

      await prisma.quarterlyUpdate.upsert({
        where: {
          goalId_quarter: {
            goalId: update.goalId,
            quarter,
          },
        },
        create: {
          goalId: update.goalId,
          quarter,
          actualValue: parseFloat(update.actualValue) || 0,
          completionDate: update.completionDate || null,
          status: update.status || 'NOT_STARTED',
          computedScore: score,
        },
        update: {
          actualValue: parseFloat(update.actualValue) || 0,
          completionDate: update.completionDate || null,
          status: update.status || 'NOT_STARTED',
          computedScore: score,
        },
      });

      // If this goal is a shared goal, sync achievement to all linked goals
      if (goal.sharedGoalId && !goal.isSharedReadonly) {
        const linkedGoals = await prisma.goal.findMany({
          where: {
            sharedGoalId: goal.sharedGoalId,
            id: { not: goal.id },
          },
        });

        for (const linked of linkedGoals) {
          totalSynced++;
          const linkedScore = computeScore(
            linked.uomType,
            linked.target,
            parseFloat(update.actualValue) || 0,
            linked.targetDate,
            update.completionDate
          );

          await prisma.quarterlyUpdate.upsert({
            where: {
              goalId_quarter: {
                goalId: linked.id,
                quarter,
              },
            },
            create: {
              goalId: linked.id,
              quarter,
              actualValue: parseFloat(update.actualValue) || 0,
              completionDate: update.completionDate || null,
              status: update.status || 'NOT_STARTED',
              computedScore: linkedScore,
            },
            update: {
              actualValue: parseFloat(update.actualValue) || 0,
              completionDate: update.completionDate || null,
              status: update.status || 'NOT_STARTED',
              computedScore: linkedScore,
            },
          });
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'QUARTERLY_UPDATE',
        details: `${quarter} achievement update for goal sheet #${sheetId}`,
      },
    });

    return NextResponse.json({ success: true, syncedCount: totalSynced });
  } catch (error) {
    console.error('Quarterly update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
