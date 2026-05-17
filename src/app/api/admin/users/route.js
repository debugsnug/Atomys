import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/users — Get all users
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        manager: { select: { id: true, name: true } },
        _count: { select: { goalSheets: true, reports: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
