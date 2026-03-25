function handleOracleError(err, res) {
  console.error('Oracle error:', err);
  let status = 500;
  let message = 'Error en el servidor';

  if (err.errorNum) {
    switch (err.errorNum) {
      case 20001: // Documento duplicado
        status = 409;
        message = 'Número de documento ya existe';
        break;
      case 20002: // Cliente no existe
        status = 404;
        message = 'Cliente no encontrado';
        break;
      case 20003: // Cliente con ordenes
        status = 400;
        message = 'No se puede eliminar cliente con compras';
        break;
      case 20004: // Cliente inactivo
        status = 400;
        message = 'Cliente inactivo';
        break;
      case 20011: // Referencia duplicada
        status = 409;
        message = 'Referencia de producto ya existe';
        break;
      case 20012: // Producto no existe
        status = 404;
        message = 'Producto no encontrado';
        break;
      case 20013: // Producto comprado
        status = 400;
        message = 'No se puede eliminar producto ya comprado';
        break;
      case 20014: // Producto en carrito activo
        status = 400;
        message = 'Producto en carritos activos, no se puede eliminar';
        break;
      case 20015: // Producto inactivo
        status = 400;
        message = 'Producto inactivo';
        break;
      case 20021: // Inventario no existe
        status = 404;
        message = 'Inventario no encontrado';
        break;
      case 20041: // Credenciales inválidas
        status = 401;
        message = 'Credenciales inválidas';
        break;
      case 20042: // Usuario inactivo
        status = 401;
        message = 'Usuario inactivo';
        break;
      case 20043: // Username duplicado
        status = 409;
        message = 'Nombre de usuario ya existe';
        break;
      case 20051: // Carrito vacío
        status = 400;
        message = 'El carrito está vacío';
        break;
      case 20052: // Stock insuficiente
        status = 400;
        message = 'Stock insuficiente para uno o más productos';
        break;
      case 20053: // Carrito no existe
        status = 404;
        message = 'Carrito no encontrado';
        break;
      case 20054: // Carrito no activo
        status = 400;
        message = 'El carrito no está activo';
        break;
      case 20055: // Carrito no pertenece al cliente
        status = 403;
        message = 'El carrito no pertenece al cliente';
        break;
      default:
        message = err.message || 'Error en la base de datos';
    }
  }

  res.status(status).json({ error: message });
}

module.exports = { handleOracleError };