import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Proveedores = sequelize.define('Proveedores', {
    id_proveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_proveedor: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contacto: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        // 1. Añadir validación a nivel de aplicación
        validate: {
            isEmail: true
        }
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nit: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // 2. Eliminar la definición manual de 'fecha_creacion' de aquí
}, {
    tableName: 'Proveedores',
    // 3. Habilitar timestamps y configurarlos para que solo gestionen 'createdAt'
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false // Le decimos a Sequelize que ignore la columna de actualización
});

export default Proveedores;