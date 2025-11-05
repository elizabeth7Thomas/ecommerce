import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductoImagen = sequelize.define('ProductoImagen', {
    id_imagen: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url_imagen: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    es_principal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'Producto_Imagenes',
    timestamps: false,
});

export default ProductoImagen;
