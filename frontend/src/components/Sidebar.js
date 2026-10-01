'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Coffee,
  Receipt,
  BarChart3,
  LogOut,
  X,
  Coffee as LogoIcon
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  const menuList = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'owner']
    },
    {
      title: 'Kasir (POS)',
      href: '/pos',
      icon: ShoppingCart,
      roles: ['admin']
    },
    {
      title: 'Produk',
      href: '/products',
      icon: Coffee,
      roles: ['admin', 'owner']
    },
    {
      title: 'Riwayat Transaksi',
      href: '/orders',
      icon: Receipt,
      roles: ['admin', 'owner']
    },
    {
      title: 'Laporan Harian',
      href: '/reports/daily',
      icon: BarChart3,
      roles: ['admin', 'owner']
    }
  ];

  const userRole = user?.role || 'admin';
  const filteredMenu = menuList.filter((m) => m.roles.includes(userRole));

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}
          >
            <LogoIcon size={22} />
          </div>
          <div>
            <div className="sidebar-brand-title">POS Coffee Shop</div>
            <div className="sidebar-brand-subtitle">UMKM Management</div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`menu-item ${active ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name" title={user?.name || 'User'}>
                {user?.name || 'Kasir'}
              </span>
              <span className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-owner'}`}>
                {user?.role === 'admin' ? 'Admin / Kasir' : 'Owner'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-logout"
            title="Keluar (Logout)"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
