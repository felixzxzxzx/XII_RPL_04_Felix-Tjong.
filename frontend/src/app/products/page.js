'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { formatRupiah, getProductImageUrl } from '@/lib/utils';
import StockBadge from '@/components/StockBadge';
import FlashAlert from '@/components/FlashAlert';
import ConfirmModal from '@/components/ConfirmModal';
import Forbidden from '@/components/Forbidden';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Coffee
} from 'lucide-react';

const CATEGORIES = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];
const STOCK_STATUSES = [
  { label: 'Semua Stok', value: '' },
  { label: 'Tersedia (> 5)', value: 'available' },
  { label: 'Menipis (≤ 5)', value: 'low' },
  { label: 'Habis (0)', value: 'out' }
];


export default function ProductsPage() {
  const { isAdmin, isOwner } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStock, setSelectedStock] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let queryParams = `?page=${page}&limit=10`;
    if (searchQuery.trim()) queryParams += `&q=${encodeURIComponent(searchQuery.trim())}`;
    if (selectedCategory !== 'Semua') queryParams += `&category=${encodeURIComponent(selectedCategory)}`;
    if (selectedStock) queryParams += `&stock=${encodeURIComponent(selectedStock)}`;

    const res = await apiRequest(`/products${queryParams}`);
    setLoading(false);

    if (res.ok && res.data) {
      setProducts(res.data);
      if (res.raw?.pagination) {
        setPagination(res.raw.pagination);
      }
    } else {
      setFlash({ type: 'danger', message: res.message || 'Gagal memuat produk.' });
    }
  }, [page, searchQuery, selectedCategory, selectedStock]);

  useEffect(() => {
    if (isAdmin || isOwner) {
      loadProducts();
    }
  }, [isAdmin, isOwner, loadProducts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('created') === '1') {
        setFlash({
          type: 'success',
          message: 'Produk baru berhasil ditambahkan.'
        });
        window.history.replaceState(null, '', '/products');
      }
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    const res = await apiRequest(`/products/${productToDelete.id}`, {
      method: 'DELETE'
    });
    setDeleting(false);

    if (res.ok) {
      setFlash({
        type: 'success',
        message: res.message || `Produk '${productToDelete.name}' berhasil dihapus.`
      });
      setProductToDelete(null);
      loadProducts();
    } else {
      setFlash({
        type: 'danger',
        message: res.message || 'Gagal menghapus produk.'
      });
      setProductToDelete(null);
    }
  };

  if (!isAdmin && !isOwner) {
    return <Forbidden />;
  }

  return (
    <div>
      {/* Flash Alert */}
      {flash && (
        <FlashAlert
          type={flash.type}
          message={flash.message}
          onClose={() => setFlash(null)}
        />
      )}

      {/* Header Halaman & Hak Akses Notice */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Katalog Produk & Inventaris</h2>
            <span
              className="badge"
              style={{
                backgroundColor: isOwner ? 'rgba(46, 125, 50, 0.15)' : 'rgba(111, 78, 55, 0.15)',
                color: isOwner ? 'var(--success)' : 'var(--primary)',
                border: '1px solid currentColor',
                fontSize: '11px'
              }}
            >
              {isOwner ? 'Mode Owner (Full Edit)' : 'Mode Kasir (Edit Stok Saja)'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isOwner
              ? 'Sebagai Owner, Anda berhak mengubah nama, kategori, harga jual, dan stok produk.'
              : 'Sebagai Kasir, Anda dapat memperbarui kuantitas stok produk saat bahan/menu tiba.'}
          </p>
        </div>

        {/* Tombol Tambah Produk (Tampil untuk Owner & Kasir jika berwenang) */}
        {isOwner && (
          <Link href="/products/create" className="btn btn-primary">
            <Plus size={18} />
            <span>Tambah Produk Baru</span>
          </Link>
        )}
      </div>

      {/* Filter & Pencarian Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr auto',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            {/* Cari Nama */}
            <div style={{ position: 'relative' }}>
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
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>

            {/* Filter Kategori */}
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Kategori: {cat}
                </option>
              ))}
            </select>

            {/* Filter Status Stok */}
            <select
              className="form-control"
              value={selectedStock}
              onChange={(e) => {
                setSelectedStock(e.target.value);
                setPage(1);
              }}
            >
              {STOCK_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Tombol Cari */}
            <button type="submit" className="btn btn-secondary">
              <span>Filter</span>
            </button>
          </form>
        </div>
      </div>

      {/* Tabel Produk */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state">Memuat data produk...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Coffee size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <div className="empty-state-title">Produk tidak ditemukan</div>
              <div className="empty-state-desc">
                Coba ubah kata kunci pencarian atau bersihkan filter kategori/stok.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Foto</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Harga Satuan</th>
                    <th>Status Stok</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      {/* Foto Thumbnail Produk */}
                      <td>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#F5EBE1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          {getProductImageUrl(prod.image_url) ? (
                            <img
                              src={getProductImageUrl(prod.image_url)}
                              alt={prod.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Coffee size={20} color="var(--primary)" />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        <Link
                          href={`/products/${prod.id}`}
                          style={{ color: 'var(--primary)' }}
                          title="Lihat detail & riwayat terjual"
                        >
                          {prod.name}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-muted">{prod.category}</span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{formatRupiah(prod.price)}</td>
                      <td>
                        <StockBadge stock={prod.stock} />
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Link
                            href={`/products/${prod.id}`}
                            className="btn btn-secondary btn-sm"
                            title="Detail Produk & Riwayat Terjual"
                          >
                            <Eye size={14} />
                            <span>Detail</span>
                          </Link>

                          {/* Tombol Ubah: Kasir -> Ubah Stok, Owner -> Ubah Produk */}
                          <Link
                            href={`/products/${prod.id}/edit`}
                            className="btn btn-outline btn-sm"
                            title={isOwner ? 'Ubah Nama, Harga & Stok' : 'Perbarui Jumlah Stok'}
                          >
                            <Edit2 size={14} />
                            <span>{isOwner ? 'Ubah' : 'Ubah Stok'}</span>
                          </Link>

                          {/* Tombol Hapus: Hanya Owner */}
                          {isOwner && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                backgroundColor: 'var(--danger-bg)',
                                color: 'var(--danger)',
                                border: '1px solid var(--danger-border)'
                              }}
                              onClick={() => setProductToDelete(prod)}
                              title="Hapus Produk"
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bar Paginasi */}
          {pagination.total_pages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderTop: '1px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Menampilkan halaman <strong>{page}</strong> dari <strong>{pagination.total_pages}</strong> (Total {pagination.total} produk)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* Modal Konfirmasi Hapus Produk */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Konfirmasi Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Sekarang"
        isDanger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
