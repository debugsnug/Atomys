import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'goal-tracker-secret-key-2025';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(allowedRoles = []) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user: session };
}
