import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClienteSegmentos = sequelize.define('ClienteSegmentos', {
    id_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Clientes',
            key: 'id_cliente'
        }
    },
    id_segmento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Segmentos_Cliente',
            key: 'id_segmento'
        }
    },
    fecha_asignacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'Cliente_Segmentos',
    timestamps: false
});

export default ClienteSegmentos;
