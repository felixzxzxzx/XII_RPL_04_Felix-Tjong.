const { pool } = require('../config/db');

async function getPosProducts(req, res, next) {
  try {
    const { category, q } = req.query;

    const conditions = [];
    const params = [];

    if (category && category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }

    if (q && q.trim()) {
      conditions.push('name LIKE ?');
      params.push(`%${q.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [products] = await pool.query(
      `SELECT id, name, category, price, stock, image_url 
       FROM products 
       ${whereClause} 
       ORDER BY category ASC, name ASC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
}

async function checkout(req, res, next) {
  const { items, payment_method, amount_paid } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'Keranjang masih kosong.',
      errors: { items: 'Keranjang masih kosong.' }
    });
  }

  const validPaymentMethods = ['Tunai', 'QRIS'];
  if (!payment_method || !validPaymentMethods.includes(payment_method)) {
    return res.status(422).json({
      success: false,
      message: 'Pilih metode pembayaran.',
      errors: { payment_method: 'Pilih metode pembayaran.' }
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal.',
        errors: { [`items[${i}].product_id`]: 'Product ID wajib disertakan.' }
      });
    }

    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(422).json({
        success: false,
        message: 'Jumlah minimal 1.',
        errors: { [`items[${i}].qty`]: 'Jumlah minimal 1.' }
      });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: `Produk dengan ID ${item.product_id} tidak ditemukan.`
        });
      }

      const product = rows[0];
      const requestedQty = parseInt(item.qty, 10);

      if (requestedQty > product.stock) {
        await connection.rollback();
        return res.status(422).json({
          success: false,
          message: `Stok ${product.name} tidak cukup (sisa ${product.stock}).`,
          errors: {
            stock: `Stok ${product.name} tidak cukup (sisa ${product.stock}).`
          }
        });
      }

      const subtotal = product.price * requestedQty;
      calculatedTotal += subtotal;

      processedItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        qty: requestedQty,
        subtotal
      });
    }

    let finalAmountPaid = 0;
    let changeAmount = 0;

    if (payment_method === 'Tunai') {
      if (amount_paid === undefined || amount_paid === null || amount_paid === '') {
        await connection.rollback();
        return res.status(422).json({
          success: false,
          message: 'Uang diterima kurang dari total.',
          errors: { amount_paid: 'Uang diterima kurang dari total.' }
        });
      }

      finalAmountPaid = parseInt(amount_paid, 10);
      if (isNaN(finalAmountPaid) || finalAmountPaid < calculatedTotal) {
        await connection.rollback();
        return res.status(422).json({
          success: false,
          message: 'Uang diterima kurang dari total.',
          errors: { amount_paid: 'Uang diterima kurang dari total.' }
        });
      }

      changeAmount = finalAmountPaid - calculatedTotal;
    } else if (payment_method === 'QRIS') {
      finalAmountPaid = calculatedTotal;
      changeAmount = 0;
    }

    const userId = req.user?.id || 1;
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_price, payment_method, amount_paid, change_amount, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, calculatedTotal, payment_method, finalAmountPaid, changeAmount]
    );

    const orderId = orderResult.insertId;

    for (const item of processedItems) {
      await connection.query(
        `INSERT INTO order_details (order_id, product_id, price, qty, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.price, item.qty, item.subtotal]
      );

      await connection.query(
        `UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan.',
      data: {
        order_id: orderId,
        user_id: userId,
        total_price: calculatedTotal,
        payment_method,
        amount_paid: finalAmountPaid,
        change_amount: changeAmount,
        items: processedItems
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getPosProducts,
  checkout
};
