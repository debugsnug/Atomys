import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/goals/checkin — Manager adds check-in comment
export async function POST(request) {
  const session = await getSession();
  if (!session || !['MANAGER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sheetId, quarter, comment } = await request.json();

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    const sheet = await prisma.goalSheet.findFirst({
      where: { id: sheetId, status: 'APPROVED' },
    });

    if (!sheet) {
      return NextResponse.json({ error: 'Goal sheet not found or not approved' }, { status: 404 });
    }

    await prisma.checkinComment.create({
      data: {
        goalSheetId: sheetId,
        managerId: session.id,
        quarter,
        comment: comment.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'CHECKIN_COMMENT_ADDED',
        details: `${quarter} check-in comment added for goal sheet #${sheetId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
