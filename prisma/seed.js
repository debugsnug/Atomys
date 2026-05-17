const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  const hr = await prisma.department.create({ data: { name: 'Human Resources' } });
  const operations = await prisma.department.create({ data: { name: 'Operations' } });

  const thrustAreas = await Promise.all([
    prisma.thrustArea.create({ data: { name: 'Product Development', departmentId: engineering.id } }),
    prisma.thrustArea.create({ data: { name: 'Code Quality', departmentId: engineering.id } }),
    prisma.thrustArea.create({ data: { name: 'Innovation', departmentId: engineering.id } }),
    prisma.thrustArea.create({ data: { name: 'Revenue Growth', departmentId: sales.id } }),
    prisma.thrustArea.create({ data: { name: 'Customer Acquisition', departmentId: sales.id } }),
    prisma.thrustArea.create({ data: { name: 'Talent Management', departmentId: hr.id } }),
    prisma.thrustArea.create({ data: { name: 'Employee Engagement', departmentId: hr.id } }),
    prisma.thrustArea.create({ data: { name: 'Process Efficiency', departmentId: operations.id } }),
    prisma.thrustArea.create({ data: { name: 'Cost Optimization', departmentId: operations.id } }),
    prisma.thrustArea.create({ data: { name: 'Safety & Compliance', departmentId: operations.id } }),
  ]);

  const pwd = bcryptjs.hashSync('demo123', 10);

  await prisma.user.create({ data: { name: 'Priya Sharma', email: 'admin@demo.com', passwordHash: pwd, role: 'ADMIN', departmentId: hr.id } });
  const m1 = await prisma.user.create({ data: { name: 'Rahul Verma', email: 'manager@demo.com', passwordHash: pwd, role: 'MANAGER', departmentId: engineering.id } });
  const m2 = await prisma.user.create({ data: { name: 'Sneha Patel', email: 'manager2@demo.com', passwordHash: pwd, role: 'MANAGER', departmentId: sales.id } });
  const e1 = await prisma.user.create({ data: { name: 'Arjun Kumar', email: 'employee@demo.com', passwordHash: pwd, role: 'EMPLOYEE', departmentId: engineering.id, managerId: m1.id } });
  await prisma.user.create({ data: { name: 'Kavitha Nair', email: 'employee2@demo.com', passwordHash: pwd, role: 'EMPLOYEE', departmentId: engineering.id, managerId: m1.id } });
  const e3 = await prisma.user.create({ data: { name: 'Deepak Joshi', email: 'employee3@demo.com', passwordHash: pwd, role: 'EMPLOYEE', departmentId: sales.id, managerId: m2.id } });
  await prisma.user.create({ data: { name: 'Meera Reddy', email: 'employee4@demo.com', passwordHash: pwd, role: 'EMPLOYEE', departmentId: operations.id, managerId: m1.id } });

  await prisma.cycle.createMany({ data: [
    { name: '2025-26 Goal Setting', phase: 'GOAL_SETTING', windowOpen: new Date('2025-05-01'), windowClose: new Date('2025-06-30'), isActive: true },
    { name: '2025-26 Q1', phase: 'Q1', windowOpen: new Date('2025-07-01'), windowClose: new Date('2025-07-31'), isActive: true },
    { name: '2025-26 Q2', phase: 'Q2', windowOpen: new Date('2025-10-01'), windowClose: new Date('2025-10-31'), isActive: true },
    { name: '2025-26 Q3', phase: 'Q3', windowOpen: new Date('2026-01-01'), windowClose: new Date('2026-01-31'), isActive: true },
    { name: '2025-26 Q4', phase: 'Q4', windowOpen: new Date('2026-03-01'), windowClose: new Date('2026-04-30'), isActive: true },
  ]});

  const s1 = await prisma.goalSheet.create({ data: { userId: e1.id, cycle: '2025-26', status: 'APPROVED', submittedAt: new Date('2025-05-10'), approvedAt: new Date('2025-05-15'), lockedAt: new Date('2025-05-15') } });

  const g1 = await prisma.goal.create({ data: { goalSheetId: s1.id, thrustAreaId: thrustAreas[0].id, title: 'Deliver Feature Module v2.0', description: 'Complete development and testing', uomType: 'NUMERIC_MIN', target: 5, weightage: 30, sortOrder: 1 } });
  const g2 = await prisma.goal.create({ data: { goalSheetId: s1.id, thrustAreaId: thrustAreas[1].id, title: 'Reduce Bug Density', description: 'Bug density per KLOC under 2.0', uomType: 'NUMERIC_MAX', target: 2.0, weightage: 20, sortOrder: 2 } });
  const g3 = await prisma.goal.create({ data: { goalSheetId: s1.id, thrustAreaId: thrustAreas[1].id, title: 'Unit Test Coverage', description: 'Achieve 85% coverage', uomType: 'PERCENT_MIN', target: 85, weightage: 20, sortOrder: 3 } });
  const g4 = await prisma.goal.create({ data: { goalSheetId: s1.id, thrustAreaId: thrustAreas[2].id, title: 'Complete ML Integration POC', description: 'ML recommendation engine', uomType: 'TIMELINE', target: 0, targetDate: '2025-09-30', weightage: 20, sortOrder: 4 } });
  const g5 = await prisma.goal.create({ data: { goalSheetId: s1.id, thrustAreaId: thrustAreas[2].id, title: 'Zero Security Incidents', description: 'Zero incidents', uomType: 'ZERO', target: 0, weightage: 10, sortOrder: 5 } });

  await prisma.quarterlyUpdate.createMany({ data: [
    { goalId: g1.id, quarter: 'Q1', actualValue: 2, status: 'ON_TRACK', computedScore: 40 },
    { goalId: g2.id, quarter: 'Q1', actualValue: 2.5, status: 'ON_TRACK', computedScore: 80 },
    { goalId: g3.id, quarter: 'Q1', actualValue: 65, status: 'ON_TRACK', computedScore: 76.5 },
    { goalId: g4.id, quarter: 'Q1', actualValue: 0, status: 'ON_TRACK', computedScore: 50 },
    { goalId: g5.id, quarter: 'Q1', actualValue: 0, status: 'ON_TRACK', computedScore: 100 },
  ]});

  await prisma.checkinComment.create({ data: { goalSheetId: s1.id, managerId: m1.id, quarter: 'Q1', comment: 'Good progress. Feature module on track. Focus on test coverage.' } });

  const s3 = await prisma.goalSheet.create({ data: { userId: e3.id, cycle: '2025-26', status: 'SUBMITTED', submittedAt: new Date('2025-05-12') } });
  await prisma.goal.createMany({ data: [
    { goalSheetId: s3.id, thrustAreaId: thrustAreas[3].id, title: 'Achieve Q1 Revenue Target', description: 'Close deals worth 50L', uomType: 'NUMERIC_MIN', target: 50, weightage: 35, sortOrder: 1 },
    { goalSheetId: s3.id, thrustAreaId: thrustAreas[4].id, title: 'New Client Onboarding', description: 'Onboard 10 clients', uomType: 'NUMERIC_MIN', target: 10, weightage: 25, sortOrder: 2 },
    { goalSheetId: s3.id, thrustAreaId: thrustAreas[3].id, title: 'Customer Retention Rate', description: '95%+ retention', uomType: 'PERCENT_MIN', target: 95, weightage: 20, sortOrder: 3 },
    { goalSheetId: s3.id, thrustAreaId: thrustAreas[4].id, title: 'Reduce Customer Churn', description: 'Churn below 5%', uomType: 'PERCENT_MAX', target: 5, weightage: 20, sortOrder: 4 },
  ]});

  // Seed default escalation rules (5.3)
  await prisma.escalation.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.notification.deleteMany();

  await prisma.escalationRule.create({
    data: { name: 'Late Goal Submission', trigger: 'NO_SUBMISSION', thresholdDays: 7, isActive: true },
  });
  await prisma.escalationRule.create({
    data: { name: 'Pending Manager Approval', trigger: 'NO_APPROVAL', thresholdDays: 5, isActive: true },
  });
  await prisma.escalationRule.create({
    data: { name: 'Missed Quarterly Check-in', trigger: 'NO_CHECKIN', thresholdDays: 10, isActive: true },
  });

  console.log('✅ Database seeded!');
  console.log('Admin:    admin@demo.com / demo123');
  console.log('Manager:  manager@demo.com / demo123');
  console.log('Employee: employee@demo.com / demo123');
  console.log('Escalation rules: 3 default rules created');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
