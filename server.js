require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDb(); // Inicia la conexión a Oracle antes de levantar el servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor MDA corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error crítico al arrancar el servidor:', error);
        process.exit(1);
    }
}

startServer();