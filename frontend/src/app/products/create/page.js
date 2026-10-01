'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import FlashAlert from '@/components/FlashAlert';
import Forbidden from '@/components/Forbidden';
import { ArrowLeft, Save, X, Upload, ShieldCheck } from 'lucide-react';

const CATEGORIES = ['Kopi', 'Non-Kopi', 'Makanan'];

export default function CreateProductPage() {
  const router = useRouter();
  const { isOwner } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Kopi',
    price: '',
    stock: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOwner) {
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validate = () => {
    const errs = {};
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

    const stockNum = Number(formData.stock);
    if (formData.stock === '' || isNaN(stockNum) || stockNum < 0) {
      errs.stock = 'Stok tidak boleh negatif.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    const formDataObj = new FormData();
    formDataObj.append('name', formData.name.trim());
    formDataObj.append('category', formData.category);
    formDataObj.append('price', parseInt(formData.price, 10));
    formDataObj.append('stock', parseInt(formData.stock, 10));
    if (imageFile) {
      formDataObj.append('image', imageFile);
    }

    const res = await apiRequest('/products', {
      method: 'POST',
      body: formDataObj
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccessMessage(res.message || 'Produk baru berhasil ditambahkan.');
      setTimeout(() => {
        router.push('/products?created=1');
      }, 1000);
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setServerError(res.message || 'Gagal menambahkan produk baru.');
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/products" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Produk</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Tambah Menu Produk Baru</h2>
          <span className="badge" style={{ backgroundColor: 'rgba(46, 125, 50, 0.15)', color: 'var(--success)' }}>
            <ShieldCheck size={13} style={{ marginRight: '4px' }} />
            Khusus Owner
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Lengkapi data produk dan upload foto untuk ditampilkan pada layar kasir POS
        </p>
      </div>

      {successMessage && (
        <FlashAlert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      {serverError && (
        <FlashAlert
          type="danger"
          message={serverError}
          onClose={() => setServerError('')}
        />
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label">
                Foto Menu Produk (Disimpan di Backend)
              </label>

              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '90px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: '#F5EBE1',
                      border: '2px solid var(--primary)',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview Foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      {imageFile?.name}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleRemoveImage}
                      style={{ color: 'var(--danger)' }}
                    >
                      <X size={14} />
                      <span>Hapus Foto</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border-color)',
                    backgroundColor: '#FAF7F4',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Upload size={28} color="var(--primary)" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                    Pilih File Foto Produk
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Mendukung JPG, PNG, WEBP (Maksimal 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-name">
                Nama Produk <span className="required">*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Contoh: Es Kopi Susu Aren, Matcha Latte"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-cat">
                Kategori <span className="required">*</span>
              </label>
              <select
                id="prod-cat"
                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
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
              <label className="form-label" htmlFor="prod-price">
                Harga Jual (Rp) <span className="required">*</span>
              </label>
              <input
                id="prod-price"
                type="number"
                min="1"
                className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                placeholder="Contoh: 22000"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: null });
                }}
              />
              {errors.price && <div className="invalid-feedback">{errors.price}</div>}
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label" htmlFor="prod-stock">
                Stok Awal <span className="required">*</span>
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                placeholder="Contoh: 50"
                value={formData.stock}
                onChange={(e) => {
                  setFormData({ ...formData, stock: e.target.value });
                  if (errors.stock) setErrors({ ...errors, stock: null });
                }}
              />
              {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/products" className="btn btn-secondary">
                <X size={16} />
                <span>Batal</span>
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Produk Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
