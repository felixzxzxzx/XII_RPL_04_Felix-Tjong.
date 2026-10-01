'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { formatRupiah, formatDate, getTodayDateString } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import FlashAlert from '@/components/FlashAlert';
import {
  Banknote,
  Receipt,
  CreditCard,
  Award,
  RotateCcw,
  Eye
} from 'lucide-react';

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    date: '',
    summary: { jml_transaksi: 0, omset: 0 },
    rekap_metode_pembayaran: [],
    produk_terlaris: [],
    daftar_transaksi: []
  });

  const loadReport = useCallback(async (date) => {
    setLoading(true);
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiRequest(`/reports/daily${query}`);
    setLoading(false);

    if (res.ok && res.data) {
      setReportData(res.data);
    } else {
      setError(res.message || 'Gagal memuat rekapitulasi laporan harian.');
    }
  }, []);

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate, loadReport]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleResetToday = () => {
    const today = getTodayDateString();
    setSelectedDate(today);
  };

  return (
    <div>
      {error && <FlashAlert type="danger" message={error} onClose={() => setError('')} />}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Rekapitulasi Laporan Penjualan</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Laporan omset harian, produk terlaris, dan rincian transaksi per metode pembayaran
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
              Pilih Tanggal:
            </span>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={handleDateChange}
              style={{ width: '170px' }}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetToday}
            title="Kembali ke Hari Ini"
          >
            <RotateCcw size={14} />
            <span>Hari Ini</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard
          title={`Total Omset (${selectedDate})`}
          value={formatRupiah(reportData.summary?.omset || 0)}
          icon={Banknote}
          subtitle="Akumulasi pendapatan kotor hari ini"
          color="success"
        />
        <StatCard
          title="Total Transaksi Berhasil"
          value={`${reportData.summary?.jml_transaksi || 0} Nota`}
          icon={Receipt}
          subtitle="Jumlah nota yang diselesaikan"
          color="primary"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={18} color="var(--primary)" />
              <span>Rekapitulasi per Metode Bayar</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {reportData.rekap_metode_pembayaran?.length === 0 ? (
              <div className="empty-state">Belum ada transaksi pada tanggal ini.</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Metode</th>
                      <th>Jumlah Transaksi</th>
                      <th>Total Omset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rekap_metode_pembayaran.map((m, idx) => (
                      <tr key={idx}>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: m.payment_method === 'QRIS' ? '#E1F5FE' : '#E8F5E9',
                              color: m.payment_method === 'QRIS' ? '#0288D1' : '#2E7D32',
                              border: `1px solid ${m.payment_method === 'QRIS' ? '#B3E5FC' : '#C8E6C9'}`
                            }}
                          >
                            {m.payment_method}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{m.jml} Nota</td>
                        <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                          {formatRupiah(m.total)}
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
              <Award size={18} color="var(--accent)" />
              <span>Top 5 Produk Terlaris</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {reportData.produk_terlaris?.length === 0 ? (
              <div className="empty-state">Belum ada produk terjual pada tanggal ini.</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Peringkat</th>
                      <th>Nama Produk</th>
                      <th>Terjual</th>
                      <th>Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.produk_terlaris.map((p, idx) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                          #{idx + 1}
                        </td>
                        <td style={{ fontWeight: '700' }}>{p.name}</td>
                        <td style={{ fontWeight: '700' }}>
                          <span className="badge badge-success">{p.terjual} Porsi</span>
                        </td>
                        <td style={{ fontWeight: '800' }}>{formatRupiah(p.pendapatan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Receipt size={18} color="var(--primary)" />
            <span>Daftar Transaksi Lengkap ({selectedDate})</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {reportData.daftar_transaksi?.length === 0 ? (
            <div className="empty-state">Tidak ada transaksi yang tercatat pada tanggal ini.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Order</th>
                    <th>Waktu</th>
                    <th>Nama Kasir</th>
                    <th>Metode</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.daftar_transaksi.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: '700' }}>#{ord.id}</td>
                      <td style={{ fontSize: '13px' }}>{formatDate(ord.created_at)}</td>
                      <td>{ord.cashier_name}</td>
                      <td>
                        <span className="badge badge-muted">{ord.payment_method}</span>
                      </td>
                      <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                        {formatRupiah(ord.total_price)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link href={`/orders/${ord.id}`} className="btn btn-secondary btn-sm">
                          <Eye size={14} />
                          <span>Lihat Struk</span>
                        </Link>
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
  );
}
