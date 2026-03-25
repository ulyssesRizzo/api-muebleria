const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  obtenerOCrearCarrito,
  agregarItem,
  eliminarItem,
  listarItems,
  vaciarCarrito
} = require('../controllers/carritoController');

const router = express.Router();

// Todas requieren autenticación
router.get('/', authenticateToken, obtenerOCrearCarrito);
router.get('/:carrito_id/items', authenticateToken, listarItems);
router.post('/items', authenticateToken, agregarItem);
router.delete('/:carrito_id/items/:producto_id', authenticateToken, eliminarItem);
router.delete('/:carrito_id', authenticateToken, vaciarCarrito);

module.exports = router;