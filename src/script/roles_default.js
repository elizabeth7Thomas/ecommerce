import sequelize from '../config/database.js';
import Rol from '../models/rol.model.js';
import Usuario from '../models/user.model.js';

/**
 * Script para insertar roles por defecto en la base de datos
 * Ejecutar: node src/script/roles_default.js
 */

const rolesDefault = [
    {
        id_rol: 1,
        nombre_rol: 'administrador',
        descripcion: 'Acceso total al sistema',
        permisos: {
            productos: ['crear', 'editar', 'eliminar', 'ver'],
            categorias: ['crear', 'editar', 'eliminar', 'ver'],
            usuarios: ['crear', 'editar', 'eliminar', 'ver'],
            clientes: ['crear', 'editar', 'eliminar', 'ver'],
            direcciones: ['crear', 'editar', 'eliminar', 'ver'],
            carrito: ['ver', 'gestionar'],
            ordenes: ['crear', 'editar', 'eliminar', 'ver', 'gestionar'],
            pagos: ['crear', 'ver', 'gestionar'],
            roles: ['crear', 'editar', 'eliminar', 'ver'],
            imagenes: ['crear', 'editar', 'eliminar', 'ver']
        },
        activo: true
    },
    {
        id_rol: 2,
        nombre_rol: 'cliente',
        descripcion: 'Usuario estándar con permisos de compra',
        permisos: {
            productos: ['ver'],
            categorias: ['ver'],
            carrito: ['crear', 'editar', 'eliminar', 'ver'],
            ordenes: ['crear', 'ver'],
            pagos: ['crear', 'ver'],
            direcciones: ['crear', 'editar', 'eliminar', 'ver'],
            perfil: ['ver', 'editar']
        },
        activo: true
    },
    {
        id_rol: 3,
        nombre_rol: 'vendedor',
        descripcion: 'Usuario con permisos de gestión de productos',
        permisos: {
            productos: ['crear', 'editar', 'ver'],
            categorias: ['ver'],
            imagenes: ['crear', 'editar', 'ver'],
            ordenes: ['ver'],
            clientes: ['ver']
        },
        activo: true
    },
    {
        id_rol: 4,
        nombre_rol: 'moderador',
        descripcion: 'Usuario con permisos de moderación',
        permisos: {
            productos: ['ver', 'editar'],
            categorias: ['ver', 'editar'],
            usuarios: ['ver'],
            clientes: ['ver'],
            ordenes: ['ver', 'gestionar'],
            pagos: ['ver']
        },
        activo: true
    }
];

async function insertDefaultRoles() {
    try {
        // Conectar a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');

        // Sincronizar modelos (crear tablas si no existen)
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados.');

        // Insertar roles por defecto
        console.log('\n📋 Insertando roles por defecto...\n');

        for (const rolData of rolesDefault) {
            const [rol, created] = await Rol.findOrCreate({
                where: { nombre_rol: rolData.nombre_rol },
                defaults: rolData
            });

            if (created) {
                console.log(`✅ Rol creado: ${rol.nombre_rol} (ID: ${rol.id_rol})`);
            } else {
                console.log(`ℹ️  Rol ya existe: ${rol.nombre_rol} (ID: ${rol.id_rol})`);
            }
        }

        console.log('\n🎉 Proceso completado!\n');
        console.log('📝 Roles disponibles:');
        console.log('   1 - Administrador (acceso total)');
        console.log('   2 - Cliente (usuario estándar)');
        console.log('   3 - Vendedor (gestión de productos)');
        console.log('   4 - Moderador (moderación de contenido)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Ejecutar el script
insertDefaultRoles();
