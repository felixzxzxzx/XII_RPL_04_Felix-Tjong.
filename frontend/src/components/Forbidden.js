'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '30px'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}
      >
        <ShieldAlert size={36} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
        403 - Akses Ditolak
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '440px', marginBottom: '24px', fontSize: '14px' }}>
        Anda tidak memiliki izin untuk mengakses halaman ini. Peran Anda dibatasi hanya untuk melihat menu yang diperbolehkan.
      </p>
      <Link href="/" className="btn btn-primary">
        <ArrowLeft size={16} />
        <span>Kembali ke Dashboard</span>
      </Link>
    </div>
  );
}
