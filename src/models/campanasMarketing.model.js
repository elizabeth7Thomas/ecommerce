import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CampanasMarketing = sequelize.define('CampanasMarketing', {
    id_campana: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_campana: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tipo_campana: {
        type: DataTypes.ENUM('email', 'sms', 'redes_sociales', 'telefonica', 'mixta'),
        allowNull: false,
        defaultValue: 'email'
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    presupuesto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    objetivo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('planificada', 'activa', 'pausada', 'completada', 'cancelada'),
        defaultValue: 'planificada',
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'Campanas_Marketing',
    timestamps: false
});

export default CampanasMarketing;
