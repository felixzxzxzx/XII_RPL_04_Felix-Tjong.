const { pool } = require('../config/db');

async function getDailyReport(req, res, next) {
  try {
    const requestedDate = req.query.date && req.query.date.trim() 
      ? req.query.date.trim() 
      : null;

    const summaryQuery = requestedDate
      ? 'SELECT COUNT(*) AS jml_transaksi, COALESCE(SUM(total_price), 0) AS omset FROM orders WHERE DATE(created_at) = ?'
      : 'SELECT COUNT(*) AS jml_transaksi, COALESCE(SUM(total_price), 0) AS omset FROM orders WHERE DATE(created_at) = CURDATE()';
    const summaryParams = requestedDate ? [requestedDate] : [];

    const [summaryRows] = await pool.query(summaryQuery, summaryParams);

    const paymentQuery = requestedDate
      ? 'SELECT payment_method, COUNT(*) AS jml, COALESCE(SUM(total_price), 0) AS total FROM orders WHERE DATE(created_at) = ? GROUP BY payment_method'
      : 'SELECT payment_method, COUNT(*) AS jml, COALESCE(SUM(total_price), 0) AS total FROM orders WHERE DATE(created_at) = CURDATE() GROUP BY payment_method';
    const paymentParams = requestedDate ? [requestedDate] : [];

    const [paymentRows] = await pool.query(paymentQuery, paymentParams);

    const topProductsQuery = requestedDate
      ? `SELECT p.id, p.name, p.category, SUM(d.qty) AS terjual, SUM(d.subtotal) AS pendapatan
         FROM order_details d 
         JOIN orders o ON o.id = d.order_id
         JOIN products p ON p.id = d.product_id
         WHERE DATE(o.created_at) = ? 
         GROUP BY p.id 
         ORDER BY terjual DESC 
         LIMIT 5`
      : `SELECT p.id, p.name, p.category, SUM(d.qty) AS terjual, SUM(d.subtotal) AS pendapatan
         FROM order_details d 
         JOIN orders o ON o.id = d.order_id
         JOIN products p ON p.id = d.product_id
         WHERE DATE(o.created_at) = CURDATE() 
         GROUP BY p.id 
         ORDER BY terjual DESC 
         LIMIT 5`;
    const topProductsParams = requestedDate ? [requestedDate] : [];

    const [topProductsRows] = await pool.query(topProductsQuery, topProductsParams);

    const ordersQuery = requestedDate
      ? `SELECT o.id, o.user_id, u.name AS cashier_name, o.total_price, o.payment_method, o.amount_paid, o.change_amount, o.created_at
         FROM orders o
         JOIN users u ON u.id = o.user_id
         WHERE DATE(o.created_at) = ?
         ORDER BY o.created_at DESC`
      : `SELECT o.id, o.user_id, u.name AS cashier_name, o.total_price, o.payment_method, o.amount_paid, o.change_amount, o.created_at
         FROM orders o
         JOIN users u ON u.id = o.user_id
         WHERE DATE(o.created_at) = CURDATE()
         ORDER BY o.created_at DESC`;
    const ordersParams = requestedDate ? [requestedDate] : [];

    const [ordersRows] = await pool.query(ordersQuery, ordersParams);

    return res.status(200).json({
      success: true,
      data: {
        date: requestedDate || 'Hari ini',
        summary: {
          jml_transaksi: parseInt(summaryRows[0].jml_transaksi, 10),
          omset: parseInt(summaryRows[0].omset, 10)
        },
        rekap_metode_pembayaran: paymentRows,
        produk_terlaris: topProductsRows,
        daftar_transaksi: ordersRows
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyReport
};
