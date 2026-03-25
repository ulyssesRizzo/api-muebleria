const express = require('express');
const { login, registerCliente } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/register', registerCliente);

module.exports = router;