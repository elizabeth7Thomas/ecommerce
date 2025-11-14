import { Orden, Cliente, Direccion, OrdenItem, Producto, OrdenEstado, OrdenEstadoHistorial, Usuario } from '../index.js';

const setupOrderAssociations = () => {
  console.log('🔗 Configurando asociaciones de órdenes...');

  // Cliente -> Orden (1:N)
  Cliente.hasMany(Orden, { 
    foreignKey: 'id_cliente',
    as: 'ordenes',
    onDelete: 'RESTRICT'
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

  // Orden -> OrdenEstado
  Orden.belongsTo(OrdenEstado, {
    foreignKey: 'id_estado_orden',
    as: 'estadoOrden'
  });
  
  OrdenEstado.hasMany(Orden, {
    foreignKey: 'id_estado_orden',
    as: 'ordenes'
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

  // OrdenEstadoHistorial -> OrdenEstado (estado anterior)
  OrdenEstadoHistorial.belongsTo(OrdenEstado, {
    foreignKey: 'id_estado_anterior',
    as: 'estadoAnterior'
  });
  
  OrdenEstado.hasMany(OrdenEstadoHistorial, {
    foreignKey: 'id_estado_anterior',
    as: 'historialesComoAnterior'
  });

  // OrdenEstadoHistorial -> OrdenEstado (estado nuevo)
  OrdenEstadoHistorial.belongsTo(OrdenEstado, {
    foreignKey: 'id_estado_nuevo',
    as: 'estadoNuevo'
  });
  
  OrdenEstado.hasMany(OrdenEstadoHistorial, {
    foreignKey: 'id_estado_nuevo',
    as: 'historialesComoNuevo'
  });

  // OrdenEstadoHistorial -> Usuario
  OrdenEstadoHistorial.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario'
  });
  
  Usuario.hasMany(OrdenEstadoHistorial, {
    foreignKey: 'id_usuario',
    as: 'cambiosEstado'
  });
};

export default setupOrderAssociations;