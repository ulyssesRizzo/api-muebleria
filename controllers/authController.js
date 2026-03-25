const { executeProcedure } = require('../config/db');
const jwt = require('jsonwebtoken');
const { handleOracleError } = require('../utils/errorHandler');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  const binds = [
    { dir: oracledb.BIND_IN, val: username, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: password, type: oracledb.STRING },
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // o_usuario_id
    { dir: oracledb.BIND_OUT, type: oracledb.STRING },   // o_rol
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }    // o_cliente_id
  ];

  try {
    const result = await executeProcedure('PKG_SEGURIDAD.SP_LOGIN', binds);
    const outBinds = result.outBinds;
    const usuarioId = outBinds[0];
    const rol = outBinds[1];
    const clienteId = outBinds[2];

    const token = jwt.sign(
      { usuario_id: usuarioId, rol, cliente_id: clienteId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario_id: usuarioId, rol, cliente_id: clienteId });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function registerCliente(req, res) {
  // Primero creamos el cliente, luego el usuario.
  // Los parámetros vienen del cuerpo
  const {
    tipo_persona, tipo_doc_id, num_documento, nit, nombres, apellidos,
    razon_social, tel_res, tel_cel, direccion, ciudad_id, profesion,
    email, idioma_id, username, password
  } = req.body;

  if (!tipo_persona || !tipo_doc_id || !num_documento || !tel_res || !direccion || !ciudad_id || !email || !username || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  let clienteId;

  try {
    // 1. Crear cliente
    const clienteBinds = [
      { dir: oracledb.BIND_IN, val: tipo_persona, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: tipo_doc_id, type: oracledb.NUMBER },
      { dir: oracledb.BIND_IN, val: num_documento, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: nit || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: nombres || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: apellidos || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: razon_social || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: tel_res, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: tel_cel || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: direccion, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: ciudad_id, type: oracledb.NUMBER },
      { dir: oracledb.BIND_IN, val: profesion || null, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: email, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: idioma_id || null, type: oracledb.NUMBER },
      { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } // o_cliente_id
    ];
    const clienteResult = await executeProcedure('PKG_CLIENTES.SP_CREAR_CLIENTE', clienteBinds);
    clienteId = clienteResult.outBinds[0];

    // 2. Crear usuario asociado
    const userBinds = [
      { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
      { dir: oracledb.BIND_IN, val: username, type: oracledb.STRING },
      { dir: oracledb.BIND_IN, val: password, type: oracledb.STRING },
      { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } // o_usuario_id
    ];
    await executeProcedure('PKG_SEGURIDAD.SP_CREAR_USUARIO_CLIENTE', userBinds);

    res.status(201).json({ message: 'Cliente y usuario creados exitosamente', cliente_id: clienteId });
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = { login, registerCliente };