import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AlertasInventario = sequelize.define('AlertasInventario', {
    id_alerta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_inventario: { type: DataTypes.INTEGER, allowNull: false },
    tipo_alerta: { type: DataTypes.ENUM('stock_bajo', 'stock_agotado', 'stock_excedido', 'producto_vencido'), allowNull: false },
    mensaje: { type: DataTypes.TEXT, allowNull: false },
    fecha_alerta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resuelta: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_resolucion: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'alertas_inventario', timestamps: false });

export default AlertasInventario;
