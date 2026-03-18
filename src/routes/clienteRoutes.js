const express = require('express');
const router = express.Router();
const { obtenerClientes } = require('../controllers/clienteController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Protegemos esta ruta para que solo usuarios logueados puedan ver clientes
router.get('/', verificarToken, obtenerClientes); 

module.exports = router;