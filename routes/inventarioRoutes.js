const express = require('express');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { actualizarPrecioStock, obtenerInventario } = require('../controllers/inventarioController');

const router = express.Router();

router.get('/:id', authenticateToken, authorizeAdmin, obtenerInventario);
router.put('/:id', authenticateToken, authorizeAdmin, actualizarPrecioStock);

module.exports = router;