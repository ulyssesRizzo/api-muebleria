const app = require('./app');
const { initPool } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initPool(); // inicializa el pool
    console.log('Conexión a Oracle establecida');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al conectar a Oracle:', err);
    process.exit(1);
  }
}

startServer();