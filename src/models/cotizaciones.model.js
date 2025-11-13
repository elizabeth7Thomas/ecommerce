import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cotizaciones = sequelize.define('Cotizaciones', {
    id_cotizacion: {
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
    id_usuario_creador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    numero_cotizacion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_expiracion: {
        type: DataTypes.DATEONLY
    },
    estado: {
        type: DataTypes.ENUM('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada'),
        defaultValue: 'borrador'
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    impuestos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    notas: {
        type: DataTypes.TEXT
    },
    terminos_condiciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'cotizaciones',
    timestamps: false
});

export default Cotizaciones;
