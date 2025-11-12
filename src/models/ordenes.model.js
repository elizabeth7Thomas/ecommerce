import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Orden = sequelize.define('Orden', {
    id_orden: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_direccion_envio: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // fecha_orden será manejada por createdAt
    total_orden: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    id_estado_orden: {
        type: DataTypes.INTEGER,
        allowNull: true, // Correcto, ya que puede no tener estado inicial
    },
    fecha_estado_cambio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    dias_estimados_entrega: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    notas_orden: {
        type: DataTypes.TEXT,
    },
}, {
    // 1. Ajustar nombre de la tabla para consistencia
    tableName: 'ordenes',
    timestamps: true,
    createdAt: 'fecha_orden', // Mapeo inteligente
    updatedAt: 'fecha_actualizacion',
});

export default Orden;