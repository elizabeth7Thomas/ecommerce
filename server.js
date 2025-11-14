// server.js
import 'dotenv/config';
import app from './app.js';
import { config } from './src/config/server.config.js';
import sequelize from './src/config/database.js';
import './src/models/index.js'; // Importar modelos y sus relaciones

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');
        
        // Sincronización desactivada porque las tablas ya existen (creadas por completo.sql)
        // NOTA: Si necesitas crear/actualizar tablas automáticamente, descomenta la siguiente línea:
        // await sequelize.sync({ force: false, alter: true });
        
        console.log('Base de datos lista para usar.');

        app.listen(config.port, () => {
            console.log(`Servidor escuchando en el puerto ${config.port}`);
            console.log(`API disponible en: http://localhost:${config.port}`);
        });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        process.exit(1);
    }
}

main();
