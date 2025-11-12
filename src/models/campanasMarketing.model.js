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
        allowNull: false
        // El defaultValue es opcional, puedes mantenerlo si lo deseas a nivel de app
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para campos DATE de SQL sin hora
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para campos DATE de SQL sin hora
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
    }

}, {
    tableName: 'campanas_marketing',
    
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
});

export default CampanasMarketing;