import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TareasCRM = sequelize.define('TareasCRM', {
    id_tarea: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Clientes',
            key: 'id_cliente'
        }
    },
    id_oportunidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Oportunidades_Venta',
            key: 'id_oportunidad'
        }
    },
    id_usuario_asignado: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    tipo_tarea: {
        type: DataTypes.ENUM('llamada', 'email', 'reunion', 'seguimiento', 'cotizacion', 'otro'),
        allowNull: false
    },
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
        defaultValue: 'media',
        allowNull: false
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_completado: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'completado', 'cancelado'),
        defaultValue: 'pendiente',
        allowNull: false
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'Tareas_CRM',
    timestamps: false
});

export default TareasCRM;
