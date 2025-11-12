import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cliente = sequelize.define('Cliente', {
    id_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuario', // Asume que el modelo se llamará 'Usuario'
            key: 'id_usuario'
        }
    },
    nombre: {
        type: DataTypes.STRING(100),
    },
    apellido: {
        type: DataTypes.STRING(100),
    },
    telefono: {
        type: DataTypes.STRING(20),
    },
}, {
    // 1. Ajustar el nombre de la tabla
    tableName: 'clientes',
    timestamps: false,
});

export default Cliente;