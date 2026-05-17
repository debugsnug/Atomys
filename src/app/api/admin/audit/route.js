import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/audit — Get audit logs
export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        goal: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
