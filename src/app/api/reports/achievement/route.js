import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/reports/achievement — Achievement report data
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter') || 'Q1';

    let where = {};
    if (session.role === 'MANAGER') {
      where = { user: { managerId: session.id } };
    } else if (session.role === 'EMPLOYEE') {
      where = { userId: session.id };
    }
    // ADMIN sees all

    const sheets = await prisma.goalSheet.findMany({
      where: { ...where, status: 'APPROVED' },
      include: {
        user: {
          select: { name: true, email: true, department: true },
        },
        goals: {
          include: {
            thrustArea: true,
            quarterlyUpdates: {
              where: { quarter },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Format report data
    const reportData = [];
    for (const sheet of sheets) {
      for (const goal of sheet.goals) {
        const update = goal.quarterlyUpdates[0];
        reportData.push({
          employeeName: sheet.user.name,
          employeeEmail: sheet.user.email,
          department: sheet.user.department?.name || '',
          goalTitle: goal.title,
          thrustArea: goal.thrustArea?.name || '',
          uomType: goal.uomType,
          target: goal.target,
          targetDate: goal.targetDate,
          weightage: goal.weightage,
          actualValue: update?.actualValue || 0,
          completionDate: update?.completionDate || '',
          status: update?.status || 'NOT_STARTED',
          score: update?.computedScore || 0,
          quarter,
        });
      }
    }

    return NextResponse.json({ reportData });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
