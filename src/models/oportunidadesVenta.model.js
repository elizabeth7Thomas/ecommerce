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
        references: {
            model: 'Clientes',
            key: 'id_cliente'
        }
    },
    id_usuario_asignado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
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
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    fecha_cierre_estimada: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_cierre_real: {
        type: DataTypes.DATE,
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
    tableName: 'Oportunidades_Venta',
    timestamps: false
});

export default OportunidadesVenta;
