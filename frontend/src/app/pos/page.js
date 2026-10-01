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
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Banknote,
  Receipt,
  RotateCcw,
  Coffee
} from 'lucide-react';

const CATEGORIES = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];

export default function PosPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaidInput, setAmountPaidInput] = useState('');

  const [flash, setFlash] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    const res = await apiRequest('/pos');
    setLoadingProducts(false);
    if (res.ok && Array.isArray(res.data)) {
      setProducts(res.data);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProducts();
    }
  }, [isAdmin, loadProducts]);

  if (!isAdmin) {
    return <Forbidden />;
  }

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'Semua' || prod.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          max_stock: product.stock,
          qty: 1
        }
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > item.max_stock) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAmountPaidInput('');
    setClearConfirmOpen(false);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const parsedPaid = Number(amountPaidInput) || 0;
  const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, parsedPaid - totalAmount) : 0;
  const isUnderpaid = paymentMethod === 'Tunai' && parsedPaid < totalAmount;
  const canSubmit =
    cart.length > 0 &&
    (paymentMethod === 'QRIS' || (paymentMethod === 'Tunai' && !isUnderpaid && parsedPaid > 0));

  const handleCheckout = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFlash(null);

    const payload = {
      items: cart.map((item) => ({
        product_id: item.product_id,
        qty: item.qty
      })),
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'Tunai' ? parsedPaid : totalAmount
    };

    const res = await apiRequest('/pos', {
      method: 'POST',
      body: payload
    });

    setSubmitting(false);

    if (res.ok && res.data) {
      const order = res.data;
      setFlash({
        type: 'success',
        message: `Transaksi #${order.order_id} berhasil disimpan. Kembalian: ${formatRupiah(order.change_amount)}`,
        receiptId: order.order_id
      });

      setCart([]);
      setAmountPaidInput('');
      loadProducts();
    } else {
      setFlash({
        type: 'danger',
        message: res.message || 'Gagal menyimpan transaksi.'
      });
    }
  };

  return (
    <div>
      {flash && (
        <div style={{ marginBottom: '16px' }}>
          <FlashAlert
            type={flash.type}
            message={flash.message}
            onClose={() => setFlash(null)}
          />
          {flash.receiptId && (
            <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
              <Link
                href={`/orders/${flash.receiptId}`}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Receipt size={14} />
                <span>Lihat Struk / Detail Transaksi #{flash.receiptId}</span>
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="pos-layout-grid">
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-body" style={{ padding: '16px' }}>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)'
                  }}
                >
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari produk kasir berdasarkan nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm ${
                      selectedCategory === cat ? 'btn-primary' : 'btn-secondary'
                    }`}
                    style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <div className="card">
              <div className="empty-state">Memuat katalog produk kasir...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-title">Produk Tidak Ditemukan</div>
                <div className="empty-state-desc">Tidak ada produk yang cocok dengan pencarian atau filter kategori.</div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '14px'
              }}
            >
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const inCartItem = cart.find((c) => c.product_id === prod.id);
                const isMaxInCart = inCartItem && inCartItem.qty >= prod.stock;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && !isMaxInCart && addToCart(prod)}
                    className="card"
                    style={{
                      cursor: isOutOfStock || isMaxInCart ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.55 : isMaxInCart ? 0.8 : 1,
                      backgroundColor: 'var(--bg-surface)',
                      transition: 'all 0.18s ease',
                      border: inCartItem ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      userSelect: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    title={
                      isOutOfStock
                        ? 'Stok produk habis'
                        : isMaxInCart
                        ? 'Mencapai batas sisa stok fisik'
                        : 'Klik untuk menambah ke keranjang kasir'
                    }
                  >
                    <div
                      style={{
                        height: '125px',
                        width: '100%',
                        position: 'relative',
                        backgroundColor: '#F5EBE1',
                        overflow: 'hidden'
                      }}
                    >
                      {getProductImageUrl(prod.image_url) ? (
                        <img
                          src={getProductImageUrl(prod.image_url)}
                          alt={prod.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isOutOfStock ? 'grayscale(80%)' : 'none',
                            transition: 'transform 0.25s ease'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="img-fallback"
                        style={{
                          width: '100%',
                          height: '100%',
                          display: getProductImageUrl(prod.image_url) ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}
                      >
                        <Coffee size={36} />
                      </div>

                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(36, 26, 21, 0.75)',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                          backdropFilter: 'blur(3px)'
                        }}
                      >
                        {prod.category}
                      </span>

                      {inCartItem && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '800',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                          }}
                        >
                          {inCartItem.qty}
                        </div>
                      )}

                      {isOutOfStock && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontWeight: '800',
                            fontSize: '12px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: 'var(--danger)',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            HABIS (0)
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: 'var(--text-main)',
                          marginBottom: '4px',
                          lineHeight: 1.3,
                          minHeight: '36px'
                        }}
                      >
                        {prod.name}
                      </div>

                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: '800',
                          color: 'var(--primary)',
                          marginBottom: '8px'
                        }}
                      >
                        {formatRupiah(prod.price)}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <StockBadge stock={prod.stock} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: '88px' }}>
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={18} color="var(--primary)" />
                <span>Keranjang ({cart.length} Item)</span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClearConfirmOpen(true)}
                  className="btn btn-secondary btn-sm"
                  title="Kosongkan seluruh keranjang"
                >
                  <RotateCcw size={14} />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            <div className="card-body" style={{ padding: '18px' }}>
              {cart.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>Keranjang masih kosong</div>
                  <div style={{ fontSize: '12px' }}>Pilih produk di samping untuk memulai transaksi.</div>
                </div>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                  {cart.map((item) => {
                    const prodInfo = products.find((p) => p.id === item.product_id);
                    return (
                      <div
                        key={item.product_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid var(--border-light)',
                          gap: '10px'
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#F5EBE1',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          {getProductImageUrl(prodInfo?.image_url) ? (
                            <img
                              src={getProductImageUrl(prodInfo?.image_url)}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Coffee size={16} color="var(--primary)" />
                          )}
                        </div>

                        <div style={{ flex: 1, paddingRight: '6px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', lineHeight: 1.2 }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {formatRupiah(item.price)} × {item.qty} ={' '}
                            <strong style={{ color: 'var(--text-main)' }}>
                              {formatRupiah(item.price * item.qty)}
                            </strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px' }}
                            onClick={() => updateQty(item.product_id, -1)}
                            title="Kurangi 1"
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px' }}
                            onClick={() => updateQty(item.product_id, 1)}
                            disabled={item.qty >= item.max_stock}
                            title={item.qty >= item.max_stock ? 'Maksimal sisa stok' : 'Tambah 1'}
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '4px',
                              marginLeft: '4px'
                            }}
                            onClick={() => removeFromCart(item.product_id)}
                            title="Hapus item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  backgroundColor: '#FAF5F0',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  TOTAL PEMBAYARAN:
                </span>
                <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--primary)' }}>
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        paymentMethod === 'Tunai'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        paymentMethod === 'Tunai' ? 'var(--primary-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="Tunai"
                      checked={paymentMethod === 'Tunai'}
                      onChange={() => setPaymentMethod('Tunai')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <Banknote size={18} color="var(--primary)" />
                    <span>Tunai (Cash)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        paymentMethod === 'QRIS'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        paymentMethod === 'QRIS' ? 'var(--primary-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="QRIS"
                      checked={paymentMethod === 'QRIS'}
                      onChange={() => setPaymentMethod('QRIS')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <CreditCard size={18} color="var(--primary)" />
                    <span>QRIS</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'Tunai' && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" htmlFor="amount_paid">
                      Uang Diterima (Rp) <span className="required">*</span>
                    </label>
                    <input
                      id="amount_paid"
                      type="number"
                      min={totalAmount}
                      className={`form-control ${isUnderpaid && parsedPaid > 0 ? 'is-invalid' : ''}`}
                      placeholder={`Minimal ${formatRupiah(totalAmount)}`}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                    />
                    {isUnderpaid && parsedPaid > 0 && (
                      <div className="invalid-feedback">
                        Uang diterima kurang dari total (Kurang {formatRupiah(totalAmount - parsedPaid)}).
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[totalAmount, 20000, 50000, 100000].filter((v) => v >= totalAmount && v > 0).map((val) => (
                      <button
                        key={val}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAmountPaidInput(String(val))}
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FAFAFA',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Kembalian:</span>
                    <span
                      style={{
                        fontWeight: '800',
                        fontSize: '16px',
                        color: changeAmount > 0 ? 'var(--success)' : 'var(--text-main)'
                      }}
                    >
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div
                  style={{
                    backgroundColor: '#E1F5FE',
                    color: '#0277BD',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    fontSize: '13px'
                  }}
                >
                  Pelanggan membayar via scan QRIS sebesar <strong>{formatRupiah(totalAmount)}</strong> (Kembalian: Rp 0).
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                disabled={!canSubmit || submitting}
                onClick={handleCheckout}
              >
                <CheckCircle size={20} />
                <span>{submitting ? 'Memproses Transaksi...' : 'Simpan Transaksi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="Kosongkan Keranjang Kasir?"
        message="Seluruh item yang telah dipilih akan dihapus dari keranjang pesanan ini."
        confirmText="Ya, Kosongkan"
        isDanger={true}
        onConfirm={handleClearCart}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  );
}
