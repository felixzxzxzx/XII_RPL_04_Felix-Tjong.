'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { getProductImageUrl } from '@/lib/utils';
import FlashAlert from '@/components/FlashAlert';
import Forbidden from '@/components/Forbidden';
import { ArrowLeft, Save, X, Lock, ShieldCheck, Upload } from 'lucide-react';

const CATEGORIES = ['Kopi', 'Non-Kopi', 'Makanan'];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isOwner } = useAuth();
  const id = params?.id;

  const [formData, setFormData] = useState({
    name: '',
    category: 'Kopi',
    price: '',
    stock: '',
    image_url: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProduct = useCallback(async () => {
    setInitialLoading(true);
    const res = await apiRequest(`/products/${id}`);
    setInitialLoading(false);

    if (res.ok && res.data) {
      setFormData({
        name: res.data.name || '',
        category: res.data.category || 'Kopi',
        price: String(res.data.price || ''),
        stock: String(res.data.stock ?? ''),
        image_url: res.data.image_url || ''
      });
      if (res.data.image_url) {
        setImagePreview(getProductImageUrl(res.data.image_url));
      }
    } else {
      setServerError(res.message || 'Gagal mengambil data produk.');
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, fetchProduct]);

  if (!isAdmin && !isOwner) {
    return <Forbidden />;
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveNewFile = () => {
    setImageFile(null);
    setImagePreview(formData.image_url || '');
  };

  const validate = () => {
    const errs = {};

    const stockNum = Number(formData.stock);
    if (formData.stock === '' || isNaN(stockNum) || stockNum < 0) {
      errs.stock = 'Stok tidak boleh negatif.';
    }

    if (isOwner) {
      if (!formData.name.trim()) {
        errs.name = 'Nama produk wajib diisi.';
      }
      if (!formData.category || !CATEGORIES.includes(formData.category)) {
        errs.category = 'Kategori tidak valid.';
      }
      const priceNum = Number(formData.price);
      if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
        errs.price = 'Harga harus berupa angka lebih dari 0.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    let bodyData;
    if (isOwner) {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name.trim());
      formDataObj.append('category', formData.category);
      formDataObj.append('price', parseInt(formData.price, 10));
      formDataObj.append('stock', parseInt(formData.stock, 10));
      if (imageFile) {
        formDataObj.append('image', imageFile);
      } else if (formData.image_url) {
        formDataObj.append('image_url', formData.image_url);
      }
      bodyData = formDataObj;
    } else {
      bodyData = {
        stock: parseInt(formData.stock, 10)
      };
    }

    const res = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: bodyData
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccessMessage(res.message || 'Perubahan berhasil disimpan.');
      setTimeout(() => {
        router.push('/products');
      }, 1200);
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setServerError(res.message || 'Gagal memperbarui data produk.');
    }
  };

  if (initialLoading) {
    return <div className="empty-state">Memuat formulir produk...</div>;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Produk</span>
        </Link>
        <h2 style={{ fontSize: '22px', fontWeight: '800' }}>
          {isOwner ? 'Ubah Data Menu & Harga (Owner)' : 'Perbarui Stok Produk (Kasir)'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {isOwner
            ? 'Sebagai Owner, Anda memiliki akses penuh mengubah nama, kategori, harga, foto, dan stok.'
            : 'Sebagai Kasir, hak akses Anda dibatasi hanya untuk mengubah kuantitas stok fisik.'}
        </p>
      </div>

      {serverError && (
        <FlashAlert
          type="danger"
          message={serverError}
          onClose={() => setServerError('')}
        />
      )}

      {successMessage && (
        <FlashAlert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: isOwner ? 'rgba(46, 125, 50, 0.1)' : 'rgba(237, 108, 2, 0.1)',
          border: `1px solid ${isOwner ? 'rgba(46, 125, 50, 0.25)' : 'rgba(237, 108, 2, 0.25)'}`,
          color: isOwner ? '#1B5E20' : '#8A3B00',
          fontSize: '13px'
        }}
      >
        {isOwner ? <ShieldCheck size={20} /> : <Lock size={20} />}
        <div>
          {isOwner ? (
            <span>
              <strong>Mode Akses Owner:</strong> Anda memiliki izin mengedit seluruh atribut menu termasuk nama, harga, dan foto.
            </span>
          ) : (
            <span>
              <strong>Mode Akses Kasir:</strong> Field <em>Nama</em>, <em>Kategori</em>, <em>Harga</em>, dan <em>Foto</em> terkunci (hanya dapat diubah oleh Owner). Anda hanya dapat mengubah <strong>Jumlah Stok Fisik</strong>.
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Foto Produk {!isOwner && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Hanya Owner)</span>}
                </label>
                {!isOwner && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>

              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '90px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: '#F5EBE1',
                      border: '2px solid var(--border-color)',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview Foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {isOwner && (
                    <div>
                      <label
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={14} />
                        <span>Ganti File Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {imageFile && (
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={handleRemoveNewFile}
                            style={{ color: 'var(--danger)', fontSize: '12px' }}
                          >
                            Batal Ganti
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : isOwner ? (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: '#FAF7F4',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={24} color="var(--primary)" style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                    Upload Foto Produk
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tidak ada foto produk.</div>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="edit-name" style={{ margin: 0 }}>
                  Nama Produk {!isOwner && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Hanya Owner)</span>}
                </label>
                {!isOwner && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>
              <input
                id="edit-name"
                type="text"
                disabled={!isOwner}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                style={{ backgroundColor: !isOwner ? '#F7F4F0' : 'var(--bg-surface)' }}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="edit-cat" style={{ margin: 0 }}>
                  Kategori {!isOwner && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Hanya Owner)</span>}
                </label>
                {!isOwner && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>
              <select
                id="edit-cat"
                disabled={!isOwner}
                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                style={{ backgroundColor: !isOwner ? '#F7F4F0' : 'var(--bg-surface)' }}
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: null });
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <div className="invalid-feedback">{errors.category}</div>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="edit-price" style={{ margin: 0 }}>
                  Harga Jual (Rp) {!isOwner && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Hanya Owner)</span>}
                </label>
                {!isOwner && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>
              <input
                id="edit-price"
                type="number"
                min="1"
                disabled={!isOwner}
                className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                style={{ backgroundColor: !isOwner ? '#F7F4F0' : 'var(--bg-surface)' }}
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: null });
                }}
              />
              {errors.price && <div className="invalid-feedback">{errors.price}</div>}
            </div>

            <div
              className="form-group"
              style={{
                marginBottom: '28px',
                padding: '16px',
                backgroundColor: 'var(--primary-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <label
                className="form-label"
                htmlFor="edit-stock"
                style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '14px' }}
              >
                Jumlah Stok Fisik <span className="required">*</span>
              </label>
              <input
                id="edit-stock"
                type="number"
                min="0"
                className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                style={{ fontSize: '16px', fontWeight: '700' }}
                value={formData.stock}
                onChange={(e) => {
                  setFormData({ ...formData, stock: e.target.value });
                  if (errors.stock) setErrors({ ...errors, stock: null });
                }}
              />
              {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {isOwner
                  ? 'Kuantitas persediaan yang dapat ditransaksikan di kasir.'
                  : 'Perbarui jumlah stok fisik yang tersedia di coffee shop.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/products" className="btn btn-secondary">
                <X size={16} />
                <span>Batal</span>
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} />
                <span>
                  {submitting
                    ? 'Menyimpan...'
                    : isOwner
                    ? 'Simpan Perubahan Menu'
                    : 'Perbarui Jumlah Stok'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
