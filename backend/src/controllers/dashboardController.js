const { pool } = require('../config/db');

async function getDashboardData(req, res, next) {
  try {
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) AS jml_transaksi, 
        COALESCE(SUM(total_price), 0) AS omset
      FROM orders 
      WHERE DATE(created_at) = CURDATE();
    `);

    const [stokMenipisRows] = await pool.query(`
      SELECT id, name, category, price, stock 
      FROM products 
      WHERE stock <= 5 
      ORDER BY stock ASC;
    `);

    const [paymentRows] = await pool.query(`
      SELECT 
        payment_method, 
        COUNT(*) AS jml, 
        COALESCE(SUM(total_price), 0) AS total
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
      GROUP BY payment_method;
    `);

    const [recentOrders] = await pool.query(`
      SELECT 
        o.id, 
        u.name AS cashier_name, 
        o.total_price, 
        o.payment_method, 
        o.created_at
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5;
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          jml_transaksi: parseInt(summaryRows[0].jml_transaksi, 10),
          omset: parseInt(summaryRows[0].omset, 10)
        },
        stok_menipis: stokMenipisRows,
        pembayaran_hari_ini: paymentRows,
        transaksi_terbaru: recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardData
};
