const { oracledb } = require('../config/db');

const procesarCompra = async (req, res) => {
    let connection;
    try {
        const { cliente_id, metodo_pago } = req.body;
        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `BEGIN PKG_COMPRAS.SP_PROCESAR_COMPRA(:p_cliente_id, :p_metodo_pago, :o_orden_id); END;`,
            {
                p_cliente_id: cliente_id,
                p_metodo_pago: metodo_pago,
                o_orden_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            },
            { autoCommit: true } // Confirmar la transacción
        );

        res.status(201).json({ success: true, orden_id: result.outBinds.o_orden_id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error procesando la compra' });
    } finally {
        if (connection) try { await connection.close(); } catch (e) {}
    }
};

module.exports = { procesarCompra };