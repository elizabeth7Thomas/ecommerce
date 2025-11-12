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
import OrdenEstado from './ordenEstado.model.js';
import OrdenEstadoHistorial from './ordenEstadoHistorial.model.js';
import MetodoPago from './metodoPago.model.js';
import MetodoPagoCliente from './metodoPagoCliente.model.js';
// CRM Models
import InteraccionesCliente from './interaccionesCliente.model.js';
import OportunidadesVenta from './oportunidadesVenta.model.js';
import TareasCRM from './tareasCRM.model.js';
import SegmentosCliente from './segmentosCliente.model.js';
import ClienteSegmentos from './clienteSegmentos.model.js';
import CampanasMarketing from './campanasMarketing.model.js';
import CampanaClientes from './campanaClientes.model.js';

// Inventory Models
import Almacenes from './almacenes.model.js';
import Inventario from './inventario.model.js';
import MovimientosInventario from './movimientosInventario.model.js';
import Proveedores from './proveedores.model.js';
import OrdenesCompra from './ordenesCompra.model.js';
import OrdenesCompraDetalle from './ordenesCompraDetalle.model.js';
import AlertasInventario from './alertasInventario.model.js';

// Cotizaciones Models
import Cotizaciones from './cotizaciones.model.js';
import Cotizaciones_Items from './cotizacionesItems.model.js';
import Cotizaciones_Ordenes from './cotizacionesOrdenes.model.js';

// Devoluciones y Reembolsos Models
import Devoluciones from './devoluciones.model.js';
import Devoluciones_Items from './devolucionesItems.model.js';
import Reembolsos from './reembolsos.model.js';
import Politicas_Devolucion from './politicasDevolucion.model.js';

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

  // ==========================================
  // RELACIONES DE ESTADOS DE ORDEN
  // ==========================================

  // OrdenEstado -> Orden (1:N)
  OrdenEstado.hasMany(Orden, { 
    foreignKey: 'id_estado_orden',
    as: 'ordenes'
  });
  Orden.belongsTo(OrdenEstado, { 
    foreignKey: 'id_estado_orden',
    as: 'estadoActual'
  });

  // Orden -> OrdenEstadoHistorial (1:N)
  Orden.hasMany(OrdenEstadoHistorial, { 
    foreignKey: 'id_orden',
    as: 'historialEstados',
    onDelete: 'CASCADE'
  });
  OrdenEstadoHistorial.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });

  // OrdenEstado -> OrdenEstadoHistorial (estado nuevo)
  OrdenEstado.hasMany(OrdenEstadoHistorial, { 
    foreignKey: 'id_estado_nuevo',
    as: 'historialesNuevo'
  });
  OrdenEstadoHistorial.belongsTo(OrdenEstado, { 
    foreignKey: 'id_estado_nuevo',
    as: 'estadoNuevo'
  });

  // OrdenEstado -> OrdenEstadoHistorial (estado anterior)
  OrdenEstado.hasMany(OrdenEstadoHistorial, { 
    foreignKey: 'id_estado_anterior',
    as: 'historialesAnterior'
  });
  OrdenEstadoHistorial.belongsTo(OrdenEstado, { 
    foreignKey: 'id_estado_anterior',
    as: 'estadoAnterior'
  });

  // Usuario -> OrdenEstadoHistorial (quién hizo el cambio)
  Usuario.hasMany(OrdenEstadoHistorial, { 
    foreignKey: 'id_usuario',
    as: 'cambiosEstadoOrdenes',
    onDelete: 'SET NULL'
  });
  OrdenEstadoHistorial.belongsTo(Usuario, { 
    foreignKey: 'id_usuario',
    as: 'usuarioQueHizoCambio'
  });

  // ==========================================
  // RELACIONES DE MÉTODOS DE PAGO
  // ==========================================

  // MetodoPago -> Payment (1:N)
  MetodoPago.hasMany(Payment, { 
    foreignKey: 'id_metodo_pago',
    as: 'pagos'
  });
  Payment.belongsTo(MetodoPago, { 
    foreignKey: 'id_metodo_pago',
    as: 'metodoPago'
  });

  // Cliente -> MetodoPagoCliente (1:N)
  Cliente.hasMany(MetodoPagoCliente, { 
    foreignKey: 'id_cliente',
    as: 'metodosPago',
    onDelete: 'CASCADE'
  });
  MetodoPagoCliente.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // MetodoPago -> MetodoPagoCliente (1:N)
  MetodoPago.hasMany(MetodoPagoCliente, { 
    foreignKey: 'id_metodo_pago',
    as: 'clientesConEsteMetodo'
  });
  MetodoPagoCliente.belongsTo(MetodoPago, { 
    foreignKey: 'id_metodo_pago',
    as: 'metodoPago'
  });

  // MetodoPagoCliente -> Payment (1:N)
  MetodoPagoCliente.hasMany(Payment, { 
    foreignKey: 'id_metodo_pago_cliente',
    as: 'pagos'
  });
  Payment.belongsTo(MetodoPagoCliente, { 
    foreignKey: 'id_metodo_pago_cliente',
    as: 'metodoPagoCliente'
  });

  // ==========================================
  // RELACIONES CRM
  // ==========================================

  // Cliente -> InteraccionesCliente (1:N)
  Cliente.hasMany(InteraccionesCliente, { 
    foreignKey: 'id_cliente',
    as: 'interacciones',
    onDelete: 'CASCADE'
  });
  InteraccionesCliente.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // Usuario -> InteraccionesCliente (1:N)
  Usuario.hasMany(InteraccionesCliente, { 
    foreignKey: 'id_usuario_asignado',
    as: 'interaccionesAsignadas',
    onDelete: 'SET NULL'
  });
  InteraccionesCliente.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_asignado',
    as: 'usuarioAsignado'
  });

  // Cliente -> OportunidadesVenta (1:N)
  Cliente.hasMany(OportunidadesVenta, { 
    foreignKey: 'id_cliente',
    as: 'oportunidades',
    onDelete: 'CASCADE'
  });
  OportunidadesVenta.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // Usuario -> OportunidadesVenta (1:N)
  Usuario.hasMany(OportunidadesVenta, { 
    foreignKey: 'id_usuario_asignado',
    as: 'oportunidadesAsignadas',
    onDelete: 'SET NULL'
  });
  OportunidadesVenta.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_asignado',
    as: 'usuarioAsignado'
  });

  // Cliente -> TareasCRM (1:N)
  Cliente.hasMany(TareasCRM, { 
    foreignKey: 'id_cliente',
    as: 'tareas',
    onDelete: 'CASCADE'
  });
  TareasCRM.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // OportunidadesVenta -> TareasCRM (1:N)
  OportunidadesVenta.hasMany(TareasCRM, { 
    foreignKey: 'id_oportunidad',
    as: 'tareas',
    onDelete: 'CASCADE'
  });
  TareasCRM.belongsTo(OportunidadesVenta, { 
    foreignKey: 'id_oportunidad',
    as: 'oportunidad'
  });

  // Usuario -> TareasCRM (1:N)
  Usuario.hasMany(TareasCRM, { 
    foreignKey: 'id_usuario_asignado',
    as: 'tareasAsignadas',
    onDelete: 'RESTRICT'
  });
  TareasCRM.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_asignado',
    as: 'usuarioAsignado'
  });

  // Cliente <-> SegmentosCliente (M:N)
  Cliente.belongsToMany(SegmentosCliente, {
    through: ClienteSegmentos,
    foreignKey: 'id_cliente',
    otherKey: 'id_segmento',
    as: 'segmentos'
  });
  SegmentosCliente.belongsToMany(Cliente, {
    through: ClienteSegmentos,
    foreignKey: 'id_segmento',
    otherKey: 'id_cliente',
    as: 'clientes'
  });

  // CampanasMarketing -> CampanaClientes (1:N)
  CampanasMarketing.hasMany(CampanaClientes, { 
    foreignKey: 'id_campana',
    as: 'clientesCampana',
    onDelete: 'CASCADE'
  });
  CampanaClientes.belongsTo(CampanasMarketing, { 
    foreignKey: 'id_campana',
    as: 'campana'
  });

  // Cliente -> CampanaClientes (1:N)
  Cliente.hasMany(CampanaClientes, { 
    foreignKey: 'id_cliente',
    as: 'campanasCliente',
    onDelete: 'CASCADE'
  });
  CampanaClientes.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // ==========================================
  // RELACIONES INVENTARIO
  // ==========================================

  // Almacenes -> Inventario (1:N)
  Almacenes.hasMany(Inventario, { 
    foreignKey: 'id_almacen',
    as: 'inventarios',
    onDelete: 'CASCADE'
  });
  Inventario.belongsTo(Almacenes, { 
    foreignKey: 'id_almacen',
    as: 'almacen'
  });

  // Producto -> Inventario (1:N)
  Producto.hasMany(Inventario, { 
    foreignKey: 'id_producto',
    as: 'inventarios',
    onDelete: 'CASCADE'
  });
  Inventario.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Inventario -> MovimientosInventario (1:N)
  Inventario.hasMany(MovimientosInventario, { 
    foreignKey: 'id_inventario',
    as: 'movimientos',
    onDelete: 'CASCADE'
  });
  MovimientosInventario.belongsTo(Inventario, { 
    foreignKey: 'id_inventario',
    as: 'inventario'
  });

  // Usuario -> MovimientosInventario (1:N)
  Usuario.hasMany(MovimientosInventario, { 
    foreignKey: 'id_usuario',
    as: 'movimientosInventario',
    onDelete: 'RESTRICT'
  });
  MovimientosInventario.belongsTo(Usuario, { 
    foreignKey: 'id_usuario',
    as: 'usuario'
  });

  // Orden -> MovimientosInventario (1:N)
  Orden.hasMany(MovimientosInventario, { 
    foreignKey: 'id_orden',
    as: 'movimientosInventario',
    onDelete: 'SET NULL'
  });
  MovimientosInventario.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });

  // Inventario -> AlertasInventario (1:N)
  Inventario.hasMany(AlertasInventario, { 
    foreignKey: 'id_inventario',
    as: 'alertas',
    onDelete: 'CASCADE'
  });
  AlertasInventario.belongsTo(Inventario, { 
    foreignKey: 'id_inventario',
    as: 'inventario'
  });

  // Proveedores -> OrdenesCompra (1:N)
  Proveedores.hasMany(OrdenesCompra, { 
    foreignKey: 'id_proveedor',
    as: 'ordenesCompra',
    onDelete: 'RESTRICT'
  });
  OrdenesCompra.belongsTo(Proveedores, { 
    foreignKey: 'id_proveedor',
    as: 'proveedor'
  });

  // Almacenes -> OrdenesCompra (1:N)
  Almacenes.hasMany(OrdenesCompra, { 
    foreignKey: 'id_almacen',
    as: 'ordenesCompra',
    onDelete: 'RESTRICT'
  });
  OrdenesCompra.belongsTo(Almacenes, { 
    foreignKey: 'id_almacen',
    as: 'almacen'
  });

  // Usuario -> OrdenesCompra (1:N)
  Usuario.hasMany(OrdenesCompra, { 
    foreignKey: 'id_usuario',
    as: 'ordenesCompra',
    onDelete: 'RESTRICT'
  });
  OrdenesCompra.belongsTo(Usuario, { 
    foreignKey: 'id_usuario',
    as: 'usuario'
  });

  // OrdenesCompra -> OrdenesCompraDetalle (1:N)
  OrdenesCompra.hasMany(OrdenesCompraDetalle, { 
    foreignKey: 'id_orden_compra',
    as: 'detalles',
    onDelete: 'CASCADE'
  });
  OrdenesCompraDetalle.belongsTo(OrdenesCompra, { 
    foreignKey: 'id_orden_compra',
    as: 'ordenCompra'
  });

  // Producto -> OrdenesCompraDetalle (1:N)
  Producto.hasMany(OrdenesCompraDetalle, { 
    foreignKey: 'id_producto',
    as: 'enlaceOrdenes',
    onDelete: 'RESTRICT'
  });
  OrdenesCompraDetalle.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // ==================== COTIZACIONES ====================

  // Cliente -> Cotizaciones (1:N)
  Cliente.hasMany(Cotizaciones, { 
    foreignKey: 'id_cliente',
    as: 'cotizaciones',
    onDelete: 'CASCADE'
  });
  Cotizaciones.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // Usuario -> Cotizaciones (creador)
  Usuario.hasMany(Cotizaciones, { 
    foreignKey: 'id_usuario_creador',
    as: 'cotizacionesCreadas',
    onDelete: 'RESTRICT'
  });
  Cotizaciones.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_creador',
    as: 'usuarioCreador'
  });

  // Cotizaciones -> Cotizaciones_Items (1:N)
  Cotizaciones.hasMany(Cotizaciones_Items, { 
    foreignKey: 'id_cotizacion',
    as: 'items',
    onDelete: 'CASCADE'
  });
  Cotizaciones_Items.belongsTo(Cotizaciones, { 
    foreignKey: 'id_cotizacion',
    as: 'cotizacion'
  });

  // Producto -> Cotizaciones_Items (1:N)
  Producto.hasMany(Cotizaciones_Items, { 
    foreignKey: 'id_producto',
    as: 'itemsCotizacion',
    onDelete: 'RESTRICT'
  });
  Cotizaciones_Items.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Cotizaciones -> Cotizaciones_Ordenes (1:1)
  Cotizaciones.hasOne(Cotizaciones_Ordenes, { 
    foreignKey: 'id_cotizacion',
    as: 'ordenConversion',
    onDelete: 'CASCADE'
  });
  Cotizaciones_Ordenes.belongsTo(Cotizaciones, { 
    foreignKey: 'id_cotizacion',
    as: 'cotizacion'
  });

  // Orden -> Cotizaciones_Ordenes (1:N)
  Orden.hasMany(Cotizaciones_Ordenes, { 
    foreignKey: 'id_orden',
    as: 'cotizacionesAsociadas',
    onDelete: 'CASCADE'
  });
  Cotizaciones_Ordenes.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });

  // ==================== DEVOLUCIONES ====================

  // Orden -> Devoluciones (1:N)
  Orden.hasMany(Devoluciones, { 
    foreignKey: 'id_orden',
    as: 'devoluciones',
    onDelete: 'CASCADE'
  });
  Devoluciones.belongsTo(Orden, { 
    foreignKey: 'id_orden',
    as: 'orden'
  });

  // Cliente -> Devoluciones (1:N)
  Cliente.hasMany(Devoluciones, { 
    foreignKey: 'id_cliente',
    as: 'devoluciones',
    onDelete: 'CASCADE'
  });
  Devoluciones.belongsTo(Cliente, { 
    foreignKey: 'id_cliente',
    as: 'cliente'
  });

  // Usuario -> Devoluciones (quien aprobó)
  Usuario.hasMany(Devoluciones, { 
    foreignKey: 'id_usuario_aprobo',
    as: 'devolucionesAprobadas',
    onDelete: 'SET NULL'
  });
  Devoluciones.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_aprobo',
    as: 'usuarioAprobo'
  });

  // Devoluciones -> Devoluciones_Items (1:N)
  Devoluciones.hasMany(Devoluciones_Items, { 
    foreignKey: 'id_devolucion',
    as: 'items',
    onDelete: 'CASCADE'
  });
  Devoluciones_Items.belongsTo(Devoluciones, { 
    foreignKey: 'id_devolucion',
    as: 'devolucion'
  });

  // Producto -> Devoluciones_Items (1:N)
  Producto.hasMany(Devoluciones_Items, { 
    foreignKey: 'id_producto',
    as: 'itemsDevolucion',
    onDelete: 'RESTRICT'
  });
  Devoluciones_Items.belongsTo(Producto, { 
    foreignKey: 'id_producto',
    as: 'producto'
  });

  // Devoluciones -> Reembolsos (1:N)
  Devoluciones.hasMany(Reembolsos, { 
    foreignKey: 'id_devolucion',
    as: 'reembolsos',
    onDelete: 'CASCADE'
  });
  Reembolsos.belongsTo(Devoluciones, { 
    foreignKey: 'id_devolucion',
    as: 'devolucion'
  });

  // Usuario -> Reembolsos (quien aprobó)
  Usuario.hasMany(Reembolsos, { 
    foreignKey: 'id_usuario_aprobo_reembolso',
    as: 'reembolsosAprobados',
    onDelete: 'SET NULL'
  });
  Reembolsos.belongsTo(Usuario, { 
    foreignKey: 'id_usuario_aprobo_reembolso',
    as: 'usuarioAprobo'
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
    OrdenEstado,
    OrdenEstadoHistorial,
    MetodoPago,
    MetodoPagoCliente,
    // CRM Models
    InteraccionesCliente,
    OportunidadesVenta,
    TareasCRM,
    SegmentosCliente,
    ClienteSegmentos,
    CampanasMarketing,
    CampanaClientes,
    // Inventory Models
    Almacenes,
    Inventario,
    MovimientosInventario,
    Proveedores,
    OrdenesCompra,
    OrdenesCompraDetalle,
    AlertasInventario,
    // Cotizaciones Models
    Cotizaciones,
    Cotizaciones_Items,
    Cotizaciones_Ordenes,
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
    OrdenEstado,
    OrdenEstadoHistorial,
    MetodoPago,
    MetodoPagoCliente,
    // CRM Models
    InteraccionesCliente,
    OportunidadesVenta,
    TareasCRM,
    SegmentosCliente,
    ClienteSegmentos,
    CampanasMarketing,
    CampanaClientes,
    // Inventory Models
    Almacenes,
    Inventario,
    MovimientosInventario,
    Proveedores,
    OrdenesCompra,
    OrdenesCompraDetalle,
    AlertasInventario,
    // Cotizaciones Models
    Cotizaciones,
    Cotizaciones_Items,
    Cotizaciones_Ordenes,
    // Devoluciones y Reembolsos Models
    Devoluciones,
    Devoluciones_Items,
    Reembolsos,
    Politicas_Devolucion,
};