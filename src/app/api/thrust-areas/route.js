import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/thrust-areas — Get thrust areas for current user's department
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const areas = await prisma.thrustArea.findMany({
      where: session.role === 'ADMIN' ? {} : { departmentId: session.departmentId },
      include: { department: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ areas });
  } catch (error) {
    console.error('Thrust areas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
