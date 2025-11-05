import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
    id_pago: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    metodo_pago: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    monto: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0 },
    },
    estado_pago: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    fecha_pago: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    transaccion_id: {
        type: DataTypes.STRING(255),
    },
    detalles_pago: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'Payments',
    timestamps: false,
});

export default Payment;
