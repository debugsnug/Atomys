import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
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

  // Create Departments
  const engineering = await prisma.department.create({ data: { name: 'Engineering' } });
  const sales = await prisma.department.create({ data: { name: 'Sales' } });
  const hr = await prisma.department.create({ data: { name: 'Human Resources' } });
  const operations = await prisma.department.create({ data: { name: 'Operations' } });

  // Create Thrust Areas
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

  const pwd = hashSync('demo123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'admin@demo.com',
      passwordHash: pwd,
      role: 'ADMIN',
      departmentId: hr.id,
    },
  });

  // Create Managers
  const manager1 = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'manager@demo.com',
      passwordHash: pwd,
      role: 'MANAGER',
      departmentId: engineering.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'manager2@demo.com',
      passwordHash: pwd,
      role: 'MANAGER',
      departmentId: sales.id,
    },
  });

  // Create Employees
  const emp1 = await prisma.user.create({
    data: {
      name: 'Arjun Kumar',
      email: 'employee@demo.com',
      passwordHash: pwd,
      role: 'EMPLOYEE',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name: 'Kavitha Nair',
      email: 'employee2@demo.com',
      passwordHash: pwd,
      role: 'EMPLOYEE',
      departmentId: engineering.id,
      managerId: manager1.id,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      name: 'Deepak Joshi',
      email: 'employee3@demo.com',
      passwordHash: pwd,
      role: 'EMPLOYEE',
      departmentId: sales.id,
      managerId: manager2.id,
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      name: 'Meera Reddy',
      email: 'employee4@demo.com',
      passwordHash: pwd,
      role: 'EMPLOYEE',
      departmentId: operations.id,
      managerId: manager1.id,
    },
  });

  // Create Cycles
  await prisma.cycle.createMany({
    data: [
      {
        name: '2025-26 Goal Setting',
        phase: 'GOAL_SETTING',
        windowOpen: new Date('2025-05-01'),
        windowClose: new Date('2025-06-30'),
        isActive: true,
      },
      {
        name: '2025-26 Q1 Check-in',
        phase: 'Q1',
        windowOpen: new Date('2025-07-01'),
        windowClose: new Date('2025-07-31'),
        isActive: true,
      },
      {
        name: '2025-26 Q2 Check-in',
        phase: 'Q2',
        windowOpen: new Date('2025-10-01'),
        windowClose: new Date('2025-10-31'),
        isActive: true,
      },
      {
        name: '2025-26 Q3 Check-in',
        phase: 'Q3',
        windowOpen: new Date('2026-01-01'),
        windowClose: new Date('2026-01-31'),
        isActive: true,
      },
      {
        name: '2025-26 Q4 / Annual',
        phase: 'Q4',
        windowOpen: new Date('2026-03-01'),
        windowClose: new Date('2026-04-30'),
        isActive: true,
      },
    ],
  });

  // Create a sample approved goal sheet for employee1
  const sheet1 = await prisma.goalSheet.create({
    data: {
      userId: emp1.id,
      cycle: '2025-26',
      status: 'APPROVED',
      submittedAt: new Date('2025-05-10'),
      approvedAt: new Date('2025-05-15'),
      lockedAt: new Date('2025-05-15'),
    },
  });

  // Add goals for employee1
  const goal1 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustAreaId: thrustAreas[0].id, // Product Development
      title: 'Deliver Feature Module v2.0',
      description: 'Complete development and testing of the new feature module with zero critical bugs',
      uomType: 'NUMERIC_MIN',
      target: 5,
      weightage: 30,
      sortOrder: 1,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustAreaId: thrustAreas[1].id, // Code Quality
      title: 'Reduce Bug Density',
      description: 'Bring down bug density per KLOC to under 2.0',
      uomType: 'NUMERIC_MAX',
      target: 2.0,
      weightage: 20,
      sortOrder: 2,
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustAreaId: thrustAreas[1].id,
      title: 'Unit Test Coverage',
      description: 'Achieve 85% unit test coverage across all modules',
      uomType: 'PERCENT_MIN',
      target: 85,
      weightage: 20,
      sortOrder: 3,
    },
  });

  const goal4 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustAreaId: thrustAreas[2].id,
      title: 'Complete ML Integration POC',
      description: 'Deliver proof of concept for ML-based recommendation engine',
      uomType: 'TIMELINE',
      target: 0,
      targetDate: '2025-09-30',
      weightage: 20,
      sortOrder: 4,
    },
  });

  const goal5 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustAreaId: thrustAreas[2].id,
      title: 'Zero Security Incidents',
      description: 'Maintain zero security incidents across all deployed services',
      uomType: 'ZERO',
      target: 0,
      weightage: 10,
      sortOrder: 5,
    },
  });

  // Add quarterly updates for Q1
  await prisma.quarterlyUpdate.createMany({
    data: [
      { goalId: goal1.id, quarter: 'Q1', actualValue: 2, status: 'ON_TRACK', computedScore: 40 },
      { goalId: goal2.id, quarter: 'Q1', actualValue: 2.5, status: 'ON_TRACK', computedScore: 80 },
      { goalId: goal3.id, quarter: 'Q1', actualValue: 65, status: 'ON_TRACK', computedScore: 76.5 },
      { goalId: goal4.id, quarter: 'Q1', actualValue: 0, status: 'ON_TRACK', computedScore: 50 },
      { goalId: goal5.id, quarter: 'Q1', actualValue: 0, status: 'ON_TRACK', computedScore: 100 },
    ],
  });

  // Add a checkin comment
  await prisma.checkinComment.create({
    data: {
      goalSheetId: sheet1.id,
      managerId: manager1.id,
      quarter: 'Q1',
      comment: 'Good progress on all fronts. Feature module on track. Keep focus on test coverage improvement. ML POC research phase going well.',
    },
  });

  // Create a draft goal sheet for employee2
  await prisma.goalSheet.create({
    data: {
      userId: emp2.id,
      cycle: '2025-26',
      status: 'DRAFT',
    },
  });

  // Create a submitted goal sheet for employee3
  const sheet3 = await prisma.goalSheet.create({
    data: {
      userId: emp3.id,
      cycle: '2025-26',
      status: 'SUBMITTED',
      submittedAt: new Date('2025-05-12'),
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        goalSheetId: sheet3.id,
        thrustAreaId: thrustAreas[3].id,
        title: 'Achieve Q1 Revenue Target',
        description: 'Close deals worth ₹50L in Q1',
        uomType: 'NUMERIC_MIN',
        target: 50,
        weightage: 35,
        sortOrder: 1,
      },
      {
        goalSheetId: sheet3.id,
        thrustAreaId: thrustAreas[4].id,
        title: 'New Client Onboarding',
        description: 'Onboard 10 new enterprise clients',
        uomType: 'NUMERIC_MIN',
        target: 10,
        weightage: 25,
        sortOrder: 2,
      },
      {
        goalSheetId: sheet3.id,
        thrustAreaId: thrustAreas[3].id,
        title: 'Customer Retention Rate',
        description: 'Maintain 95%+ customer retention rate',
        uomType: 'PERCENT_MIN',
        target: 95,
        weightage: 20,
        sortOrder: 3,
      },
      {
        goalSheetId: sheet3.id,
        thrustAreaId: thrustAreas[4].id,
        title: 'Reduce Customer Churn',
        description: 'Bring churn rate below 5%',
        uomType: 'PERCENT_MAX',
        target: 5,
        weightage: 20,
        sortOrder: 4,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo Credentials:');
  console.log('─────────────────────────────');
  console.log('Admin:    admin@demo.com / demo123');
  console.log('Manager:  manager@demo.com / demo123');
  console.log('Employee: employee@demo.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
