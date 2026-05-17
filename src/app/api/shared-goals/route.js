import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/shared-goals — Get shared goals for user's department
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sharedGoals = await prisma.sharedGoal.findMany({
      where: session.role === 'ADMIN' ? {} : { departmentId: session.departmentId },
      include: {
        createdBy: { select: { name: true } },
        department: true,
        goals: {
          include: {
            goalSheet: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sharedGoals });
  } catch (error) {
    console.error('Shared goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/shared-goals — Create a shared goal and push to employees
export async function POST(request) {
  const session = await getSession();
  if (!session || !['MANAGER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, uomType, target, targetDate, departmentId, employeeIds } = await request.json();

    if (!title || !uomType) {
      return NextResponse.json({ error: 'Title and UoM type are required' }, { status: 400 });
    }

    const sharedGoal = await prisma.sharedGoal.create({
      data: {
        title,
        description: description || '',
        uomType,
        target: parseFloat(target) || 0,
        targetDate: targetDate || null,
        createdById: session.id,
        departmentId: parseInt(departmentId) || session.departmentId,
      },
    });

    // Push to selected employees
    if (employeeIds && employeeIds.length > 0) {
      for (const empId of employeeIds) {
        // Find or create goal sheet for the employee
        let sheet = await prisma.goalSheet.findFirst({
          where: { userId: empId, cycle: '2025-26' },
        });

        if (!sheet) {
          sheet = await prisma.goalSheet.create({
            data: { userId: empId, cycle: '2025-26', status: 'DRAFT' },
          });
        }

        // Add the shared goal
        await prisma.goal.create({
          data: {
            goalSheetId: sheet.id,
            title: sharedGoal.title,
            description: sharedGoal.description,
            uomType: sharedGoal.uomType,
            target: sharedGoal.target,
            targetDate: sharedGoal.targetDate,
            weightage: 10,
            sharedGoalId: sharedGoal.id,
            isSharedReadonly: true,
            sortOrder: 99,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'SHARED_GOAL_CREATED',
        details: `Shared goal "${title}" pushed to ${employeeIds?.length || 0} employees`,
      },
    });

    return NextResponse.json({ success: true, sharedGoal });
  } catch (error) {
    console.error('Shared goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
