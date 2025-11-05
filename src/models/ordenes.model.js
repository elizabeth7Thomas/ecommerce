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
    estado_orden: {
        type: DataTypes.STRING(50),
        defaultValue: 'pendiente',
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
