import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Direccion = sequelize.define('Direccion', {
    id_direccion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    calle: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    ciudad: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    estado: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    codigo_postal: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    pais: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    es_principal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'Direcciones',
    timestamps: false,
});

export default Direccion;
