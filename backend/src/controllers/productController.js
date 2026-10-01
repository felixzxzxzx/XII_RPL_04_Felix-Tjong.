const { pool } = require('../config/db');

const VALID_CATEGORIES = ['Kopi', 'Non-Kopi', 'Makanan'];

async function validateProductInput(body, isUpdate = false, productId = null) {
  const errors = {};
  const { name, category, price, stock } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.name = 'Nama produk wajib diisi.';
  } else if (name.trim().length > 100) {
    errors.name = 'Nama produk maksimal 100 karakter.';
  } else {
    let query = 'SELECT id FROM products WHERE name = ?';
    const params = [name.trim()];
    if (isUpdate && productId) {
      query += ' AND id != ?';
      params.push(productId);
    }
    query += ' LIMIT 1';

    const [existing] = await pool.query(query, params);
    if (existing.length > 0) {
      errors.name = 'Nama produk sudah terdaftar.';
    }
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.category = 'Kategori tidak valid.';
  }

  if (price === undefined || price === null || price === '') {
    errors.price = 'Harga harus berupa angka lebih dari 0.';
  } else {
    const numPrice = Number(price);
    if (!Number.isInteger(numPrice) || numPrice <= 0) {
      errors.price = 'Harga harus berupa angka lebih dari 0.';
    }
  }

  if (stock === undefined || stock === null || stock === '') {
    errors.stock = 'Stok tidak boleh negatif.';
  } else {
    const numStock = Number(stock);
    if (!Number.isInteger(numStock) || numStock < 0) {
      errors.stock = 'Stok tidak boleh negatif.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

async function getProducts(req, res, next) {
  try {
    const { q, category, stock, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (q && q.trim()) {
      conditions.push('name LIKE ?');
      params.push(`%${q.trim()}%`);
    }

    if (category && category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }

    if (stock) {
      if (stock === 'low' || stock === 'menipis') {
        conditions.push('stock <= 5 AND stock > 0');
      } else if (stock === 'out' || stock === 'habis') {
        conditions.push('stock = 0');
      } else if (stock === 'available' || stock === 'tersedia') {
        conditions.push('stock > 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [products] = await pool.query(
      `SELECT id, name, category, price, stock, image_url, created_at, updated_at 
       FROM products 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: products,
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

async function createProduct(req, res, next) {
  try {
    const validation = await validateProductInput(req.body, false);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal.',
        errors: validation.errors
      });
    }

    const { name, category, price, stock } = req.body;
    let finalImageUrl = req.body.image_url || null;
    if (req.file) {
      finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, category, price, stock, image_url, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name.trim(), category, parseInt(price, 10), parseInt(stock, 10), finalImageUrl]
    );

    const [newProduct] = await pool.query(
      'SELECT id, name, category, price, stock, image_url, created_at, updated_at FROM products WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan oleh Owner.',
      data: newProduct[0]
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const [productRows] = await pool.query(
      'SELECT id, name, category, price, stock, image_url, created_at, updated_at FROM products WHERE id = ?',
      [id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    const product = productRows[0];

    const [salesSummary] = await pool.query(
      `SELECT 
        COALESCE(SUM(od.qty), 0) AS total_sold,
        COALESCE(SUM(od.subtotal), 0) AS total_revenue,
        COUNT(DISTINCT od.order_id) AS total_orders
       FROM order_details od
       WHERE od.product_id = ?`,
      [id]
    );

    const [recentOrders] = await pool.query(
      `SELECT 
        o.id AS order_id,
        o.created_at,
        o.payment_method,
        od.price,
        od.qty,
        od.subtotal
       FROM order_details od
       JOIN orders o ON o.id = od.order_id
       WHERE od.product_id = ?
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        sales_summary: salesSummary[0],
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'admin';

    const [existing] = await pool.query(
      'SELECT id, name, category, price, stock, image_url FROM products WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    const currentProduct = existing[0];

    if (userRole === 'admin') {
      const { stock } = req.body;
      if (stock === undefined || stock === null || stock === '') {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal.',
          errors: { stock: 'Stok tidak boleh negatif.' }
        });
      }

      const numStock = Number(stock);
      if (!Number.isInteger(numStock) || numStock < 0) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal.',
          errors: { stock: 'Stok tidak boleh negatif.' }
        });
      }

      await pool.query(
        'UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?',
        [numStock, id]
      );

      const [updatedProduct] = await pool.query(
        'SELECT id, name, category, price, stock, image_url, created_at, updated_at FROM products WHERE id = ?',
        [id]
      );

      return res.status(200).json({
        success: true,
        message: `Jumlah stok '${currentProduct.name}' berhasil diperbarui menjadi ${numStock}.`,
        data: updatedProduct[0]
      });
    }

    const validation = await validateProductInput(req.body, true, id);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal.',
        errors: validation.errors
      });
    }

    const { name, category, price, stock } = req.body;
    let finalImageUrl = req.body.image_url !== undefined ? req.body.image_url : currentProduct.image_url;
    if (req.file) {
      finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await pool.query(
      `UPDATE products 
       SET name = ?, category = ?, price = ?, stock = ?, image_url = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name.trim(), category, parseInt(price, 10), parseInt(stock, 10), finalImageUrl, id]
    );

    const [updatedProduct] = await pool.query(
      'SELECT id, name, category, price, stock, image_url, created_at, updated_at FROM products WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui oleh Owner.',
      data: updatedProduct[0]
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const [productRows] = await pool.query('SELECT id, name FROM products WHERE id = ?', [id]);
    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    const [salesCount] = await pool.query(
      'SELECT COUNT(*) as count FROM order_details WHERE product_id = ?',
      [id]
    );

    if (salesCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Produk '${productRows[0].name}' tidak dapat dihapus karena sudah memiliki riwayat transaksi.`
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Produk '${productRows[0].name}' berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct
};
