import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

// POST /api/goals/approve — Manager approves or returns goal sheet
export async function POST(request) {
  const session = await getSession();
  if (!session || !['MANAGER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sheetId, action, returnNote, editedGoals } = await request.json();

    const sheet = await prisma.goalSheet.findFirst({
      where: { id: sheetId, status: 'SUBMITTED' },
      include: {
        goals: true,
        user: true,
      },
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Goal sheet not found or not in submitted state' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // If manager edited goals inline, apply changes
      if (editedGoals && editedGoals.length > 0) {
        for (const eg of editedGoals) {
          const oldGoal = sheet.goals.find(g => g.id === eg.id);
          if (oldGoal) {
            await prisma.goal.update({
              where: { id: eg.id },
              data: {
                target: eg.target !== undefined ? parseFloat(eg.target) : oldGoal.target,
                weightage: eg.weightage !== undefined ? parseFloat(eg.weightage) : oldGoal.weightage,
                targetDate: eg.targetDate !== undefined ? eg.targetDate : oldGoal.targetDate,
              },
            });

            // Audit log for each change
            if (eg.target !== undefined && eg.target !== oldGoal.target) {
              await prisma.auditLog.create({
                data: {
                  goalId: eg.id,
                  userId: session.id,
                  action: 'GOAL_TARGET_EDITED_BY_MANAGER',
                  oldValue: String(oldGoal.target),
                  newValue: String(eg.target),
                  details: `Manager ${session.name} edited target during approval`,
                },
              });
            }
            if (eg.weightage !== undefined && eg.weightage !== oldGoal.weightage) {
              await prisma.auditLog.create({
                data: {
                  goalId: eg.id,
                  userId: session.id,
                  action: 'GOAL_WEIGHTAGE_EDITED_BY_MANAGER',
                  oldValue: String(oldGoal.weightage),
                  newValue: String(eg.weightage),
                  details: `Manager ${session.name} edited weightage during approval`,
                },
              });
            }
          }
        }
      }

      await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'GOAL_SHEET_APPROVED',
          details: `Goal sheet #${sheetId} for ${sheet.user.name} approved by ${session.name}`,
        },
      });
    } else if (action === 'RETURN') {
      await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: 'RETURNED',
          returnNote: returnNote || 'Please revise and resubmit',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'GOAL_SHEET_RETURNED',
          details: `Goal sheet #${sheetId} for ${sheet.user.name} returned: ${returnNote || 'No note'}`,
        },
      });
    }

    // Fire-and-forget Teams Adaptive Card notifications
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

    if (webhookUrl) {
      const teamsPayload = action === 'APPROVE'
        ? { eventType: 'goal_sheet_approved', payload: { managerName: session.name, cycle: sheet.cycle || 'FY 2025', employeeName: sheet.user.name } }
        : { eventType: 'goal_sheet_returned', payload: { managerName: session.name, feedback: returnNote, employeeName: sheet.user.name } };

      fetch(`${appUrl}/api/notifications/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${request.cookies.get('auth-token')?.value}` },
        body: JSON.stringify(teamsPayload),
      }).catch(err => console.warn('Teams notification failed silently:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
