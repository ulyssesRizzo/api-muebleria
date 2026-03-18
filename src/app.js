
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const compraRoutes = require('./routes/compraRoutes');

const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde React
app.use(express.json()); // Permite leer JSON en el body de las peticiones
app.use(morgan('dev')); // Muestra las peticiones en la consola

// Registrar Rutas Base
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/productos', productoRoutes);
app.use('/api/v1/compras', compraRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

module.exports = app;