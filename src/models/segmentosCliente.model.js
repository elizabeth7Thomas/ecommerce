import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SegmentosCliente = sequelize.define('SegmentosCliente', {
    id_segmento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_segmento: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    criterios: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'Segmentos_Cliente',
    timestamps: false
});

export default SegmentosCliente;
