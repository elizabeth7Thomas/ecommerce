import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CampanaClientes = sequelize.define('CampanaClientes', {
    // 1. Añadir la verdadera llave primaria
    id_campana_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // 2. Estos campos ya NO son parte de la llave primaria
    id_campana: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_envio: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estado_envio: {
        type: DataTypes.ENUM('pendiente', 'enviado', 'abierto', 'respondido', 'fallido'),
        defaultValue: 'pendiente',
        allowNull: false
    },
    fecha_apertura: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'campana_clientes',
    timestamps: false,
    // 3. Definir el índice único
    indexes: [
        {
            unique: true,
            fields: ['id_campana', 'id_cliente']
        }
    ]
});

export default CampanaClientes;