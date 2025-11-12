import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OportunidadesVenta = sequelize.define('OportunidadesVenta', {
    id_oportunidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Clientes', key: 'id_cliente' }
    },
    id_usuario_asignado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    valor_estimado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 }
    },
    probabilidad_cierre: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 }
    },
    etapa: {
        type: DataTypes.ENUM('prospecto', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'),
        defaultValue: 'prospecto',
        allowNull: false
    },
    // No definimos fecha_creacion ni fecha_actualizacion aquí
    fecha_cierre_estimada: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para columnas DATE
        allowNull: true
    },
    fecha_cierre_real: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para columnas DATE
        allowNull: true
    },
    motivo_perdida: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('activo', 'cerrado', 'cancelado'),
        defaultValue: 'activo',
        allowNull: false
    }
}, {
    tableName: 'oportunidades_venta',
    // 1. Habilitar y mapear timestamps
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
});

export default OportunidadesVenta;