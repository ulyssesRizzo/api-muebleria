const express = require('express');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const {
  obtenerCliente,
  actualizarCliente,
  eliminarCliente,
  buscarClientes
} = require('../controllers/clienteController');

const router = express.Router();

// Rutas públicas o con autenticación
router.get('/', authenticateToken, buscarClientes); // con query param ?texto=...&admin=true
router.get('/:id', authenticateToken, obtenerCliente);
router.put('/:id', authenticateToken, actualizarCliente);
router.delete('/:id', authenticateToken, authorizeAdmin, eliminarCliente); // solo admin

module.exports = router;