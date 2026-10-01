function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Data dengan nilai tersebut sudah terdaftar.',
      error: err.sqlMessage || err.message
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: 'Data tidak dapat dihapus karena masih terkait dengan data transaksi lain.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
