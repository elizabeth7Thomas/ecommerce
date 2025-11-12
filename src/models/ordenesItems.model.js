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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    // 1. Definimos la columna para que Sequelize sepa que existe para leerla.
    //    Sequelize es lo suficientemente inteligente como para no incluirla en inserts/updates
    //    si no se le asigna un valor explícitamente.
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        // No necesita 'allowNull' ya que la BD siempre la generará.
    },
}, {
    // 3. Corregir el nombre de la tabla para que coincida exactamente
    tableName: 'ordenes_items',
    timestamps: false,
});

// 2. Eliminar el hook por completo. La base de datos se encargará del cálculo.
// OrdenItem.addHook('beforeValidate', (item) => { ... });

export default OrdenItem;