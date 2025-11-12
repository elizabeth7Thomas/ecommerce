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
    fecha_orden: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    total_orden: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0 },
    },
    id_estado_orden: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    tableName: 'ordenes',
    timestamps: true,
    createdAt: 'fecha_orden',
    updatedAt: 'fecha_actualizacion',
});

export default Orden;
