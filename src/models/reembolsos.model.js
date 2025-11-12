import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Reembolsos = sequelize.define('Reembolsos', {
    id_reembolso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_devolucion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Devoluciones',
            key: 'id_devolucion'
        }
    },
    id_metodo_pago: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Metodos_Pago',
            key: 'id_metodo_pago'
        }
    },
    monto_reembolso: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0.01 }
    },
    moneda: {
        type: DataTypes.STRING(3),
        defaultValue: 'GTQ'
    },
    estado_reembolso: {
        type: DataTypes.ENUM('pendiente', 'procesando', 'completado', 'fallido', 'revertido'),
        defaultValue: 'pendiente'
    },
    fecha_solicitud_reembolso: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_procesamiento: {
        type: DataTypes.DATE
    },
    fecha_completado: {
        type: DataTypes.DATE
    },
    transaccion_reembolso_id: {
        type: DataTypes.STRING(255)
    },
    motivo_fallo: {
        type: DataTypes.TEXT
    },
    id_usuario_aprobo_reembolso: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    },
    notas_reembolso: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Reembolsos',
    timestamps: false
});

export default Reembolsos;
