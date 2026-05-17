import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/notifications — Get notifications for current user
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || 'IN_APP';

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id, channel },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Also get all notification stats for admin view
    let stats = null;
    if (session.role === 'ADMIN') {
      const total = await prisma.notification.count();
      const sent = await prisma.notification.count({ where: { status: 'SENT' } });
      const failed = await prisma.notification.count({ where: { status: 'FAILED' } });
      const byChannel = {
        email: await prisma.notification.count({ where: { channel: 'EMAIL' } }),
        teams: await prisma.notification.count({ where: { channel: 'TEAMS' } }),
        inApp: await prisma.notification.count({ where: { channel: 'IN_APP' } }),
      };
      stats = { total, sent, failed, byChannel };
    }

    return NextResponse.json({ notifications, stats });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
