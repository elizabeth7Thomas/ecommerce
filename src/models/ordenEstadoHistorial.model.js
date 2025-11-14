import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrdenEstadoHistorial = sequelize.define('OrdenEstadoHistorial', {
    id_historial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_estado_anterior: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    id_estado_nuevo: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    comentario: {
        type: DataTypes.TEXT,
    },
    metadata: {
        type: DataTypes.JSONB,
    },
    ip_origen: {
        type: DataTypes.STRING(50),
    },
}, {
    tableName: 'orden_estado_historial',
    timestamps: true,
    createdAt: 'fecha_cambio',
    updatedAt: false,
});

export default OrdenEstadoHistorial;