'use client';

import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
