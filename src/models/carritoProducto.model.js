import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CarritoProducto = sequelize.define('CarritoProducto', {
    id_carrito_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_carrito: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    fecha_agregado: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    
    tableName: 'carrito_productos',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['id_carrito', 'id_producto'] },
    ],
});

export default CarritoProducto;