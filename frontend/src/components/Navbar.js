'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Clock, Menu, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      setTimeStr(now.toLocaleDateString('id-ID', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const getPageInfo = () => {
    if (pathname === '/') return { title: 'Dashboard', breadcrumb: 'Utama / Dashboard' };
    if (pathname === '/pos') return { title: 'Layar Kasir (POS)', breadcrumb: 'Utama / Kasir' };
    if (pathname === '/products') return { title: 'Daftar Produk', breadcrumb: 'Utama / Produk / Daftar' };
    if (pathname === '/products/create') return { title: 'Tambah Produk', breadcrumb: 'Utama / Produk / Tambah' };
    if (pathname.includes('/products/') && pathname.includes('/edit')) return { title: 'Ubah Produk', breadcrumb: 'Utama / Produk / Ubah' };
    if (pathname.startsWith('/products/')) return { title: 'Detail Produk', breadcrumb: 'Utama / Produk / Detail' };
    if (pathname === '/orders') return { title: 'Riwayat Transaksi', breadcrumb: 'Utama / Riwayat Transaksi' };
    if (pathname.startsWith('/orders/')) return { title: 'Detail Transaksi', breadcrumb: 'Utama / Riwayat / Detail Transaksi' };
    if (pathname === '/reports/daily') return { title: 'Laporan Penjualan Harian', breadcrumb: 'Utama / Laporan / Harian' };
    return { title: 'Coffee Shop POS', breadcrumb: 'Utama' };
  };

  const { title, breadcrumb } = getPageInfo();

  return (
    <header className="top-navbar no-print" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-title-box">
          <h1 className="navbar-title">{title}</h1>
          <div className="navbar-breadcrumb">{breadcrumb}</div>
        </div>
      </div>

      <div className="navbar-actions" ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="navbar-clock">
          <Clock size={15} color="var(--primary)" />
          <span>{timeStr || 'Memuat waktu...'}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="navbar-profile-btn"
          aria-label="Menu Profil & Keluar"
          aria-expanded={isDropdownOpen}
        >
          <div className="navbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-owner'}`}>
            {user?.role === 'admin' ? 'Kasir' : 'Owner'}
          </span>
          <ChevronDown size={14} className="navbar-profile-chevron" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="navbar-quick-logout-btn"
          title="Keluar (Logout)"
          aria-label="Logout"
        >
          <LogOut size={16} />
        </button>

        {isDropdownOpen && (
          <div className="navbar-user-dropdown">
            <div className="dropdown-user-header">
              <div className="dropdown-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="dropdown-user-details">
                <div className="dropdown-user-name">{user?.name || 'Pengguna'}</div>
                <div className="dropdown-user-role">@{user?.username || 'user'} • {isAdmin ? 'Kasir' : 'Owner'}</div>
              </div>
            </div>
            <div className="dropdown-divider" />
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                logout();
              }}
              className="dropdown-logout-btn"
            >
              <LogOut size={16} />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
