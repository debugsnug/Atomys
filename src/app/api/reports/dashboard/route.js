import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/reports/dashboard — Dashboard stats
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const totalManagers = await prisma.user.count({ where: { role: 'MANAGER' } });

    const totalSheets = await prisma.goalSheet.count();
    const draftSheets = await prisma.goalSheet.count({ where: { status: 'DRAFT' } });
    const submittedSheets = await prisma.goalSheet.count({ where: { status: 'SUBMITTED' } });
    const approvedSheets = await prisma.goalSheet.count({ where: { status: 'APPROVED' } });
    const returnedSheets = await prisma.goalSheet.count({ where: { status: 'RETURNED' } });

    // Check-in completion rates per quarter
    const checkinStats = {};
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
      const sheetsWithUpdates = await prisma.goalSheet.count({
        where: {
          status: 'APPROVED',
          goals: {
            some: {
              quarterlyUpdates: {
                some: { quarter: q },
              },
            },
          },
        },
      });

      const sheetsWithCheckins = await prisma.checkinComment.groupBy({
        by: ['goalSheetId'],
        where: { quarter: q },
      });

      checkinStats[q] = {
        employeeUpdates: sheetsWithUpdates,
        managerCheckins: sheetsWithCheckins.length,
        totalApproved: approvedSheets,
      };
    }

    // Department-wise goal distribution
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            goalSheets: {
              where: { status: 'APPROVED' },
              include: {
                goals: {
                  include: { quarterlyUpdates: true },
                },
              },
            },
          },
        },
      },
    });

    const deptStats = departments.map(dept => {
      const users = dept.users;
      const sheets = users.flatMap(u => u.goalSheets);
      const goals = sheets.flatMap(s => s.goals);
      const avgScore = goals.length > 0
        ? goals.reduce((sum, g) => {
            const latestUpdate = g.quarterlyUpdates.sort((a, b) =>
              new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            return sum + (latestUpdate?.computedScore || 0);
          }, 0) / goals.length
        : 0;

      return {
        name: dept.name,
        employees: users.length,
        approvedSheets: sheets.length,
        totalGoals: goals.length,
        avgScore: Math.round(avgScore * 100) / 100,
      };
    });

    return NextResponse.json({
      stats: {
        totalEmployees,
        totalManagers,
        totalSheets,
        draftSheets,
        submittedSheets,
        approvedSheets,
        returnedSheets,
      },
      checkinStats,
      deptStats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
