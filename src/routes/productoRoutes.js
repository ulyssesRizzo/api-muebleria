const express = require('express');
const router = express.Router();
const { obtenerProductos } = require('../controllers/productoController');

router.get('/', obtenerProductos); // Catálogo público

module.exports = router;