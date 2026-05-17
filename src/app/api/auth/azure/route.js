import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/azure-auth';
import { isAzureADEnabled } from '@/lib/azure-auth';

// GET /api/auth/azure — Redirect to Azure AD login
export async function GET() {
  if (!isAzureADEnabled()) {
    return NextResponse.json({ error: 'Azure AD not configured. Set AZURE_AD_CLIENT_ID and AZURE_AD_TENANT_ID in .env' }, { status: 501 });
  }

  try {
    const authUrl = await getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Azure AD auth error:', error);
    return NextResponse.json({ error: 'Failed to initiate SSO' }, { status: 500 });
  }
}
