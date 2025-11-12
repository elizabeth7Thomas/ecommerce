import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Devoluciones = sequelize.define('Devoluciones', {
    id_devolucion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Ordenes',
            key: 'id_orden'
        }
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Clientes',
            key: 'id_cliente'
        }
    },
    numero_devolucion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    fecha_solicitud: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_aprobo_cliente: {
        type: DataTypes.DATE
    },
    fecha_aprobacion: {
        type: DataTypes.DATE
    },
    fecha_rechazo: {
        type: DataTypes.DATE
    },
    fecha_completada: {
        type: DataTypes.DATE
    },
    estado: {
        type: DataTypes.ENUM('solicitada', 'aprobada', 'rechazada', 'en_proceso', 'completada', 'cancelada'),
        defaultValue: 'solicitada'
    },
    tipo_devolucion: {
        type: DataTypes.ENUM('devolucion_total', 'devolucion_parcial', 'cambio_producto'),
        allowNull: false
    },
    motivo: {
        type: DataTypes.ENUM('producto_danado', 'producto_incorrecto', 'no_cumple_esperanzas', 'talla_incorrecta', 'color_incorrecto', 'arrepentimiento', 'otro'),
        allowNull: false
    },
    motivo_detalle: {
        type: DataTypes.TEXT
    },
    metodo_reembolso: {
        type: DataTypes.ENUM('original', 'credito_tienda', 'transferencia', 'efectivo')
    },
    monto_total_devolucion: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    monto_aprobado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    costo_envio_devolucion: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    quien_cubre_envio: {
        type: DataTypes.ENUM('cliente', 'empresa'),
        defaultValue: 'cliente'
    },
    guia_devolucion: {
        type: DataTypes.STRING(100)
    },
    transportista_devolucion: {
        type: DataTypes.STRING(50)
    },
    notas_internas: {
        type: DataTypes.TEXT
    },
    notas_cliente: {
        type: DataTypes.TEXT
    },
    evidencia_imagenes: {
        type: DataTypes.JSON
    },
    id_usuario_aprobo: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Usuarios',
            key: 'id_usuario'
        }
    }
}, {
    tableName: 'Devoluciones',
    timestamps: false
});

export default Devoluciones;
