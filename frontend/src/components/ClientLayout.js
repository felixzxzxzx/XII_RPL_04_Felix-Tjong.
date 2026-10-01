'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-page)',
          color: 'var(--primary)',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        Memuat POS Coffee Shop...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-wrapper">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="content-body">{children}</main>
      </div>
    </div>
  );
}
