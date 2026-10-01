'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { formatRupiah, formatDate, getProductImageUrl } from '@/lib/utils';
import StockBadge from '@/components/StockBadge';
import FlashAlert from '@/components/FlashAlert';
import Forbidden from '@/components/Forbidden';
import {
  ArrowLeft,
  Edit2,
  Receipt,
  Coffee
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const { isAdmin } = useAuth();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin || !id) return;

    const fetchProduct = async () => {
      setLoading(true);
      const res = await apiRequest(`/products/${id}`);
      setLoading(false);

      if (res.ok && res.data) {
        setProduct(res.data);
      } else {
        setError(res.message || 'Produk tidak ditemukan.');
      }
    };

    fetchProduct();
  }, [id, isAdmin]);

  if (!isAdmin) {
    return <Forbidden />;
  }

  if (loading) {
    return <div className="empty-state">Memuat detail produk...</div>;
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <FlashAlert type="danger" message={error || 'Produk tidak ditemukan.'} />
        <Link href="/products" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Produk</span>
        </Link>
      </div>
    );
  }

  const summary = product.sales_summary || { total_sold: 0, total_revenue: 0, total_orders: 0 };
  const recentOrders = product.recent_orders || [];

  return (
    <div>
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
          <Link href="/products" className="btn btn-secondary btn-sm" style={{ marginBottom: '8px' }}>
            <ArrowLeft size={14} />
            <span>Kembali ke Daftar Produk</span>
          </Link>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Detail Produk: {product.name}</h2>
        </div>
        <Link href={`/products/${product.id}/edit`} className="btn btn-primary">
          <Edit2 size={16} />
          <span>Ubah Produk</span>
        </Link>
      </div>

      <div className="pos-layout-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Coffee size={18} color="var(--primary)" />
              <span>Informasi Produk</span>
            </div>
          </div>
          <div className="card-body">
            <div
              style={{
                width: '100%',
                height: '180px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#F5EBE1',
                marginBottom: '16px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getProductImageUrl(product.image_url) ? (
                <img
                  src={getProductImageUrl(product.image_url)}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Coffee size={48} color="var(--primary)" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nama Menu:</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {product.name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kategori:</div>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-muted" style={{ fontSize: '13px' }}>
                    {product.category}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Harga Jual:</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>
                  {formatRupiah(product.price)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sisa Stok Saat Ini:</div>
                <div style={{ marginTop: '4px' }}>
                  <StockBadge stock={product.stock} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                  Dibuat pada: {formatDate(product.created_at)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  Pembaruan terakhir: {formatDate(product.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="card">
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total Terjual
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>
                  {summary.total_sold} Porsi
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total Pendapatan
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>
                  {formatRupiah(summary.total_revenue)}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Frekuensi Order
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
                  {summary.total_orders} Nota
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Receipt size={18} color="var(--primary)" />
                <span>Riwayat Penjualan Terakhir Produk Ini</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recentOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-state-title">Belum Pernah Terjual</div>
                  <div className="empty-state-desc">Produk ini belum pernah ditransaksikan di kasir.</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>No. Order</th>
                        <th>Waktu Transaksi</th>
                        <th>Metode</th>
                        <th>Harga Snapshot</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ro) => (
                        <tr key={ro.order_id}>
                          <td style={{ fontWeight: '700' }}>
                            <Link href={`/orders/${ro.order_id}`} style={{ color: 'var(--primary)' }}>
                              #{ro.order_id}
                            </Link>
                          </td>
                          <td style={{ fontSize: '13px' }}>{formatDate(ro.created_at)}</td>
                          <td>
                            <span className="badge badge-muted">{ro.payment_method}</span>
                          </td>
                          <td>{formatRupiah(ro.price)}</td>
                          <td style={{ fontWeight: '700' }}>{ro.qty}</td>
                          <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            {formatRupiah(ro.subtotal)}
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
    </div>
  );
}
