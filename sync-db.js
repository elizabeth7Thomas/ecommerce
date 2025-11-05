import sequelize from './src/config/database.js';
import { CategoriaProducto, Producto } from './src/models/index.js';

const syncDatabase = async () => {
    try {
        console.log('🔄 Sincronizando modelos con la base de datos...');
        
        // Sincronizar los modelos con la BD (alter: true permite modificaciones)
        await sequelize.sync({ alter: true });
        
        console.log('✅ Base de datos sincronizada correctamente');
        
        // Verificar que la tabla existe
        const categorias = await CategoriaProducto.findAll();
        console.log(`📊 Total de categorías en la BD: ${categorias.length}`);
        
        // Si no hay categorías, insertar las por defecto
        if (categorias.length === 0) {
            console.log('➕ Creando categorías por defecto...');
            await CategoriaProducto.bulkCreate([
                { nombre_categoria: 'Electrónica', descripcion: 'Dispositivos electrónicos y accesorios', activo: true },
                { nombre_categoria: 'Ropa', descripcion: 'Vestimenta para hombre y mujer', activo: true },
                { nombre_categoria: 'Hogar', descripcion: 'Artículos para el hogar', activo: true },
                { nombre_categoria: 'Deportes', descripcion: 'Equipamiento deportivo', activo: true }
            ], { ignoreDuplicates: true });
            console.log('✅ Categorías insertadas exitosamente');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error sincronizando la base de datos:', error);
        process.exit(1);
    }
};

syncDatabase();
