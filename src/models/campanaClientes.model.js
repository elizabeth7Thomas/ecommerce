import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CampanaClientes = sequelize.define('CampanaClientes', {
    id_campana: { type: DataTypes.INTEGER, primaryKey: true },
    id_cliente: { type: DataTypes.INTEGER, primaryKey: true },
    fecha_envio: { type: DataTypes.DATE, allowNull: true },
    estado_envio: { type: DataTypes.ENUM('pendiente', 'enviado', 'abierto', 'respondido', 'fallido'), defaultValue: 'pendiente', allowNull: false },
    fecha_apertura: { type: DataTypes.DATE, allowNull: true },
    fecha_respuesta: { type: DataTypes.DATE, allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'Campana_Clientes', timestamps: false });

export default CampanaClientes;
