const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_coffee_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const errors = {};
    if (!username || typeof username !== 'string' || !username.trim()) {
      errors.username = 'Username wajib diisi.';
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      errors.password = 'Password wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal.',
        errors
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, username, password, role FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logout berhasil.'
  });
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  me
};
