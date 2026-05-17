import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/notifications/teams
 * 
 * Sends an Adaptive Card notification to a Microsoft Teams channel via Incoming Webhook.
 * Set TEAMS_WEBHOOK_URL in .env to enable.
 * 
 * Supported event types:
 *   - goal_sheet_submitted   → notifies manager
 *   - goal_sheet_approved    → notifies employee
 *   - goal_sheet_returned    → notifies employee with feedback
 *   - checkin_reminder       → reminds employees of deadline
 *   - escalation_raised      → notifies HR / skip-level
 */
export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    // Gracefully degrade — log but don't break the app
    return NextResponse.json({ sent: false, reason: 'TEAMS_WEBHOOK_URL not configured' });
  }

  const body = await request.json();
  const { eventType, payload } = body;

  const card = buildAdaptiveCard(eventType, payload);
  if (!card) {
    return NextResponse.json({ sent: false, reason: 'Unknown event type' });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Teams webhook error:', text);
      return NextResponse.json({ sent: false, reason: 'Teams webhook returned error', detail: text });
    }

    return NextResponse.json({ sent: true, eventType });
  } catch (err) {
    console.error('Teams notification failed:', err);
    return NextResponse.json({ sent: false, reason: err.message }, { status: 500 });
  }
}

/**
 * Build an Adaptive Card payload for each event type.
 * https://adaptivecards.io/designer
 */
function buildAdaptiveCard(eventType, payload) {
  const BASE_CARD = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: null,
    }],
  };

  const brandColor = '#00b2a9'; // Atomberg teal

  const templates = {
    goal_sheet_submitted: {
      '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        { type: 'TextBlock', text: '📋 New Goal Sheet Submitted', weight: 'Bolder', size: 'Medium', color: 'Accent' },
        { type: 'TextBlock', text: `**${payload.employeeName}** has submitted their goal sheet for **${payload.cycle || 'FY 2025'}**.`, wrap: true },
        { type: 'FactSet', facts: [
          { title: 'Department', value: payload.department || '—' },
          { title: 'Goals', value: String(payload.goalCount || 0) },
          { title: 'Submitted At', value: new Date().toLocaleString('en-IN') },
        ]},
        { type: 'TextBlock', text: 'Please review and approve or return with feedback.', wrap: true, isSubtle: true },
      ],
      actions: [{
        type: 'Action.OpenUrl',
        title: '🔍 Review in ATOMYS',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?nav=team-review`,
      }],
    },

    goal_sheet_approved: {
      '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        { type: 'TextBlock', text: '✅ Goal Sheet Approved!', weight: 'Bolder', size: 'Medium', color: 'Good' },
        { type: 'TextBlock', text: `Your goal sheet has been **approved** by **${payload.managerName}**.`, wrap: true },
        { type: 'FactSet', facts: [
          { title: 'Cycle', value: payload.cycle || 'FY 2025' },
          { title: 'Approved At', value: new Date().toLocaleString('en-IN') },
        ]},
        { type: 'TextBlock', text: 'Your goals are now locked. Start your Q1 check-in when the window opens.', wrap: true, isSubtle: true },
      ],
      actions: [{
        type: 'Action.OpenUrl',
        title: '📊 View My Goals',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?nav=my-goals`,
      }],
    },

    goal_sheet_returned: {
      '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        { type: 'TextBlock', text: '🔄 Goal Sheet Returned for Revision', weight: 'Bolder', size: 'Medium', color: 'Warning' },
        { type: 'TextBlock', text: `**${payload.managerName}** has returned your goal sheet with feedback.`, wrap: true },
        { type: 'TextBlock', text: `**Feedback:** ${payload.feedback || 'No specific feedback provided.'}`, wrap: true, color: 'Warning' },
        { type: 'TextBlock', text: 'Please revise your goals and resubmit.', wrap: true, isSubtle: true },
      ],
      actions: [{
        type: 'Action.OpenUrl',
        title: '✏️ Revise Goals',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?nav=goal-create`,
      }],
    },

    escalation_raised: {
      '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        { type: 'TextBlock', text: '🚨 Escalation Raised', weight: 'Bolder', size: 'Medium', color: 'Attention' },
        { type: 'TextBlock', text: `**${payload.raisedBy}** has raised an escalation.`, wrap: true },
        { type: 'FactSet', facts: [
          { title: 'Reason', value: payload.reason || '—' },
          { title: 'Priority', value: payload.priority || 'Normal' },
          { title: 'Raised At', value: new Date().toLocaleString('en-IN') },
        ]},
        { type: 'TextBlock', text: 'Please review and resolve this in the ATOMYS portal.', wrap: true, isSubtle: true },
      ],
      actions: [{
        type: 'Action.OpenUrl',
        title: '⚡ View Escalation',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?nav=escalations`,
      }],
    },
  };

  const cardContent = templates[eventType];
  if (!cardContent) return null;

  return { ...BASE_CARD, attachments: [{ ...BASE_CARD.attachments[0], content: cardContent }] };
}
