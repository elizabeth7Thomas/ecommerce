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
    tableName: 'clientes',
    timestamps: false,
});

export default Cliente;
