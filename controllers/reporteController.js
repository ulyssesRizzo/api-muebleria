const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

async function ventasDiarias(req, res) {
  const { fecha_ini, fecha_fin, ciudad_id } = req.query;

  const binds = [
    { dir: oracledb.BIND_IN, val: fecha_ini || null, type: oracledb.DATE },
    { dir: oracledb.BIND_IN, val: fecha_fin || null, type: oracledb.DATE },
    { dir: oracledb.BIND_IN, val: ciudad_id || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_REPORTES.SP_VENTAS_DIARIAS', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function productoMasVendido(req, res) {
  const { fecha_ini, fecha_fin, ciudad_id } = req.query;

  const binds = [
    { dir: oracledb.BIND_IN, val: fecha_ini || null, type: oracledb.DATE },
    { dir: oracledb.BIND_IN, val: fecha_fin || null, type: oracledb.DATE },
    { dir: oracledb.BIND_IN, val: ciudad_id || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_REPORTES.SP_PRODUCTO_MAS_VENDIDO', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows[0] || {});
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function comprasPorCliente(req, res) {
  const { cliente_id } = req.params;
  const { fecha_ini, fecha_fin } = req.query;

  const binds = [
    { dir: oracledb.BIND_IN, val: cliente_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: fecha_ini || null, type: oracledb.DATE },
    { dir: oracledb.BIND_IN, val: fecha_fin || null, type: oracledb.DATE },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_REPORTES.SP_COMPRAS_POR_CLIENTE', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    res.json(rows);
  } catch (err) {
    handleOracleError(err, res);
  }
}

module.exports = { ventasDiarias, productoMasVendido, comprasPorCliente };