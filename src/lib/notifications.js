/**
 * 5.2 — Email & Microsoft Teams Integration
 * Automated notifications for key events with deep-link support
 */

import nodemailer from 'nodemailer';
import prisma from './prisma';

// ─── Email Configuration ───
const emailTransporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

const FROM_EMAIL = process.env.SMTP_FROM || 'goalsync@company.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ─── Teams Webhook Configuration ───
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

// ─── Email Templates ───
const EMAIL_TEMPLATES = {
  GOAL_SUBMITTED: (data) => ({
    subject: `🎯 Goal Sheet Submitted by ${data.employeeName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1b2e;color:#e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#818cf8;">Goal Sheet Submitted</h2>
        <p><strong>${data.employeeName}</strong> has submitted their goal sheet for the <strong>${data.cycle}</strong> cycle.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid #334155;"><td style="padding:8px;color:#94a3b8;">Goals</td><td style="padding:8px;">${data.goalCount}</td></tr>
          <tr style="border-bottom:1px solid #334155;"><td style="padding:8px;color:#94a3b8;">Department</td><td style="padding:8px;">${data.department}</td></tr>
        </table>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Review in GoalSync →</a>
      </div>`,
  }),
  GOAL_APPROVED: (data) => ({
    subject: `✅ Your Goal Sheet has been Approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1b2e;color:#e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#10b981;">Goal Sheet Approved!</h2>
        <p>Your goal sheet for <strong>${data.cycle}</strong> has been approved by <strong>${data.managerName}</strong>.</p>
        <p>Your goals are now locked. You can start logging quarterly achievements.</p>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;margin-top:16px;">View Goals →</a>
      </div>`,
  }),
  GOAL_RETURNED: (data) => ({
    subject: `⚠️ Goal Sheet Returned for Rework`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1b2e;color:#e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#ef4444;">Goal Sheet Returned</h2>
        <p>Your goal sheet has been returned by <strong>${data.managerName}</strong> with the following feedback:</p>
        <blockquote style="border-left:4px solid #ef4444;padding:12px;margin:16px 0;background:rgba(239,68,68,0.1);border-radius:0 8px 8px 0;">${data.returnNote}</blockquote>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Edit Goals →</a>
      </div>`,
  }),
  CHECKIN_REMINDER: (data) => ({
    subject: `📋 ${data.quarter} Check-in Reminder`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1b2e;color:#e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#f59e0b;">${data.quarter} Check-in Window Open</h2>
        <p>The ${data.quarter} check-in window is now open until <strong>${data.windowClose}</strong>.</p>
        <p>Please log your actual achievements against planned targets.</p>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Log Achievements →</a>
      </div>`,
  }),
  ESCALATION: (data) => ({
    subject: `🚨 Escalation: ${data.ruleName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1b2e;color:#e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#ef4444;">Escalation Alert</h2>
        <p><strong>${data.details}</strong></p>
        <p>Level: ${data.level === 1 ? 'Employee' : data.level === 2 ? 'Manager' : 'HR / Skip-Level'}</p>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;text-decoration:none;border-radius:8px;margin-top:16px;">Take Action →</a>
      </div>`,
  }),
};

// ─── Teams Adaptive Card Templates ───
function createTeamsCard(type, data) {
  const deepLink = `${APP_URL}`;
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: `🎯 GoalSync — ${type.replace(/_/g, ' ')}`, weight: 'Bolder', size: 'Medium', color: 'Accent' },
          { type: 'TextBlock', text: data.details || data.subject, wrap: true },
          ...(data.employeeName ? [{ type: 'FactSet', facts: [
            { title: 'Employee', value: data.employeeName },
            ...(data.department ? [{ title: 'Department', value: data.department }] : []),
            ...(data.goalCount ? [{ title: 'Goals', value: String(data.goalCount) }] : []),
          ]}] : []),
        ],
        actions: [{ type: 'Action.OpenUrl', title: 'Open in GoalSync', url: deepLink }],
      },
    }],
  };
}

// ─── Core Notification Functions ───

/**
 * Send an email notification
 */
async function sendEmail(to, template) {
  if (!emailTransporter) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${template.subject}`);
    return { success: true, stub: true };
  }

  try {
    await emailTransporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a Teams notification via webhook
 */
async function sendTeamsNotification(card) {
  if (!TEAMS_WEBHOOK_URL) {
    console.log('[TEAMS STUB] Card:', JSON.stringify(card).slice(0, 100));
    return { success: true, stub: true };
  }

  try {
    const res = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    return { success: res.ok };
  } catch (error) {
    console.error('Teams send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main notification dispatch — sends to all configured channels and logs to DB
 */
export async function sendNotification(type, userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const template = EMAIL_TEMPLATES[type];
  if (!template) return;

  const emailContent = template(data);

  // Send Email
  const emailResult = await sendEmail(user.email, emailContent);
  await prisma.notification.create({
    data: {
      userId,
      channel: 'EMAIL',
      type,
      subject: emailContent.subject,
      body: emailContent.html,
      status: emailResult.success ? 'SENT' : 'FAILED',
      sentAt: emailResult.success ? new Date() : null,
      metadata: JSON.stringify({ deepLink: APP_URL }),
    },
  });

  // Send Teams notification
  const teamsCard = createTeamsCard(type, { ...data, subject: emailContent.subject });
  const teamsResult = await sendTeamsNotification(teamsCard);
  await prisma.notification.create({
    data: {
      userId,
      channel: 'TEAMS',
      type,
      subject: emailContent.subject,
      body: JSON.stringify(teamsCard),
      status: teamsResult.success ? 'SENT' : 'FAILED',
      sentAt: teamsResult.success ? new Date() : null,
      metadata: JSON.stringify({ deepLink: APP_URL, cardType: 'AdaptiveCard' }),
    },
  });

  // In-app notification (always created)
  await prisma.notification.create({
    data: {
      userId,
      channel: 'IN_APP',
      type,
      subject: emailContent.subject,
      body: data.details || emailContent.subject,
      status: 'SENT',
      sentAt: new Date(),
      metadata: JSON.stringify({ deepLink: APP_URL }),
    },
  });

  return { email: emailResult, teams: teamsResult };
}
