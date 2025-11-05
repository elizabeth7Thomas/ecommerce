import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CarritoCompras = sequelize.define('CarritoCompras', {
    id_carrito: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING(20),
        defaultValue: 'activo',
    },
}, {
    tableName: 'Carrito_Compras',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

export default CarritoCompras;
