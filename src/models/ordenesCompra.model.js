import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrdenesCompra = sequelize.define('OrdenesCompra', {
    id_orden_compra: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
    id_almacen: { type: DataTypes.INTEGER, allowNull: false },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    numero_orden: { type: DataTypes.STRING(50), unique: true, allowNull: true },
    fecha_orden: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_entrega_esperada: { type: DataTypes.DATE, allowNull: true },
    fecha_entrega_real: { type: DataTypes.DATE, allowNull: true },
    total_orden: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    estado: { type: DataTypes.ENUM('pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada'), defaultValue: 'pendiente' },
    notas: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'Ordenes_Compra', timestamps: false });

export default OrdenesCompra;
