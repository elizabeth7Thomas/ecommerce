import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrdenEstado = sequelize.define('OrdenEstado', {
    id_orden_estado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    codigo_estado: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    nombre_estado: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
    },
    color_hex: {
        type: DataTypes.STRING(7),
        defaultValue: '#000000',
        validate: {
            is: /^#[0-9A-F]{6}$/i // Validar formato hex color
        }
    },
    icono: {
        type: DataTypes.STRING(50),
    },
    orden_secuencia: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    es_estado_final: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    es_estado_cancelado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    notificar_cliente: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    notificar_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'orden_estados',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    // 🔥 NUEVO: Agregar índices para mejor performance
    indexes: [
        {
            fields: ['activo', 'orden_secuencia']
        },
        {
            fields: ['codigo_estado']
        }
    ]
});

export default OrdenEstado;