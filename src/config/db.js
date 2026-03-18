const oracledb = require('oracledb');

async function initDb() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('✅ Pool de base de datos Oracle inicializado correctamente');
    } catch (err) {
        console.error('❌ Error inicializando pool de Oracle:', err);
        throw err;
    }
}

module.exports = { initDb, oracledb };