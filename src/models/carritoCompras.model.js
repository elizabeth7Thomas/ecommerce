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
        // La tabla usa VARCHAR(20), así que especificar la longitud es buena práctica.
        type: DataTypes.STRING(20),
        defaultValue: 'activo',
        allowNull: false // En la tabla el CHECK no permite nulos implícitamente
    },
}, {
    // 1. Ajustar el nombre de la tabla para que coincida exactamente
    tableName: 'carrito_compras',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
});

export default CarritoCompras;