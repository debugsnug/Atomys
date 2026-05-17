import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/admin/unlock — Unlock goal sheet for editing
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sheetId } = await request.json();

    const sheet = await prisma.goalSheet.findFirst({
      where: { id: sheetId },
      include: { user: true },
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Goal sheet not found' }, { status: 404 });
    }

    await prisma.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: 'DRAFT',
        lockedAt: null,
        approvedAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'GOAL_SHEET_UNLOCKED',
        details: `Admin ${session.name} unlocked goal sheet #${sheetId} for ${sheet.user.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
