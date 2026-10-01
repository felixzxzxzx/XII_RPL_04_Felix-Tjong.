'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import FlashAlert from '@/components/FlashAlert';
import {
  ArrowLeft,
  Printer,
  Receipt,
  Coffee,
  CheckCircle,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchOrderDetail = async () => {
      setLoading(true);
      const res = await apiRequest(`/orders/${id}`);
      setLoading(false);

      if (res.ok && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Transaksi tidak ditemukan.');
      }
    };

    fetchOrderDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="empty-state">Memuat rincian transaksi...</div>;
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <FlashAlert type="danger" message={error || 'Data transaksi tidak ditemukan.'} />
        <Link href="/orders" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Riwayat Transaksi</span>
        </Link>
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div>
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <Link href="/orders" className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} />
          <span>Kembali ke Riwayat</span>
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={18} />
          <span>Cetak Struk Transaksi</span>
        </button>
      </div>

      <div
        className="card print-receipt-container"
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}
      >
        <div className="card-body" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}
            >
              <Coffee size={26} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              POS COFFEE SHOP UMKM
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Jl. Kopi Harum No. 12, Jakarta
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Telp / WhatsApp: 0812-3456-7890
            </div>
          </div>

          <div style={{ fontSize: '13px', lineHeight: 1.8, marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>No. Order / Nota:</span>
              <strong style={{ color: 'var(--primary)' }}>#{order.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Waktu Transaksi:</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Kasir:</span>
              <span>{order.cashier_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Metode Pembayaran:</span>
              <span style={{ fontWeight: '700' }}>{order.payment_method}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Daftar Pesanan:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700' }}>{item.product_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatRupiah(item.price)} × {item.qty}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', textAlign: 'right', minWidth: '90px' }}>
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: '2px dashed var(--border-color)',
              paddingTop: '16px',
              fontSize: '14px',
              lineHeight: 2
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800' }}>
              <span>TOTAL BELANJA:</span>
              <span style={{ color: 'var(--primary)' }}>{formatRupiah(order.total_price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Jumlah Diterima ({order.payment_method}):</span>
              <span style={{ fontWeight: '600' }}>{formatRupiah(order.amount_paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Kembalian:</span>
              <span style={{ fontWeight: '700', color: 'var(--success)' }}>
                {formatRupiah(order.change_amount)}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
              Terima Kasih Atas Kunjungan Anda!
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Nikmati racikan kopi terbaik & sampai jumpa kembali.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
