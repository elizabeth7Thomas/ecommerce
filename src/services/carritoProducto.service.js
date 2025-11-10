// Servicio para gestionar productos en carrito
import CarritoProducto from '../models/carritoProducto.model.js';

class CarritoProductoService {
  // CREATE - Agregar producto al carrito
  async agregarProducto(carritoProductoData) {
    try {
      // Verificar si el producto ya existe en el carrito
      const existe = await CarritoProducto.findOne({
        where: {
          id_carrito: carritoProductoData.id_carrito,
          id_producto: carritoProductoData.id_producto
        }
      });

      if (existe) {
        // Si ya existe, actualizar la cantidad
        return await this.actualizarCantidad(
          existe.id_carrito_producto,
          existe.cantidad + carritoProductoData.cantidad
        );
      }

      const carritoProducto = await CarritoProducto.create(carritoProductoData);
      return carritoProducto;
    } catch (error) {
      throw new Error(`Error al agregar producto al carrito: ${error.message}`);
    }
  }

  // READ - Obtener producto del carrito por ID
  async getProductoCarritoById(idCarritoProducto) {
    try {
      const carritoProducto = await CarritoProducto.findByPk(idCarritoProducto);
      if (!carritoProducto) {
        throw new Error('Producto en carrito no encontrado');
      }
      return carritoProducto;
    } catch (error) {
      throw new Error(`Error al obtener producto del carrito: ${error.message}`);
    }
  }

  // READ - Obtener todos los productos de un carrito
  async getProductosByCarrito(idCarrito) {
    try {
      const productos = await CarritoProducto.findAll({
        where: { id_carrito: idCarrito },
        order: [['fecha_agregado', 'DESC']]
      });
      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos del carrito: ${error.message}`);
    }
  }

  // READ - Obtener producto específico en carrito
  async getProductoEnCarrito(idCarrito, idProducto) {
    try {
      const carritoProducto = await CarritoProducto.findOne({
        where: {
          id_carrito: idCarrito,
          id_producto: idProducto
        }
      });
      
      if (!carritoProducto) {
        throw new Error('Producto no encontrado en el carrito');
      }
      
      return carritoProducto;
    } catch (error) {
      throw new Error(`Error al obtener producto en carrito: ${error.message}`);
    }
  }

  // READ - Obtener resumen del carrito
  async getResumenCarrito(idCarrito) {
    try {
      const productos = await this.getProductosByCarrito(idCarrito);
      
      const totalProductos = productos.reduce((sum, item) => sum + item.cantidad, 0);
      const subtotal = productos.reduce((sum, item) => {
        return sum + (item.cantidad * parseFloat(item.precio_unitario));
      }, 0);

      return {
        productos,
        totalProductos,
        subtotal,
        cantidadItems: productos.length
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen del carrito: ${error.message}`);
    }
  }

  // UPDATE - Actualizar cantidad de producto en carrito
  async actualizarCantidad(idCarritoProducto, nuevaCantidad) {
    try {
      if (nuevaCantidad < 1) {
        // Si la cantidad es menor a 1, eliminar el producto
        return await this.eliminarProducto(idCarritoProducto);
      }

      const [updated] = await CarritoProducto.update(
        { cantidad: nuevaCantidad },
        { where: { id_carrito_producto: idCarritoProducto } }
      );

      if (updated === 0) {
        throw new Error('Producto en carrito no encontrado');
      }

      return await this.getProductoCarritoById(idCarritoProducto);
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Actualizar precio unitario
  async actualizarPrecio(idCarritoProducto, nuevoPrecio) {
    try {
      const [updated] = await CarritoProducto.update(
        { precio_unitario: nuevoPrecio },
        { where: { id_carrito_producto: idCarritoProducto } }
      );

      if (updated === 0) {
        throw new Error('Producto en carrito no encontrado');
      }

      return await this.getProductoCarritoById(idCarritoProducto);
    } catch (error) {
      throw new Error(`Error al actualizar precio: ${error.message}`);
    }
  }

  // UPDATE - Actualizar producto completo
  async updateCarritoProducto(idCarritoProducto, updateData) {
    try {
      const [updated] = await CarritoProducto.update(updateData, {
        where: { id_carrito_producto: idCarritoProducto }
      });

      if (updated === 0) {
        throw new Error('Producto en carrito no encontrado');
      }

      return await this.getProductoCarritoById(idCarritoProducto);
    } catch (error) {
      throw new Error(`Error al actualizar producto en carrito: ${error.message}`);
    }
  }

  // DELETE - Eliminar producto del carrito
  async eliminarProducto(idCarritoProducto) {
    try {
      const deleted = await CarritoProducto.destroy({
        where: { id_carrito_producto: idCarritoProducto }
      });

      if (deleted === 0) {
        throw new Error('Producto en carrito no encontrado');
      }

      return { message: 'Producto eliminado del carrito exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar producto del carrito: ${error.message}`);
    }
  }

  // DELETE - Eliminar producto específico por carrito y producto
  async eliminarProductoEspecifico(idCarrito, idProducto) {
    try {
      const deleted = await CarritoProducto.destroy({
        where: {
          id_carrito: idCarrito,
          id_producto: idProducto
        }
      });

      if (deleted === 0) {
        throw new Error('Producto no encontrado en el carrito');
      }

      return { message: 'Producto eliminado del carrito exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar producto específico del carrito: ${error.message}`);
    }
  }

  // DELETE - Vaciar carrito completo
  async vaciarCarrito(idCarrito) {
    try {
      const deleted = await CarritoProducto.destroy({
        where: { id_carrito: idCarrito }
      });

      return { 
        message: `Carrito vaciado exitosamente`,
        productosEliminados: deleted
      };
    } catch (error) {
      throw new Error(`Error al vaciar carrito: ${error.message}`);
    }
  }

  // Métodos de validación y utilidad
  async verificarProductoEnCarrito(idCarrito, idProducto) {
    try {
      const existe = await CarritoProducto.findOne({
        where: {
          id_carrito: idCarrito,
          id_producto: idProducto
        }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar producto en carrito: ${error.message}`);
    }
  }

  // Obtener estadísticas del carrito
  async getEstadisticasCarrito(idCarrito) {
    try {
      const productos = await this.getProductosByCarrito(idCarrito);
      
      if (productos.length === 0) {
        return {
          totalProductos: 0,
          subtotal: 0,
          productoMasCaro: null,
          productoMasBarato: null,
          productoMayorCantidad: null
        };
      }

      const subtotal = productos.reduce((sum, item) => {
        return sum + (item.cantidad * parseFloat(item.precio_unitario));
      }, 0);

      const productoMasCaro = productos.reduce((max, item) => 
        parseFloat(item.precio_unitario) > parseFloat(max.precio_unitario) ? item : max
      );

      const productoMasBarato = productos.reduce((min, item) => 
        parseFloat(item.precio_unitario) < parseFloat(min.precio_unitario) ? item : min
      );

      const productoMayorCantidad = productos.reduce((max, item) => 
        item.cantidad > max.cantidad ? item : max
      );

      return {
        totalProductos: productos.reduce((sum, item) => sum + item.cantidad, 0),
        subtotal,
        cantidadItems: productos.length,
        productoMasCaro: {
          id_producto: productoMasCaro.id_producto,
          precio_unitario: productoMasCaro.precio_unitario
        },
        productoMasBarato: {
          id_producto: productoMasBarato.id_producto,
          precio_unitario: productoMasBarato.precio_unitario
        },
        productoMayorCantidad: {
          id_producto: productoMayorCantidad.id_producto,
          cantidad: productoMayorCantidad.cantidad
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del carrito: ${error.message}`);
    }
  }
}

export default new CarritoProductoService();