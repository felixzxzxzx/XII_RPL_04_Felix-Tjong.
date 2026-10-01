'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import StockBadge from '@/components/StockBadge';
import FlashAlert from '@/components/FlashAlert';
import {
  Banknote,
  Receipt,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: { jml_transaksi: 0, omset: 0 },
    stok_menipis: [],
    pembayaran_hari_ini: [],
    transaksi_terbaru: []
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest('/dashboard');
    setLoading(false);

    if (res.ok && res.data) {
      setDashboardData(res.data);
    } else {
      setError(res.message || 'Gagal memuat data dashboard.');
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      {error && <FlashAlert type="danger" message={error} onClose={() => setError('')} />}

      <div
        className="card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #241A15 0%, #4A3525 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '24px 28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
              Selamat Datang, {user?.name || 'Kasir'}!
            </h2>
            <p style={{ color: 'var(--accent-light)', fontSize: '13px', maxWidth: '600px' }}>
              {isAdmin
                ? 'Sistem POS Kasir siap melayani transaksi pelanggan, pemotongan stok otomatis, dan perhitungan kembalian.'
                : 'Pantau omset harian, rekapitulasi metode pembayaran, dan riwayat transaksi secara real-time.'}
            </p>
          </div>
          {isAdmin && (
            <Link href="/pos" className="btn btn-primary" style={{ backgroundColor: 'var(--accent)', color: '#241A15', fontWeight: '700' }}>
              <ShoppingCart size={18} />
              <span>Buka Layar Kasir</span>
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <StatCard
          title="Omset Hari Ini"
          value={formatRupiah(dashboardData.summary?.omset || 0)}
          icon={Banknote}
          subtitle="Total penjualan hari ini"
          color="success"
        />
        <StatCard
          title="Jumlah Transaksi"
          value={`${dashboardData.summary?.jml_transaksi || 0} Nota`}
          icon={Receipt}
          subtitle="Pesanan berhasil hari ini"
          color="primary"
        />
        <StatCard
          title="Produk Stok Menipis"
          value={`${dashboardData.stok_menipis?.length || 0} Item`}
          icon={AlertTriangle}
          subtitle="Stok tersisa ≤ 5 unit"
          color={dashboardData.stok_menipis?.length > 0 ? 'warning' : 'primary'}
        />
      </div>

      <div className="pos-layout-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} color="var(--primary)" />
              <span>Transaksi Terbaru Hari Ini (5 Terakhir)</span>
            </div>
            <Link href="/orders" className="btn btn-outline btn-sm">
              <span>Semua Riwayat</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state">Memuat riwayat transaksi...</div>
            ) : dashboardData.transaksi_terbaru?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">Belum ada transaksi hari ini</div>
                <div className="empty-state-desc">Transaksi kasir akan muncul di sini setelah disimpan.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Order</th>
                      <th>Kasir</th>
                      <th>Metode</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.transaksi_terbaru.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/orders/${order.id}`}
                            style={{ fontWeight: '700', color: 'var(--primary)' }}
                          >
                            #{order.id}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td>{order.cashier_name}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: order.payment_method === 'QRIS' ? '#E1F5FE' : '#E8F5E9',
                              color: order.payment_method === 'QRIS' ? '#0288D1' : '#2E7D32',
                              border: `1px solid ${order.payment_method === 'QRIS' ? '#B3E5FC' : '#C8E6C9'}`
                            }}
                          >
                            {order.payment_method}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>
                          {formatRupiah(order.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} color="var(--warning)" />
              <span>Peringatan Stok Menipis (Stok ≤ 5)</span>
            </div>
            {isAdmin && (
              <Link href="/products" className="btn btn-outline btn-sm">
                <span>Kelola Stok</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="empty-state">Memeriksa stok produk...</div>
            ) : dashboardData.stok_menipis?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">Semua Stok Aman</div>
                <div className="empty-state-desc">Tidak ada produk dengan stok menipis saat ini.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Sisa Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.stok_menipis.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: '600' }}>{prod.name}</td>
                        <td>
                          <span className="badge badge-muted">{prod.category}</span>
                        </td>
                        <td>{formatRupiah(prod.price)}</td>
                        <td>
                          <StockBadge stock={prod.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
