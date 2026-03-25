const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  confirmarCompra,
  obtenerOrden,
  obtenerDetalleOrden,
  listarOrdenesCliente
} = require('../controllers/compraController');

const router = express.Router();

router.post('/confirmar', authenticateToken, confirmarCompra);
router.get('/', authenticateToken, listarOrdenesCliente);
router.get('/:orden_id', authenticateToken, obtenerOrden);
router.get('/:orden_id/detalle', authenticateToken, obtenerDetalleOrden);

module.exports = router;