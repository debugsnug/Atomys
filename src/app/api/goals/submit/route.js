import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

// POST /api/goals/submit — Submit goal sheet for approval
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sheetId } = await request.json();

    // Enforce check-in schedule: only allow submission during GOAL_SETTING window
    const now = new Date();
    const goalSettingCycle = await prisma.cycle.findFirst({
      where: { phase: 'GOAL_SETTING', isActive: true },
    });
    if (goalSettingCycle) {
      const windowOpen = new Date(goalSettingCycle.windowOpen);
      const windowClose = new Date(goalSettingCycle.windowClose);
      if (now < windowOpen || now > windowClose) {
        return NextResponse.json(
          { error: `Goal submission is only allowed between ${windowOpen.toLocaleDateString()} and ${windowClose.toLocaleDateString()}` },
          { status: 403 }
        );
      }
    }

    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: sheetId,
        userId: session.id,
        status: { in: ['DRAFT', 'RETURNED'] },
      },
      include: { goals: true },
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Goal sheet not found or cannot be submitted' }, { status: 404 });
    }

    // Validate before submission
    if (sheet.goals.length === 0) {
      return NextResponse.json({ error: 'Cannot submit empty goal sheet' }, { status: 400 });
    }
    if (sheet.goals.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 });
    }

    const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json({ error: `Total weightage must equal 100%. Current: ${totalWeightage}%` }, { status: 400 });
    }

    for (const g of sheet.goals) {
      if (g.weightage < 10) {
        return NextResponse.json({ error: `Minimum weightage per goal is 10%. "${g.title}" has ${g.weightage}%` }, { status: 400 });
      }
    }

    await prisma.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        returnNote: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'GOAL_SHEET_SUBMITTED',
        details: `Goal sheet #${sheetId} submitted for approval`,
      },
    });

    // Fire-and-forget: notify manager
    if (sheet.user.managerId) {
      sendNotification('GOAL_SUBMITTED', sheet.user.managerId, {
        employeeName: session.name,
        cycle: sheet.cycle,
        goalCount: sheet.goals.length,
        department: sheet.user.department?.name || '',
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
