const express = require('express');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProducto,
  buscarProductos
} = require('../controllers/productoController');

const router = express.Router();

router.get('/', buscarProductos); // público
router.get('/:id', obtenerProducto); // público
router.post('/', authenticateToken, authorizeAdmin, crearProducto);
router.put('/:id', authenticateToken, authorizeAdmin, actualizarProducto);
router.delete('/:id', authenticateToken, authorizeAdmin, eliminarProducto);

module.exports = router;