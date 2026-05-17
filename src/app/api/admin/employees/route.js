import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/admin/employees — Get employees for selection (managers/admins)
export async function GET() {
  const session = await getSession();
  if (!session || !['MANAGER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let where = { role: 'EMPLOYEE' };
    if (session.role === 'MANAGER') {
      where.managerId = session.id;
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Employees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
