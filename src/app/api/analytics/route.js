import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/analytics — Analytics data for charts
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. QoQ Achievement Trends
    const approvedSheets = await prisma.goalSheet.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: { select: { name: true, department: true } },
        goals: {
          include: {
            thrustArea: true,
            quarterlyUpdates: true,
          },
        },
      },
    });

    // QoQ trends: average score per quarter across all goals
    const qoqTrends = ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
      const allUpdates = approvedSheets.flatMap(s =>
        s.goals.flatMap(g => g.quarterlyUpdates.filter(u => u.quarter === quarter))
      );
      const avgScore = allUpdates.length > 0
        ? Math.round(allUpdates.reduce((sum, u) => sum + u.computedScore, 0) / allUpdates.length * 100) / 100
        : 0;
      const completionRate = approvedSheets.length > 0
        ? Math.round((approvedSheets.filter(s =>
            s.goals.some(g => g.quarterlyUpdates.some(u => u.quarter === quarter))
          ).length / approvedSheets.length) * 100)
        : 0;
      return { quarter, avgScore, completionRate, updatesCount: allUpdates.length };
    });

    // 2. Department-level breakdown
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            goalSheets: {
              where: { status: 'APPROVED' },
              include: { goals: { include: { quarterlyUpdates: true } } },
            },
          },
        },
      },
    });

    const deptTrends = departments.map(dept => {
      const qData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
        const updates = dept.users.flatMap(u =>
          u.goalSheets.flatMap(s =>
            s.goals.flatMap(g => g.quarterlyUpdates.filter(qu => qu.quarter === q))
          )
        );
        const avg = updates.length > 0
          ? Math.round(updates.reduce((s, u) => s + u.computedScore, 0) / updates.length * 100) / 100
          : 0;
        return { quarter: q, avgScore: avg, count: updates.length };
      });
      return { department: dept.name, quarters: qData, employeeCount: dept.users.length };
    });

    // 3. Goal Distribution by Thrust Area
    const allGoals = approvedSheets.flatMap(s => s.goals);
    const thrustAreaMap = {};
    allGoals.forEach(g => {
      const taName = g.thrustArea?.name || 'Uncategorized';
      if (!thrustAreaMap[taName]) thrustAreaMap[taName] = { name: taName, count: 0, totalWeightage: 0 };
      thrustAreaMap[taName].count++;
      thrustAreaMap[taName].totalWeightage += g.weightage;
    });
    const thrustAreaDist = Object.values(thrustAreaMap);

    // 4. Goal Distribution by UoM Type
    const uomMap = {};
    allGoals.forEach(g => {
      const label = g.uomType.replace(/_/g, ' ');
      if (!uomMap[label]) uomMap[label] = { name: label, count: 0 };
      uomMap[label].count++;
    });
    const uomDist = Object.values(uomMap);

    // 5. Goal Status Distribution
    const statusMap = {};
    allGoals.forEach(g => {
      const latestUpdate = g.quarterlyUpdates.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      const status = latestUpdate?.status || 'NOT_STARTED';
      const label = status.replace(/_/g, ' ');
      if (!statusMap[label]) statusMap[label] = { name: label, count: 0 };
      statusMap[label].count++;
    });
    const statusDist = Object.values(statusMap);

    // 6. Manager Effectiveness — check-in completion rates
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      include: {
        reports: {
          include: {
            goalSheets: {
              where: { status: 'APPROVED' },
              include: { checkinComments: true },
            },
          },
        },
        checkinComments: true,
      },
    });

    const managerEffectiveness = managers.map(m => {
      const totalSheets = m.reports.flatMap(r => r.goalSheets).length;
      const quarterCompletion = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
        quarter: q,
        completed: m.checkinComments.filter(c => c.quarter === q).length,
        total: totalSheets,
        rate: totalSheets > 0
          ? Math.round(m.checkinComments.filter(c => c.quarter === q).length / totalSheets * 100)
          : 0,
      }));
      const overallRate = totalSheets > 0
        ? Math.round(m.checkinComments.length / (totalSheets * 4) * 100)
        : 0;
      return { name: m.name, totalReports: m.reports.length, totalSheets, overallRate, quarterCompletion };
    });

    // 7. Individual performance for team view (manager sees team trends)
    let teamTrends = [];
    if (session.role === 'MANAGER') {
      const teamSheets = approvedSheets.filter(s =>
        s.goals.length > 0 // filter to team if needed
      );
      teamTrends = teamSheets.map(s => ({
        name: s.user.name,
        quarters: ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
          const updates = s.goals.flatMap(g => g.quarterlyUpdates.filter(u => u.quarter === q));
          const weighted = s.goals.map(g => {
            const upd = g.quarterlyUpdates.find(u => u.quarter === q);
            return upd ? (upd.computedScore * g.weightage / 100) : 0;
          });
          return { quarter: q, score: Math.round(weighted.reduce((a, b) => a + b, 0) * 100) / 100 };
        }),
      }));
    }

    // 8. Heatmap data — completion by department × quarter
    const heatmapData = departments.map(dept => {
      const row = { department: dept.name };
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        const totalApproved = dept.users.flatMap(u => u.goalSheets).length;
        const withUpdates = dept.users.filter(u =>
          u.goalSheets.some(s => s.goals.some(g =>
            g.quarterlyUpdates.some(qu => qu.quarter === q)
          ))
        ).length;
        row[q] = totalApproved > 0 ? Math.round(withUpdates / totalApproved * 100) : 0;
      });
      return row;
    });

    return NextResponse.json({
      qoqTrends,
      deptTrends,
      thrustAreaDist,
      uomDist,
      statusDist,
      managerEffectiveness,
      teamTrends,
      heatmapData,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
