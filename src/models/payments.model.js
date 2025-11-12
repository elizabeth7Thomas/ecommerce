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
    // 1. Quitar la columna antigua y obsoleta
    // metodo_pago: { ... },

    // 2. Añadir las nuevas llaves foráneas que la reemplazan
    id_metodo_pago: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser nulo si se usa id_metodo_pago_cliente
    },
    id_metodo_pago_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser nulo si es un pago único
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
    // 3. Añadir el resto de las nuevas columnas de la migración
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
    // 4. Ajustar el nombre para que coincida exactamente
    tableName: 'payments',
    timestamps: false, // Correcto, esta tabla no tiene timestamps de auditoría
});

export default Payment;