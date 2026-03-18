const { oracledb } = require('../config/db');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        connection = await oracledb.getConnection();

        // Llama a tu paquete de seguridad en Oracle
        const result = await connection.execute(
            `BEGIN PKG_SEGURIDAD.SP_LOGIN(:p_username, :p_password, :o_usuario_id, :o_rol, :o_cliente_id); END;`,
            {
                p_username: username,
                p_password: password, // Asumiendo que el SP maneja el hash SHA-256 internamente
                o_usuario_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                o_rol: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
                o_cliente_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }
        );

        const { o_usuario_id, o_rol, o_cliente_id } = result.outBinds;

        if (!o_usuario_id) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        // Genera el token JWT
        const token = jwt.sign(
            { usuario_id: o_usuario_id, rol: o_rol, cliente_id: o_cliente_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({ success: true, token, rol: o_rol, cliente_id: o_cliente_id });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
};

module.exports = { login };