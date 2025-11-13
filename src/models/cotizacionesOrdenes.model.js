import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cotizaciones_Ordenes = sequelize.define('Cotizaciones_Ordenes', {
    id_cotizacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Cotizaciones',
            key: 'id_cotizacion'
        }
    },
    id_orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Ordenes',
            key: 'id_orden'
        }
    },
    fecha_conversion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'cotizaciones_ordenes',
    timestamps: false
});

export default Cotizaciones_Ordenes;
