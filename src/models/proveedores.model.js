import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Proveedores = sequelize.define('Proveedores', {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_proveedor: { type: DataTypes.STRING(255), allowNull: false },
    contacto: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    direccion: { type: DataTypes.TEXT, allowNull: true },
    nit: { type: DataTypes.STRING(20), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'Proveedores', timestamps: false });

export default Proveedores;
