const { pool } = require('../config/db');

async function getOrders(req, res, next) {
  try {
    const { from, to, payment, q, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (from && from.trim()) {
      conditions.push('DATE(o.created_at) >= ?');
      params.push(from.trim());
    }

    if (to && to.trim()) {
      conditions.push('DATE(o.created_at) <= ?');
      params.push(to.trim());
    }

    if (payment && payment.trim()) {
      conditions.push('o.payment_method = ?');
      params.push(payment.trim());
    }

    if (q && q.trim()) {
      conditions.push('(o.id = ? OR u.name LIKE ?)');
      params.push(q.trim(), `%${q.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) as total 
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        u.name AS cashier_name,
        o.total_price,
        o.payment_method,
        o.amount_paid,
        o.change_amount,
        o.created_at,
        COUNT(od.id) AS total_items,
        COALESCE(SUM(od.qty), 0) AS total_qty
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_details od ON od.order_id = o.id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        u.name AS cashier_name,
        u.username AS cashier_username,
        o.total_price,
        o.payment_method,
        o.amount_paid,
        o.change_amount,
        o.created_at
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.id = ? LIMIT 1`,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.'
      });
    }

    const order = orderRows[0];

    const [items] = await pool.query(
      `SELECT 
        od.id,
        od.product_id,
        p.name AS product_name,
        p.category AS product_category,
        od.price,
        od.qty,
        od.subtotal
       FROM order_details od
       JOIN products p ON p.id = od.product_id
       WHERE od.order_id = ?
       ORDER BY od.id ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById
};
