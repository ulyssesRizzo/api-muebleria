const { oracledb } = require('../config/db');

const obtenerProductos = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `BEGIN PKG_PRODUCTOS.GET_TODOS_PRODUCTOS(:cursor); END;`,
            { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );

        const resultSet = result.outBinds.cursor;
        const rows = await resultSet.getRows();
        await resultSet.close();

        // Mapeo básico asumiendo [id, nombre, precio, stock]
        const productos = rows.map(r => ({ id: r[0], nombre: r[1], precio: r[2], stock: r[3] }));

        res.status(200).json({ success: true, data: productos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    } finally {
        if (connection) try { await connection.close(); } catch (e) {}
    }
};

module.exports = { obtenerProductos };