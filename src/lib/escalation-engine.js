/**
 * 5.3 — Escalation Module (Rule-Based)
 * Auto-detects overdue items and escalates through the chain
 */

import prisma from './prisma';
import { sendNotification } from './notifications';

/**
 * Run the escalation engine — checks all active rules against current data
 * Called manually via API or on a cron schedule
 */
export async function runEscalationEngine() {
  const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });
  const results = [];

  for (const rule of rules) {
    switch (rule.trigger) {
      case 'NO_SUBMISSION':
        results.push(...(await checkNoSubmission(rule)));
        break;
      case 'NO_APPROVAL':
        results.push(...(await checkNoApproval(rule)));
        break;
      case 'NO_CHECKIN':
        results.push(...(await checkNoCheckin(rule)));
        break;
    }
  }

  return results;
}

/**
 * Check: employees who haven't submitted goals within N days of cycle open
 */
async function checkNoSubmission(rule) {
  const cycle = await prisma.cycle.findFirst({
    where: { phase: 'GOAL_SETTING', isActive: true },
  });
  if (!cycle) return [];

  const now = new Date();
  const windowOpen = new Date(cycle.windowOpen);
  const daysSinceOpen = Math.floor((now - windowOpen) / (1000 * 60 * 60 * 24));

  if (daysSinceOpen < rule.thresholdDays) return [];

  // Find employees without any submitted/approved goal sheet
  const employees = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      goalSheets: { none: { status: { in: ['SUBMITTED', 'APPROVED'] } } },
    },
    include: { manager: true },
  });

  const escalations = [];
  for (const emp of employees) {
    // Check if already escalated for this rule
    const existing = await prisma.escalation.findFirst({
      where: { ruleId: rule.id, targetUserId: emp.id, status: 'OPEN' },
    });

    if (existing) {
      // Escalate to next level if enough time has passed
      const escalationAge = Math.floor((now - new Date(existing.createdAt)) / (1000 * 60 * 60 * 24));
      if (escalationAge >= rule.thresholdDays && existing.level < 3) {
        await prisma.escalation.update({
          where: { id: existing.id },
          data: { level: existing.level + 1 },
        });

        // Notify next level
        const nextTarget = existing.level + 1 === 2 ? emp.managerId : null;
        if (nextTarget) {
          await sendNotification('ESCALATION', nextTarget, {
            ruleName: rule.name,
            details: `${emp.name} has not submitted their goal sheet (${daysSinceOpen} days overdue). Escalated to Level ${existing.level + 1}.`,
            level: existing.level + 1,
          });
        }
        escalations.push({ rule: rule.name, user: emp.name, level: existing.level + 1, action: 'ESCALATED' });
      }
    } else {
      // Create initial escalation
      const esc = await prisma.escalation.create({
        data: {
          ruleId: rule.id,
          targetUserId: emp.id,
          level: 1,
          details: `${emp.name} has not submitted goals. Cycle opened ${daysSinceOpen} days ago.`,
        },
      });

      // Notify the employee
      await sendNotification('ESCALATION', emp.id, {
        ruleName: rule.name,
        details: `You have not submitted your goal sheet. The cycle opened ${daysSinceOpen} days ago. Please submit your goals.`,
        level: 1,
      });
      escalations.push({ rule: rule.name, user: emp.name, level: 1, action: 'CREATED' });
    }
  }

  return escalations;
}

/**
 * Check: managers who haven't approved goals within N days of submission
 */
async function checkNoApproval(rule) {
  const now = new Date();

  const pendingSheets = await prisma.goalSheet.findMany({
    where: { status: 'SUBMITTED' },
    include: { user: { include: { manager: true } } },
  });

  const escalations = [];
  for (const sheet of pendingSheets) {
    const daysSinceSubmission = Math.floor((now - new Date(sheet.submittedAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceSubmission < rule.thresholdDays) continue;

    const managerId = sheet.user.managerId;
    if (!managerId) continue;

    const existing = await prisma.escalation.findFirst({
      where: { ruleId: rule.id, targetUserId: managerId, status: 'OPEN' },
    });

    if (!existing) {
      await prisma.escalation.create({
        data: {
          ruleId: rule.id,
          targetUserId: managerId,
          level: 1,
          details: `Manager has not approved ${sheet.user.name}'s goal sheet (submitted ${daysSinceSubmission} days ago).`,
        },
      });

      await sendNotification('ESCALATION', managerId, {
        ruleName: rule.name,
        details: `${sheet.user.name}'s goal sheet has been pending your approval for ${daysSinceSubmission} days.`,
        level: 1,
      });
      escalations.push({ rule: rule.name, user: sheet.user.manager?.name, level: 1, action: 'CREATED' });
    } else if (existing.level < 3) {
      const escalationAge = Math.floor((now - new Date(existing.createdAt)) / (1000 * 60 * 60 * 24));
      if (escalationAge >= rule.thresholdDays * 2) {
        await prisma.escalation.update({
          where: { id: existing.id },
          data: { level: Math.min(existing.level + 1, 3) },
        });
        escalations.push({ rule: rule.name, user: sheet.user.manager?.name, level: existing.level + 1, action: 'ESCALATED' });
      }
    }
  }

  return escalations;
}

/**
 * Check: employees/managers who haven't completed quarterly check-in
 */
async function checkNoCheckin(rule) {
  const now = new Date();

  // Find the currently active quarter
  const activeCycle = await prisma.cycle.findFirst({
    where: {
      phase: { in: ['Q1', 'Q2', 'Q3', 'Q4'] },
      isActive: true,
      windowOpen: { lte: now },
      windowClose: { gte: now },
    },
  });

  if (!activeCycle) return [];

  const daysSinceOpen = Math.floor((now - new Date(activeCycle.windowOpen)) / (1000 * 60 * 60 * 24));
  if (daysSinceOpen < rule.thresholdDays) return [];

  // Find approved sheets without updates for this quarter
  const sheetsWithoutUpdates = await prisma.goalSheet.findMany({
    where: {
      status: 'APPROVED',
      goals: { none: { quarterlyUpdates: { some: { quarter: activeCycle.phase } } } },
    },
    include: { user: { include: { manager: true } } },
  });

  const escalations = [];
  for (const sheet of sheetsWithoutUpdates) {
    const existing = await prisma.escalation.findFirst({
      where: { ruleId: rule.id, targetUserId: sheet.userId, status: 'OPEN' },
    });

    if (!existing) {
      await prisma.escalation.create({
        data: {
          ruleId: rule.id,
          targetUserId: sheet.userId,
          level: 1,
          details: `${sheet.user.name} has not completed ${activeCycle.phase} check-in (${daysSinceOpen} days into window).`,
        },
      });

      await sendNotification('CHECKIN_REMINDER', sheet.userId, {
        quarter: activeCycle.phase,
        windowClose: new Date(activeCycle.windowClose).toLocaleDateString(),
      });
      escalations.push({ rule: rule.name, user: sheet.user.name, level: 1, action: 'CREATED' });
    }
  }

  return escalations;
}
