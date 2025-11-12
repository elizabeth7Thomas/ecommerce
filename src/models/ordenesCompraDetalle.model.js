import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrdenesCompraDetalle = sequelize.define('OrdenesCompraDetalle', {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_orden_compra: { type: DataTypes.INTEGER, allowNull: false },
    id_producto: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_ordenada: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    cantidad_recibida: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, { tableName: 'ordenes_compra_detalle', timestamps: false });

export default OrdenesCompraDetalle;
