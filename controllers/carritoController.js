const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

// Obtener o crear carrito activo (devuelve carrito_id)
async function obtenerOCrearCarrito(req, res) {
  const clienteId = req.user.cliente_id; // viene del token
  if (!clienteId) {
    return res.status(400).json({ error: 'Cliente no asociado al usuario' });
  }

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  ];

  try {
    const result = await executeProcedure('PKG_CARRITO.SP_OBTENER_O_CREAR_ACTIVO', binds);
    res.json({ carrito_id: result.outBinds[0] });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function agregarItem(req, res) {
  const { carrito_id, producto_id, cantidad } = req.body;
  const clienteId = req.user.cliente_id;

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: carrito_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: producto_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: cantidad, type: oracledb.NUMBER }
  ];

  try {
    await executeProcedure('PKG_CARRITO.SP_AGREGAR_ITEM', binds);
    res.json({ message: 'Item agregado al carrito' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function eliminarItem(req, res) {
  const { carrito_id, producto_id } = req.params; // o en body, según diseño
  const clienteId = req.user.cliente_id;

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: carrito_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: producto_id, type: oracledb.NUMBER }
  ];

  try {
    await executeProcedure('PKG_CARRITO.SP_ELIMINAR_ITEM', binds);
    res.json({ message: 'Item eliminado del carrito' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function listarItems(req, res) {
  const { carrito_id } = req.params;
  const clienteId = req.user.cliente_id;

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: carrito_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_CARRITO.SP_LISTAR_ITEMS', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function vaciarCarrito(req, res) {
  const { carrito_id } = req.params;
  const clienteId = req.user.cliente_id;

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: carrito_id, type: oracledb.NUMBER }
  ];

  try {
    await executeProcedure('PKG_CARRITO.SP_VACIAR_CARRITO', binds);
    res.json({ message: 'Carrito vaciado correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = {
  obtenerOCrearCarrito,
  agregarItem,
  eliminarItem,
  listarItems,
  vaciarCarrito
};