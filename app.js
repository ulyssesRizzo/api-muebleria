const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const compraRoutes = require('./routes/compraRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // frontend temporal

// Rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/productos', productoRoutes);
app.use('/api/v1/inventario', inventarioRoutes);
app.use('/api/v1/carrito', carritoRoutes);
app.use('/api/v1/compras', compraRoutes);
app.use('/api/v1/reportes', reporteRoutes);

// Manejo de errores genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;