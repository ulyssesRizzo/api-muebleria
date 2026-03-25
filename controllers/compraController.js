const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

async function confirmarCompra(req, res) {
  const clienteId = req.user.cliente_id;
  const {
    carrito_id, ciudad_entrega_id, direccion_entrega,
    forma_pago_id, descripcion
  } = req.body;

  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: carrito_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: ciudad_entrega_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: direccion_entrega, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: forma_pago_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: descripcion || null, type: oracledb.STRING },
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // o_orden_id
    { dir: oracledb.BIND_OUT, type: oracledb.STRING }, // o_numero_orden
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }  // o_total
  ];

  try {
    const result = await executeProcedure('PKG_COMPRAS.SP_CONFIRMAR_COMPRA_DESDE_CARRITO', binds);
    res.json({
      orden_id: result.outBinds[0],
      numero_orden: result.outBinds[1],
      total: result.outBinds[2]
    });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function obtenerOrden(req, res) {
  const { orden_id } = req.params;
  const binds = [
    { dir: oracledb.BIND_IN, val: orden_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_COMPRAS.SP_OBTENER_ORDEN', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function obtenerDetalleOrden(req, res) {
  const { orden_id } = req.params;
  const binds = [
    { dir: oracledb.BIND_IN, val: orden_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_COMPRAS.SP_OBTENER_ORDEN_DETALLE', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function listarOrdenesCliente(req, res) {
  const clienteId = req.user.cliente_id;
  const binds = [
    { dir: oracledb.BIND_IN, val: clienteId, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_COMPRAS.SP_LISTAR_ORDENES_POR_CLIENTE', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = {
  confirmarCompra,
  obtenerOrden,
  obtenerDetalleOrden,
  listarOrdenesCliente
};