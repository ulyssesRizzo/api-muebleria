const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

async function obtenerCliente(req, res) {
  const { id } = req.params;
  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_CLIENTES.SP_OBTENER_CLIENTE', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function actualizarCliente(req, res) {
  const { id } = req.params;
  const { tel_res, tel_cel, direccion, ciudad_id, profesion, email, idioma_id } = req.body;

  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: tel_res || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: tel_cel || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: direccion || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: ciudad_id || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: profesion || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: email || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: idioma_id || null, type: oracledb.NUMBER }
  ];

  try {
    await executeProcedure('PKG_CLIENTES.SP_ACTUALIZAR_CLIENTE', binds);
    res.json({ message: 'Cliente actualizado correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function eliminarCliente(req, res) {
  const { id } = req.params;
  const binds = [{ dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER }];

  try {
    await executeProcedure('PKG_CLIENTES.SP_ELIMINAR_CLIENTE', binds);
    res.json({ message: 'Cliente eliminado (desactivado) correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function buscarClientes(req, res) {
  const texto = req.query.texto || null;
  const admin = req.query.admin === 'true';
  const procName = admin ? 'PKG_CLIENTES.SP_BUSCAR_CLIENTES_ADMIN' : 'PKG_CLIENTES.SP_BUSCAR_CLIENTES';

  const binds = [
    { dir: oracledb.BIND_IN, val: texto, type: oracledb.STRING },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure(procName, binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = { obtenerCliente, actualizarCliente, eliminarCliente, buscarClientes };