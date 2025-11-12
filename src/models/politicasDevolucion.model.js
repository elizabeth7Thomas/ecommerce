import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Politicas_Devolucion = sequelize.define('Politicas_Devolucion', {
    id_politica: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_politica: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    dias_devolucion: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    productos_permitidos: {
        type: DataTypes.JSON
    },
    condiciones_aceptacion: {
        type: DataTypes.TEXT
    },
    metodo_reembolso_default: {
        type: DataTypes.STRING(50)
    },
    costo_envio_cliente: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Politicas_Devolucion',
    timestamps: false
});

export default Politicas_Devolucion;
