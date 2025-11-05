import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrdenItem = sequelize.define('OrdenItem', {
    id_orden_item: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_orden: {
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
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: { min: 0 },
    },
    subtotal: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
    },
}, {
    tableName: 'Ordenes_Items',
    timestamps: false,
});

// Hook to compute subtotal before create/update
OrdenItem.addHook('beforeValidate', (item) => {
    if (item.cantidad != null && item.precio_unitario != null) {
        // Ensure decimal multiplication yields string/number consistent with DB
        const subtotal = (Number(item.cantidad) * Number(item.precio_unitario)).toFixed(2);
        item.subtotal = subtotal;
    }
});

export default OrdenItem;
