import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InteraccionesCliente = sequelize.define('InteraccionesCliente', {
    id_interaccion: {
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
    tipo_interaccion: {
        type: DataTypes.ENUM('llamada', 'email', 'chat', 'reunion', 'nota', 'reclamo', 'consulta'),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    resultado: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    fecha_interaccion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    proxima_accion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_proxima_accion: {
        type: DataTypes.DATEONLY, // Usar DATEONLY para columnas DATE
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'completado', 'cancelado'),
        defaultValue: 'pendiente',
        allowNull: false
    }
}, {
    tableName: 'interacciones_cliente',
    
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
});

export default InteraccionesCliente;