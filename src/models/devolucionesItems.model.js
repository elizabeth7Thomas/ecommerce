import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Devoluciones_Items = sequelize.define('Devoluciones_Items', {
    id_devolucion_item: {
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
    id_orden_item: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Ordenes_Items',
            key: 'id_orden_item'
        }
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Producto',
            key: 'id_producto'
        }
    },
    cantidad_solicitada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
    },
    cantidad_aprobada: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 }
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    motivo_item: {
        type: DataTypes.STRING(100)
    },
    estado_item: {
        type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado', 'recibido', 'inspeccionado', 'reembolsado'),
        defaultValue: 'pendiente'
    },
    condicion_producto: {
        type: DataTypes.ENUM('nuevo', 'como_nuevo', 'usado', 'danado', 'defectuoso')
    },
    accion_tomar: {
        type: DataTypes.ENUM('reembolsar', 'reponer', 'credito', 'reparar', 'desechar')
    },
    fecha_recibido: {
        type: DataTypes.DATE
    },
    fecha_inspeccion: {
        type: DataTypes.DATE
    },
    notas_inspeccion: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Devoluciones_Items',
    timestamps: false
});

export default Devoluciones_Items;
