import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/goals — Get goal sheets for current user or team
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'my'; // my, team, all

  try {
    let where = {};

    if (view === 'my') {
      where = { userId: session.id };
    } else if (view === 'team') {
      // Manager sees their direct reports
      where = {
        user: { managerId: session.id },
      };
    } else if (view === 'all' && session.role === 'ADMIN') {
      where = {};
    }

    const sheets = await prisma.goalSheet.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        goals: {
          include: {
            thrustArea: true,
            sharedGoal: true,
            quarterlyUpdates: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        checkinComments: {
          include: { manager: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sheets });
  } catch (error) {
    console.error('Goals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/goals — Create a new goal sheet
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { goals } = await request.json();

    // Validate goal count
    if (!goals || goals.length === 0) {
      return NextResponse.json({ error: 'At least one goal is required' }, { status: 400 });
    }
    if (goals.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 });
    }

    // Validate weightages
    const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json({ error: `Total weightage must equal 100%. Current: ${totalWeightage}%` }, { status: 400 });
    }

    for (const g of goals) {
      if (g.weightage < 10) {
        return NextResponse.json({ error: `Minimum weightage per goal is 10%. "${g.title}" has ${g.weightage}%` }, { status: 400 });
      }
    }

    // Check for existing draft sheet
    let sheet = await prisma.goalSheet.findFirst({
      where: { userId: session.id, cycle: '2025-26', status: 'DRAFT' },
    });

    // Also check for returned sheet
    if (!sheet) {
      sheet = await prisma.goalSheet.findFirst({
        where: { userId: session.id, cycle: '2025-26', status: 'RETURNED' },
      });
    }

    if (sheet) {
      // Delete existing goals and update
      await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id, isSharedReadonly: false } });
    } else {
      // Check if already submitted/approved
      const existing = await prisma.goalSheet.findFirst({
        where: { userId: session.id, cycle: '2025-26' },
      });
      if (existing && ['SUBMITTED', 'APPROVED'].includes(existing.status)) {
        return NextResponse.json({ error: 'A goal sheet has already been submitted for this cycle' }, { status: 400 });
      }

      sheet = await prisma.goalSheet.create({
        data: { userId: session.id, cycle: '2025-26', status: 'DRAFT' },
      });
    }

    // Create goals
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          thrustAreaId: g.thrustAreaId || null,
          title: g.title,
          description: g.description || '',
          uomType: g.uomType,
          target: parseFloat(g.target) || 0,
          targetDate: g.targetDate || null,
          weightage: parseFloat(g.weightage),
          sortOrder: i + 1,
          sharedGoalId: g.sharedGoalId || null,
          isSharedReadonly: g.isSharedReadonly || false,
        },
      });
    }

    return NextResponse.json({ success: true, sheetId: sheet.id });
  } catch (error) {
    console.error('Goal creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
