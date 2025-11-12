import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Inventario = sequelize.define('Inventario', {
    id_inventario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_producto: { type: DataTypes.INTEGER, allowNull: false },
    id_almacen: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    cantidad_minima: { type: DataTypes.INTEGER, defaultValue: 10 },
    cantidad_maxima: { type: DataTypes.INTEGER, defaultValue: 1000 },
    ubicacion_fisica: { type: DataTypes.STRING(50), allowNull: true },
    fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'Inventario',
    timestamps: true,
    createdAt: false, // O 'fecha_creacion' si la tienes
    updatedAt: 'fecha_actualizacion'
});
export default Inventario;
