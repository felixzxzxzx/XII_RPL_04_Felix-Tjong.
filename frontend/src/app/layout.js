import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'POS Web Coffee Shop UMKM',
  description: 'Aplikasi Kasir dan Manajemen Penjualan Coffee Shop UMKM'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
