const express = require('express');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const {
  ventasDiarias,
  productoMasVendido,
  comprasPorCliente
} = require('../controllers/reporteController');

const router = express.Router();

// Solo administradores
router.get('/ventas-diarias', authenticateToken, authorizeAdmin, ventasDiarias);
router.get('/producto-mas-vendido', authenticateToken, authorizeAdmin, productoMasVendido);
router.get('/compras-cliente/:cliente_id', authenticateToken, authorizeAdmin, comprasPorCliente);

module.exports = router;