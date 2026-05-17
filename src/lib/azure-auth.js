/**
 * 5.1 — Microsoft Entra ID (Azure AD) Integration
 * SSO, automatic org hierarchy sync, and role assignment from Azure AD groups
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import prisma from './prisma';
import { signToken } from './auth';

// MSAL Configuration — set these in .env to enable Azure AD SSO
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
  },
};

const REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/api/auth/azure/callback';

// Azure AD Group → Role mapping (configure in .env or admin panel)
const GROUP_ROLE_MAP = {
  [process.env.AZURE_AD_ADMIN_GROUP || 'GoalSync-Admins']: 'ADMIN',
  [process.env.AZURE_AD_MANAGER_GROUP || 'GoalSync-Managers']: 'MANAGER',
};

let msalClient = null;

export function getMsalClient() {
  if (!msalConfig.auth.clientId) return null;
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication(msalConfig);
  }
  return msalClient;
}

export function isAzureADEnabled() {
  return !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID);
}

/**
 * Generate the Azure AD login URL
 */
export async function getAuthUrl() {
  const client = getMsalClient();
  if (!client) return null;

  return await client.getAuthCodeUrl({
    scopes: ['user.read', 'GroupMember.Read.All'],
    redirectUri: REDIRECT_URI,
    prompt: 'select_account',
  });
}

/**
 * Exchange authorization code for tokens and user info
 */
export async function handleCallback(code) {
  const client = getMsalClient();
  if (!client) throw new Error('Azure AD not configured');

  const response = await client.acquireTokenByCode({
    code,
    scopes: ['user.read', 'GroupMember.Read.All'],
    redirectUri: REDIRECT_URI,
  });

  const accessToken = response.accessToken;

  // Fetch user profile from Microsoft Graph
  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  // Fetch group memberships for role assignment
  const groupsRes = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const groupsData = await groupsRes.json();
  const groups = (groupsData.value || []).map(g => g.displayName);

  // Determine role from group membership
  let role = 'EMPLOYEE';
  for (const [groupName, mappedRole] of Object.entries(GROUP_ROLE_MAP)) {
    if (groups.includes(groupName)) {
      role = mappedRole;
      break;
    }
  }

  // Determine manager from Azure AD (manager attribute)
  let managerId = null;
  try {
    const mgrRes = await fetch('https://graph.microsoft.com/v1.0/me/manager', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (mgrRes.ok) {
      const manager = await mgrRes.json();
      const mgrUser = await prisma.user.findFirst({
        where: { OR: [{ azureOid: manager.id }, { email: manager.mail || manager.userPrincipalName }] },
      });
      if (mgrUser) managerId = mgrUser.id;
    }
  } catch { /* manager lookup optional */ }

  // Determine department from Azure AD
  let departmentId = null;
  if (profile.department) {
    const dept = await prisma.department.findFirst({
      where: { name: profile.department },
    });
    if (dept) departmentId = dept.id;
    else {
      const newDept = await prisma.department.create({ data: { name: profile.department } });
      departmentId = newDept.id;
    }
  }

  // Upsert user — sync from Azure AD on every login
  const user = await prisma.user.upsert({
    where: { azureOid: profile.id },
    create: {
      azureOid: profile.id,
      email: profile.mail || profile.userPrincipalName,
      name: profile.displayName,
      passwordHash: 'AZURE_SSO', // No password needed for SSO
      role,
      departmentId,
      managerId,
    },
    update: {
      name: profile.displayName,
      email: profile.mail || profile.userPrincipalName,
      role,
      departmentId,
      ...(managerId && { managerId }),
    },
  });

  // Generate JWT for our app
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    azureOid: user.azureOid,
  });

  return { token, user };
}
