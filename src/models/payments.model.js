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
    id_metodo_pago: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    id_metodo_pago_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    metodo_pago: {
        type: DataTypes.STRING(50),
        allowNull: true, // Mantener por compatibilidad durante migración
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    estado_pago: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: [['pendiente', 'procesando', 'completado', 'fallido', 'reembolsado', 'cancelado']]
        }
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
    codigo_autorizacion: {
        type: DataTypes.STRING(100),
    },
    referencia_externa: {
        type: DataTypes.STRING(255),
    },
    comision: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    ip_origen: {
        type: DataTypes.STRING(50),
    },
    datos_adicionales: {
        type: DataTypes.JSONB,
    },
}, {
    tableName: 'payments',
    timestamps: false,
});

export default Payment;