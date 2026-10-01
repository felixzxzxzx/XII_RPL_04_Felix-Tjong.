const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const posRoutes = require('./routes/posRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/`, authRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/pos`, posRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
};

registerRoutes('');
registerRoutes('/api');

app.get('/', (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.query.token;
  if (authHeader) {
    return dashboardRoutes(req, res, next);
  }
  res.status(200).json({
    name: 'POS Web Coffee Shop UMKM API',
    version: '1.0.0',
    status: 'running',
    documentation: 'Lihat README.md untuk daftar endpoint dan format request/response.'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
