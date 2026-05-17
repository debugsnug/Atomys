import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/cycles — Get all cycles (any authenticated user can view)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cycles = await prisma.cycle.findMany({
      orderBy: { windowOpen: 'asc' },
    });
    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('Cycles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/cycles — Update cycle
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isActive } = await request.json();

    await prisma.cycle.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cycle update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
