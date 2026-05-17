import { NextResponse } from 'next/server';

// GET /api/auth/sso-status — Client-safe endpoint to check if Azure AD SSO is configured
export async function GET() {
  return NextResponse.json({
    enabled: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID),
    tenantId: process.env.AZURE_AD_TENANT_ID ? `...${process.env.AZURE_AD_TENANT_ID.slice(-6)}` : null,
  });
}
