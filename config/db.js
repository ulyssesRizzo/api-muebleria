const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool; // variable global para el pool

async function initPool() {
  if (!pool) {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
  }
  return pool;
}

async function getConnection() {
  const p = await initPool();
  return await p.getConnection();
}

async function executeProcedure(procName, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `BEGIN ${procName}(${binds.map((_, i) => `:${i+1}`).join(',')}); END;`,
      binds,
      options
    );
    return result;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { getConnection, executeProcedure, initPool };