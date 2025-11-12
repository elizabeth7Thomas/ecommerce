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
        type: DataTypes.JSONB, // 1. Usar JSONB para coincidir con la BD
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    // No definimos las fechas aquí
}, {
    tableName: 'segmentos_cliente',
    // 2. Habilitar y mapear timestamps para que Sequelize los gestione
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
});

export default SegmentosCliente;
