import { NextResponse } from 'next/server';
import { handleCallback, isAzureADEnabled } from '@/lib/azure-auth';

// GET /api/auth/azure/callback — Azure AD callback after SSO
export async function GET(request) {
  if (!isAzureADEnabled()) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Azure AD error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(new URL('/?error=sso_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const { token } = await handleCallback(code);

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Azure AD callback error:', err);
    return NextResponse.redirect(new URL('/?error=sso_callback_failed', request.url));
  }
}
