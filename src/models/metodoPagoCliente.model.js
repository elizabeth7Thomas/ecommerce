import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MetodoPagoCliente = sequelize.define('MetodoPagoCliente', {
    id_metodo_pago_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_metodo_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    alias: {
        type: DataTypes.STRING(100),
    },
    numero_tarjeta_ultimos_4: {
        type: DataTypes.STRING(4),
    },
    nombre_titular: {
        type: DataTypes.STRING(255),
    },
    fecha_expiracion: {
        type: DataTypes.DATEONLY,
    },
    tipo_tarjeta: {
        type: DataTypes.ENUM('visa', 'mastercard', 'amex', 'discover', 'otro'),
    },
    banco: {
        type: DataTypes.STRING(100),
    },
    numero_cuenta: {
        type: DataTypes.STRING(255),
    },
    email_billetera: {
        type: DataTypes.STRING(255),
    },
    telefono_billetera: {
        type: DataTypes.STRING(20),
    },
    identificador_externo: {
        type: DataTypes.STRING(255),
    },
    token_pago: {
        type: DataTypes.STRING(255),
    },
    proveedor_token: {
        type: DataTypes.STRING(50),
    },
    es_predeterminado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    fecha_verificacion: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'Metodos_Pago_Cliente',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

export default MetodoPagoCliente;
