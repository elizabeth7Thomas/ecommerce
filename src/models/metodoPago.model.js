import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MetodoPago = sequelize.define('MetodoPago', {
    id_metodo_pago: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre_metodo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    tipo_metodo: {
        type: DataTypes.ENUM('tarjeta_credito', 'tarjeta_debito', 'transferencia_bancaria', 'billetera_digital', 'efectivo', 'cheque', 'criptomoneda'),
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.TEXT,
    },
    icono_url: {
        type: DataTypes.STRING(255),
    },
    requiere_verificacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    comision_porcentaje: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        validate: { min: 0 },
    },
    comision_fija: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: { min: 0 },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    disponible_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    disponible_tienda: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    orden_visualizacion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    configuracion: {
        type: DataTypes.JSONB,
    },
}, {
    tableName: 'Metodos_Pago',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

export default MetodoPago;
