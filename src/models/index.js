import sequelize from '../config/database.js';
import Rol from './rol.model.js';
import Usuario from './user.model.js';
import Cliente from './cliente.model.js';
import Direccion from './direccion.model.js';
import CategoriaProducto from './categoriaProducto.model.js';
import Producto from './producto.model.js';
import ProductoImagen from './productoImagenes.model.js';
import CarritoCompras from './carritoCompras.model.js';
import CarritoProducto from './carritoProducto.model.js';
import Orden from './ordenes.model.js';
import OrdenItem from './ordenesItems.model.js';
import Payment from './payments.model.js';

// Associations
// Rol -> Usuario (1:N)
Rol.hasMany(Usuario, { foreignKey: 'id_rol', sourceKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', targetKey: 'id_rol' });

// Usuario <-> Cliente (1:1)
Usuario.hasOne(Cliente, { foreignKey: 'id_usuario', sourceKey: 'id_usuario' });
Cliente.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

// Cliente -> Direcciones (1:N)
Cliente.hasMany(Direccion, { foreignKey: 'id_cliente', sourceKey: 'id_cliente' });
Direccion.belongsTo(Cliente, { foreignKey: 'id_cliente', targetKey: 'id_cliente' });

// CategoriaProducto -> Producto (1:N)
CategoriaProducto.hasMany(Producto, { foreignKey: 'id_categoria', sourceKey: 'id_categoria' });
Producto.belongsTo(CategoriaProducto, { foreignKey: 'id_categoria', targetKey: 'id_categoria' });

// Producto -> Imagenes (1:N)
Producto.hasMany(ProductoImagen, { foreignKey: 'id_producto', sourceKey: 'id_producto' });
ProductoImagen.belongsTo(Producto, { foreignKey: 'id_producto', targetKey: 'id_producto' });

// Cliente -> CarritoCompras (1:N)
Cliente.hasMany(CarritoCompras, { foreignKey: 'id_cliente', sourceKey: 'id_cliente' });
CarritoCompras.belongsTo(Cliente, { foreignKey: 'id_cliente', targetKey: 'id_cliente' });

// CarritoCompras -> CarritoProductos (1:N)
CarritoCompras.hasMany(CarritoProducto, { foreignKey: 'id_carrito', sourceKey: 'id_carrito' });
CarritoProducto.belongsTo(CarritoCompras, { foreignKey: 'id_carrito', targetKey: 'id_carrito' });

// CarritoProducto -> Producto
Producto.hasMany(CarritoProducto, { foreignKey: 'id_producto', sourceKey: 'id_producto' });
CarritoProducto.belongsTo(Producto, { foreignKey: 'id_producto', targetKey: 'id_producto' });

// Cliente -> Orden (1:N)
Cliente.hasMany(Orden, { foreignKey: 'id_cliente', sourceKey: 'id_cliente' });
Orden.belongsTo(Cliente, { foreignKey: 'id_cliente', targetKey: 'id_cliente' });

// Orden -> Direccion (direccion de envio)
Direccion.hasMany(Orden, { foreignKey: 'id_direccion_envio', sourceKey: 'id_direccion' });
Orden.belongsTo(Direccion, { foreignKey: 'id_direccion_envio', targetKey: 'id_direccion' });

// Orden -> OrdenItems (1:N)
Orden.hasMany(OrdenItem, { foreignKey: 'id_orden', sourceKey: 'id_orden' });
OrdenItem.belongsTo(Orden, { foreignKey: 'id_orden', targetKey: 'id_orden' });

// OrdenItem -> Producto
Producto.hasMany(OrdenItem, { foreignKey: 'id_producto', sourceKey: 'id_producto' });
OrdenItem.belongsTo(Producto, { foreignKey: 'id_producto', targetKey: 'id_producto' });

// Orden -> Payments (1:N)
Orden.hasMany(Payment, { foreignKey: 'id_orden', sourceKey: 'id_orden' });
Payment.belongsTo(Orden, { foreignKey: 'id_orden', targetKey: 'id_orden' });

export {
    sequelize,
    Rol,
    Usuario,
    Cliente,
    Direccion,
    CategoriaProducto,
    Producto,
    ProductoImagen,
    CarritoCompras,
    CarritoProducto,
    Orden,
    OrdenItem,
    Payment,
};

export default {
    sequelize,
};
