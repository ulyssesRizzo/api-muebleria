const { executeProcedure } = require('../config/db');
const { handleOracleError } = require('../utils/errorHandler');
const oracledb = require('oracledb');

async function crearProducto(req, res) {
  const {
    referencia, nombre, descripcion, tipo_mueble_id, material,
    alto_cm, ancho_cm, prof_cm, color, peso_gramos, foto_url
  } = req.body;

  const binds = [
    { dir: oracledb.BIND_IN, val: referencia, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: nombre, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: descripcion || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: tipo_mueble_id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: material || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: alto_cm, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: ancho_cm, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: prof_cm, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: color || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: peso_gramos, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: foto_url || null, type: oracledb.STRING },
    { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  ];

  try {
    const result = await executeProcedure('PKG_PRODUCTOS.SP_CREAR_PRODUCTO', binds);
    res.status(201).json({ producto_id: result.outBinds[0] });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function actualizarProducto(req, res) {
  const { id } = req.params;
  const {
    nombre, descripcion, tipo_mueble_id, material,
    alto_cm, ancho_cm, prof_cm, color, peso_gramos, foto_url
  } = req.body;

  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: nombre || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: descripcion || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: tipo_mueble_id || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: material || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: alto_cm || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: ancho_cm || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: prof_cm || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: color || null, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: peso_gramos || null, type: oracledb.NUMBER },
    { dir: oracledb.BIND_IN, val: foto_url || null, type: oracledb.STRING }
  ];

  try {
    await executeProcedure('PKG_PRODUCTOS.SP_ACTUALIZAR_PRODUCTO', binds);
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function eliminarProducto(req, res) {
  const { id } = req.params;
  const binds = [{ dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER }];

  try {
    await executeProcedure('PKG_PRODUCTOS.SP_ELIMINAR_PRODUCTO', binds);
    res.json({ message: 'Producto eliminado (desactivado) correctamente' });
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function obtenerProducto(req, res) {
  const { id } = req.params;
  const binds = [
    { dir: oracledb.BIND_IN, val: id, type: oracledb.NUMBER },
    { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  ];

  try {
    const result = await executeProcedure('PKG_PRODUCTOS.SP_OBTENER_PRODUCTO', binds);
    const cursor = result.outBinds[0];
    const rows = await cursor.getRows();
    await cursor.close();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    handleOracleError(err, res);
  }
}

async function buscarProductos(req, res) {
  const texto = req.query.texto || null;
  const tipo = req.query.tipo_mueble_id || null;
  const admin = req.query.admin === 'true';
  const procName = admin ? 'PKG_PRODUCTOS.SP_BUSCAR_PRODUCTOS_ADMIN' : 'PKG_PRODUCTOS.SP_BUSCAR_PRODUCTOS';

  const binds = [
    { dir: oracledb.BIND_IN, val: texto, type: oracledb.STRING },
    { dir: oracledb.BIND_IN, val: tipo, type: oracledb.NUMBER },
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

module.exports = {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProducto,
  buscarProductos
};