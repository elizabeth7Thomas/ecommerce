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
    },
    nombre_estado: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
    },
    color_hex: {
        type: DataTypes.STRING(7),
        defaultValue: '#000000',
    },
    icono: {
        type: DataTypes.STRING(50),
    },
    orden_secuencia: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
    tableName: 'Orden_Estados',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

export default OrdenEstado;
