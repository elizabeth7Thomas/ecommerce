import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Almacenes = sequelize.define('Almacenes', {
    id_almacen: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_almacen: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    direccion: { type: DataTypes.TEXT, allowNull: true },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    responsable: { type: DataTypes.STRING(100), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'almacenes', timestamps: false });

export default Almacenes;
