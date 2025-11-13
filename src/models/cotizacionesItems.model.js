import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cotizaciones_Items = sequelize.define('Cotizaciones_Items', {
    id_cotizacion_item: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_cotizacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Cotizaciones',
            key: 'id_cotizacion'
        }
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Producto',
            key: 'id_producto'
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    descuento_porcentaje: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    subtotal: {
        type: DataTypes.VIRTUAL,
        get() {
            const cantidad = this.getDataValue('cantidad');
            const precio = this.getDataValue('precio_unitario');
            const descuento = this.getDataValue('descuento_porcentaje') || 0;
            return cantidad * precio * (1 - descuento / 100);
        }
    }
}, {
    tableName: 'cotizaciones_items',
    timestamps: false
});

export default Cotizaciones_Items;
