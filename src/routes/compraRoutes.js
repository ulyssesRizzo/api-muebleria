const express = require('express');
const router = express.Router();
const { procesarCompra } = require('../controllers/compraController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/checkout', verificarToken, procesarCompra);

module.exports = router;