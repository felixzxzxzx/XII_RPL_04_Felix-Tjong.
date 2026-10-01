const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'http://127.0.0.1:5000/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:5000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
