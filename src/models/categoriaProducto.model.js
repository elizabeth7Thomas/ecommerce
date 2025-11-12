import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CategoriaProducto = sequelize.define('CategoriaProducto', {
    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre_categoria: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    descripcion: {
        type: DataTypes.TEXT,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    
    tableName: 'categoria_producto',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
});

export default CategoriaProducto;