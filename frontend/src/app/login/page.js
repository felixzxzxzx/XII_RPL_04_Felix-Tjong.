'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import FlashAlert from '@/components/FlashAlert';
import { Coffee, Lock, User, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errs = {};
    if (!username.trim()) {
      errs.username = 'Username wajib diisi.';
    }
    if (!password) {
      errs.password = 'Password wajib diisi.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      }
      setServerError(result.message || 'Username atau password salah.');
    }
  };

  const quickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrors({});
    setServerError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#241A15',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #4A3525 0%, #1A130F 85%)',
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          borderRadius: '16px',
          border: '1px solid rgba(229, 220, 211, 0.15)'
        }}
      >
        <div style={{ padding: '36px 32px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(111, 78, 55, 0.4)'
            }}
          >
            <Coffee size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
            POS Coffee Shop UMKM
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Masuk ke sistem kasir dan laporan penjualan
          </p>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {serverError && (
            <FlashAlert
              type="danger"
              message={serverError}
              onClose={() => setServerError('')}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username <span className="required">*</span>
              </label>
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
                  <User size={18} />
                </span>
                <input
                  id="username"
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              {errors.username && (
                <div className="invalid-feedback">{errors.username}</div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
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
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>
              PILIH AKUN UJI CEPAT (SEEDER):
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickFill('kasir', 'kasir123')}
                title="Login sebagai Admin/Kasir"
              >
                Kasir (kasir123)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickFill('owner', 'owner123')}
                title="Login sebagai Owner"
              >
                Owner (owner123)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
