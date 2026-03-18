const { oracledb } = require('../config/db');

const obtenerClientes = async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        // Asumiendo que tienes un SP para listar todos o usas una vista
        const result = await connection.execute(
            `BEGIN PKG_CLIENTES.SP_OBTENER_TODOS(:o_rc); END;`,
            { o_rc: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }
        );

        const resultSet = result.outBinds.o_rc;
        const rows = await resultSet.getRows();
        await resultSet.close();

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

module.exports = { obtenerClientes };