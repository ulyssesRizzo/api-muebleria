const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

async function actualizarPrecioStock(req, res) {
  const { id } = req.params;
  const { precio_cop, stock } = req.body;

  if (precio_cop === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Precio y stock son requeridos' });
  }

  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: precio_cop, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: stock, type: oracledb.NUMBER }
  ];

  try {
    await executeProcedure('PKG_INVENTARIO.SP_ACTUALIZAR_PRECIO_STOCK', binds);
    res.json({ message: 'Inventario actualizado correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function obtenerInventario(req, res) {
  const { id } = req.params;
  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_INVENTARIO.SP_OBTENER_INVENTARIO', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = { actualizarPrecioStock, obtenerInventario };