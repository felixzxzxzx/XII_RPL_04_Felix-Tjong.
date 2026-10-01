'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
  isOwner: false,
  isAuthenticated: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('pos_token');
      const storedUser = localStorage.getItem('pos_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading stored auth:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login'];
    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.push('/login');
    } else if (user && isPublic) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = async (username, password) => {
    const res = await apiRequest('/login', {
      method: 'POST',
      body: { username, password }
    });

    if (res.ok && res.raw?.token) {
      const authToken = res.raw.token;
      const authUser = res.raw.user;

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('pos_token', authToken);
      localStorage.setItem('pos_user', JSON.stringify(authUser));

      return { success: true, user: authUser };
    }

    return {
      success: false,
      message: res.message || 'Username atau password salah.',
      errors: res.errors
    };
  };

  const logout = async () => {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch (err) {
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      router.push('/login');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isOwner,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
