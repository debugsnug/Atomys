import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { runEscalationEngine } from '@/lib/escalation-engine';

// GET /api/escalations — Get escalation rules and triggered escalations
export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all'; // rules, logs, all

    const rules = await prisma.escalationRule.findMany({
      include: { _count: { select: { escalations: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const escalations = await prisma.escalation.findMany({
      include: {
        rule: true,
        targetUser: { select: { name: true, email: true, role: true, department: true, manager: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ rules, escalations });
  } catch (error) {
    console.error('Escalation fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/escalations — Create rule, run engine, or resolve escalation
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'RUN_ENGINE') {
      const results = await runEscalationEngine();
      return NextResponse.json({ success: true, results, message: `Processed ${results.length} escalation(s)` });
    }

    if (body.action === 'CREATE_RULE') {
      const rule = await prisma.escalationRule.create({
        data: {
          name: body.name,
          trigger: body.trigger,
          thresholdDays: body.thresholdDays || 7,
          isActive: true,
        },
      });
      return NextResponse.json({ success: true, rule });
    }

    if (body.action === 'TOGGLE_RULE') {
      await prisma.escalationRule.update({
        where: { id: body.ruleId },
        data: { isActive: body.isActive },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'RESOLVE') {
      await prisma.escalation.update({
        where: { id: body.escalationId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Escalation action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
