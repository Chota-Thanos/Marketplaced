'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '../../components/admin/AdminAuthContext';
import AdminLoginGate from '../../components/admin/AdminLoginGate';

/**
 * Single gate for every /admin/* route. Previously only app/admin/page.js
 * checked the session, so /admin/analytics, /admin/qna and
 * /admin/storefront-builder rendered for anyone who typed the URL.
 */
function AdminGate({ children }) {
  const { token, ready } = useAdminAuth();

  if (!ready) {
    return (
      <div className="min-h-screen bg-inverse flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-warning animate-spin" />
        <span className="sr-only">Checking admin session</span>
      </div>
    );
  }

  if (!token) return <AdminLoginGate />;

  return children;
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminGate>{children}</AdminGate>
    </AdminAuthProvider>
  );
}
