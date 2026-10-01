'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import FlashAlert from '@/components/FlashAlert';
import {
  Search,
  Filter,
  Eye,
  Receipt,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let queryParams = `?page=${page}&limit=10`;
    if (searchQuery.trim()) queryParams += `&q=${encodeURIComponent(searchQuery.trim())}`;
    if (fromDate) queryParams += `&from=${encodeURIComponent(fromDate)}`;
    if (toDate) queryParams += `&to=${encodeURIComponent(toDate)}`;
    if (selectedPayment) queryParams += `&payment=${encodeURIComponent(selectedPayment)}`;

    const res = await apiRequest(`/orders${queryParams}`);
    setLoading(false);

    if (res.ok && res.data) {
      setOrders(res.data);
      if (res.raw?.pagination) {
        setPagination(res.raw.pagination);
      }
    } else {
      setError(res.message || 'Gagal memuat riwayat transaksi.');
    }
  }, [page, searchQuery, fromDate, toDate, selectedPayment]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSelectedPayment('');
    setPage(1);
  };

  const filteredPageTotal = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  return (
    <div>
      {error && <FlashAlert type="danger" message={error} onClose={() => setError('')} />}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Riwayat Transaksi Kasir</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Daftar seluruh nota penjualan, filter rentang tanggal, dan cetak ulang struk kasir
        </p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <form onSubmit={handleFilterSubmit} className="orders-filter-grid">
            <div className="filter-full" style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)'
                }}
              >
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="No. Order / Kasir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <div>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                title="Dari tanggal"
              />
            </div>

            <div>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                title="Sampai tanggal"
              />
            </div>

            <div>
              <select
                className="form-control"
                value={selectedPayment}
                onChange={(e) => {
                  setSelectedPayment(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>

            <div className="orders-filter-actions">
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: '40px', minWidth: '95px' }}>
                <Filter size={15} />
                <span>Terapkan</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={handleResetFilter}
                title="Reset seluruh filter"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">Memuat riwayat transaksi...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <Receipt size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <div className="empty-state-title">Tidak ada transaksi yang cocok</div>
              <div className="empty-state-desc">
                Coba sesuaikan filter rentang tanggal atau bersihkan pencarian kata kunci.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>No. Order</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Waktu Transaksi</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Nama Kasir</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Metode Pembayaran</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Total Belanja</th>
                    <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>
                        <Link href={`/orders/${ord.id}`} style={{ color: 'var(--primary)' }}>
                          #{ord.id}
                        </Link>
                      </td>
                      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{formatDate(ord.created_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: '600' }}>{ord.cashier_name}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: ord.payment_method === 'QRIS' ? '#E1F5FE' : '#E8F5E9',
                            color: ord.payment_method === 'QRIS' ? '#0288D1' : '#2E7D32',
                            border: `1px solid ${ord.payment_method === 'QRIS' ? '#B3E5FC' : '#C8E6C9'}`
                          }}
                        >
                          {ord.payment_method}
                        </span>
                      </td>
                      <td style={{ fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {formatRupiah(ord.total_price)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Link
                          href={`/orders/${ord.id}`}
                          className="btn btn-secondary btn-sm"
                          title="Lihat Detail & Struk"
                        >
                          <Eye size={14} />
                          <span>Detail Struk</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="table-footer-row">
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      TOTAL HALAMAN INI ({orders.length} Transaksi):
                    </td>
                    <td style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {formatRupiah(filteredPageTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination-container">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Menampilkan halaman <strong>{page}</strong> dari <strong>{pagination.total_pages}</strong> (Total {pagination.total} transaksi)
              </div>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <span>Berikutnya</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
