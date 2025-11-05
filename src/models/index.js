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

// Associations con opciones mejoradas
const setupAssociations = () => {
  // Rol -> Usuario (1:N)
  Rol.hasMany(Usuario, { 
    foreignKey: 'id_rol',
    as: 'usuarios',
    onDelete: 'RESTRICT' // No eliminar rol si tiene usuarios
  });
  Usuario.belongsTo(Rol, { 
    foreignKey: 'id_rol',
    as: 'rol'
  });

  // Usuario <-> Cliente (1:1)
  Usuario.hasOne(Cliente, { 
    foreignKey: 'id_usuario',
    as: 'cliente',
    onDelete: 'CASCADE'
  });
  Cliente.belongsTo(Usuario, { 
    foreignKey: 'id_usuario',
    as: 'usuario'
  });

  // Cliente -> Direcciones (1:N)
  Cliente.hasMany(Direccion, { 
    foreignKey: 'id_cliente',
    as: 'direcciones',
    onDelete: 'CASCADE'
  });
  Direccion.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // CategoriaProducto -> Producto (1:N)
  CategoriaProducto.hasMany(Producto, { 
    foreignKey: 'id_categoria',
    as: 'productos',
    onDelete: 'RESTRICT'
  });
  Producto.belongsTo(CategoriaProducto, { 
    foreignKey: 'id_categoria',
    as: 'categoria'
  });

  // Producto -> Imagenes (1:N)
  Producto.hasMany(ProductoImagen, { 
    foreignKey: 'id_producto',
    as: 'imagenes',
    onDelete: 'CASCADE'
  });
  ProductoImagen.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Cliente -> CarritoCompras (1:N) - Un cliente puede tener múltiples carritos (histórico)
  Cliente.hasMany(CarritoCompras, { 
    foreignKey: 'id_cliente',
    as: 'carritos',
    onDelete: 'CASCADE'
  });
  CarritoCompras.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // CarritoCompras -> CarritoProductos (1:N)
  CarritoCompras.hasMany(CarritoProducto, { 
    foreignKey: 'id_carrito',
    as: 'productosCarrito',
    onDelete: 'CASCADE'
  });
  CarritoProducto.belongsTo(CarritoCompras, { 
    foreignKey: 'id_carrito',
    as: 'carrito'
  });

  // Producto -> CarritoProducto
  Producto.hasMany(CarritoProducto, { 
    foreignKey: 'id_producto',
    as: 'enCarritos'
  });
  CarritoProducto.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Cliente -> Orden (1:N)
  Cliente.hasMany(Orden, { 
    foreignKey: 'id_cliente',
    as: 'ordenes',
    onDelete: 'RESTRICT' // No eliminar si tiene órdenes
  });
  Orden.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // Direccion -> Orden (direccion de envio)
  Direccion.hasMany(Orden, { 
    foreignKey: 'id_direccion_envio',
    as: 'ordenesEnvio'
  });
  Orden.belongsTo(Direccion, { 
    foreignKey: 'id_direccion_envio',
    as: 'direccionEnvio'
  });

  // Orden -> OrdenItems (1:N)
  Orden.hasMany(OrdenItem, { 
    foreignKey: 'id_orden',
    as: 'items',
    onDelete: 'CASCADE'
  });
  OrdenItem.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });

  // Producto -> OrdenItem
  Producto.hasMany(OrdenItem, { 
    foreignKey: 'id_producto',
    as: 'enOrdenes'
  });
  OrdenItem.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Orden -> Payments (1:N)
  Orden.hasMany(Payment, { 
    foreignKey: 'id_orden',
    as: 'pagos',
    onDelete: 'RESTRICT'
  });
  Payment.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });
};

// Ejecutar las asociaciones
setupAssociations();

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
    setupAssociations
};

export default {
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