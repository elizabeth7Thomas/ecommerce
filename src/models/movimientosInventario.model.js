import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MovimientosInventario = sequelize.define('MovimientosInventario', {
    id_movimiento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_inventario: { type: DataTypes.INTEGER, allowNull: false },
    tipo_movimiento: { type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_anterior: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_nueva: { type: DataTypes.INTEGER, allowNull: false },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    id_orden: { type: DataTypes.INTEGER, allowNull: true },
    motivo: { type: DataTypes.TEXT, allowNull: true },
    referencia: { type: DataTypes.STRING(100), allowNull: true },
    fecha_movimiento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'Movimientos_Inventario', timestamps: false });

export default MovimientosInventario;
