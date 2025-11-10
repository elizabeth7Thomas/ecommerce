import { sequelize } from '../config/database.js';
import OrdenItem from '../models/ordenesItems.model.js';

class OrdenItemService {
  // CREATE - Crear nuevo item de orden
  async createOrdenItem(ordenItemData) {
    try {
      // Verificar si el producto ya existe en la orden
      const existe = await OrdenItem.findOne({
        where: {
          id_orden: ordenItemData.id_orden,
          id_producto: ordenItemData.id_producto
        }
      });

      if (existe) {
        // Si ya existe, actualizar la cantidad y recalcular
        return await this.actualizarCantidad(
          existe.id_orden_item,
          existe.cantidad + ordenItemData.cantidad
        );
      }

      const ordenItem = await OrdenItem.create(ordenItemData);
      return ordenItem;
    } catch (error) {
      throw new Error(`Error al crear item de orden: ${error.message}`);
    }
  }

  // CREATE - Crear múltiples items para una orden
  async createMultipleOrdenItems(idOrden, itemsData) {
    try {
      const itemsCreados = [];
      
      for (const itemData of itemsData) {
        const item = await this.createOrdenItem({
          ...itemData,
          id_orden: idOrden
        });
        itemsCreados.push(item);
      }

      return {
        message: `${itemsCreados.length} item(s) creado(s) exitosamente`,
        items: itemsCreados,
        totalItems: itemsCreados.length
      };
    } catch (error) {
      throw new Error(`Error al crear múltiples items: ${error.message}`);
    }
  }

  // READ - Obtener item por ID
  async getOrdenItemById(idOrdenItem) {
    try {
      const ordenItem = await OrdenItem.findByPk(idOrdenItem);
      if (!ordenItem) {
        throw new Error('Item de orden no encontrado');
      }
      return ordenItem;
    } catch (error) {
      throw new Error(`Error al obtener item de orden: ${error.message}`);
    }
  }

  // READ - Obtener todos los items de una orden
  async getItemsByOrden(idOrden) {
    try {
      const items = await OrdenItem.findAll({
        where: { id_orden: idOrden },
        order: [['id_orden_item', 'ASC']]
      });
      return items;
    } catch (error) {
      throw new Error(`Error al obtener items de la orden: ${error.message}`);
    }
  }

  // READ - Obtener item específico en orden
  async getItemByOrdenProducto(idOrden, idProducto) {
    try {
      const ordenItem = await OrdenItem.findOne({
        where: {
          id_orden: idOrden,
          id_producto: idProducto
        }
      });
      
      if (!ordenItem) {
        throw new Error('Item no encontrado en la orden');
      }
      
      return ordenItem;
    } catch (error) {
      throw new Error(`Error al obtener item específico: ${error.message}`);
    }
  }

  // READ - Obtener resumen de la orden
  async getResumenOrden(idOrden) {
    try {
      const items = await this.getItemsByOrden(idOrden);
      
      const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      return {
        items,
        totalItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        cantidadProductos: items.length
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen de la orden: ${error.message}`);
    }
  }

  // READ - Obtener órdenes que contienen un producto específico
  async getOrdenesByProducto(idProducto, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await OrdenItem.findAndCountAll({
        where: { id_producto: idProducto },
        limit: parseInt(limit),
        offset: offset,
        order: [['id_orden', 'DESC']]
      });

      return {
        items: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener órdenes por producto: ${error.message}`);
    }
  }

  // UPDATE - Actualizar cantidad de item
  async actualizarCantidad(idOrdenItem, nuevaCantidad) {
    try {
      if (nuevaCantidad < 1) {
        // Si la cantidad es menor a 1, eliminar el item
        return await this.deleteOrdenItem(idOrdenItem);
      }

      const ordenItem = await this.getOrdenItemById(idOrdenItem);
      
      const [updated] = await OrdenItem.update(
        { cantidad: nuevaCantidad },
        { where: { id_orden_item: idOrdenItem } }
      );

      if (updated === 0) {
        throw new Error('Item de orden no encontrado');
      }

      // Recargar el item para obtener el subtotal calculado
      return await this.getOrdenItemById(idOrdenItem);
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Actualizar precio unitario
  async actualizarPrecio(idOrdenItem, nuevoPrecio) {
    try {
      if (nuevoPrecio < 0) {
        throw new Error('El precio no puede ser negativo');
      }

      const [updated] = await OrdenItem.update(
        { precio_unitario: nuevoPrecio },
        { where: { id_orden_item: idOrdenItem } }
      );

      if (updated === 0) {
        throw new Error('Item de orden no encontrado');
      }

      return await this.getOrdenItemById(idOrdenItem);
    } catch (error) {
      throw new Error(`Error al actualizar precio: ${error.message}`);
    }
  }

  // UPDATE - Actualizar item completo
  async updateOrdenItem(idOrdenItem, updateData) {
    try {
      const [updated] = await OrdenItem.update(updateData, {
        where: { id_orden_item: idOrdenItem }
      });

      if (updated === 0) {
        throw new Error('Item de orden no encontrado');
      }

      return await this.getOrdenItemById(idOrdenItem);
    } catch (error) {
      throw new Error(`Error al actualizar item de orden: ${error.message}`);
    }
  }

  // DELETE - Eliminar item de orden
  async deleteOrdenItem(idOrdenItem) {
    try {
      const deleted = await OrdenItem.destroy({
        where: { id_orden_item: idOrdenItem }
      });

      if (deleted === 0) {
        throw new Error('Item de orden no encontrado');
      }

      return { message: 'Item eliminado de la orden exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar item de orden: ${error.message}`);
    }
  }

  // DELETE - Eliminar item específico por orden y producto
  async deleteItemEspecifico(idOrden, idProducto) {
    try {
      const deleted = await OrdenItem.destroy({
        where: {
          id_orden: idOrden,
          id_producto: idProducto
        }
      });

      if (deleted === 0) {
        throw new Error('Item no encontrado en la orden');
      }

      return { message: 'Item eliminado de la orden exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar item específico: ${error.message}`);
    }
  }

  // DELETE - Vaciar orden completa (eliminar todos los items)
  async vaciarOrden(idOrden) {
    try {
      const deleted = await OrdenItem.destroy({
        where: { id_orden: idOrden }
      });

      return { 
        message: `Orden vaciada exitosamente`,
        itemsEliminados: deleted
      };
    } catch (error) {
      throw new Error(`Error al vaciar orden: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de items de orden
  async getEstadisticasOrden(idOrden) {
    try {
      const items = await this.getItemsByOrden(idOrden);
      
      if (items.length === 0) {
        return {
          totalItems: 0,
          subtotal: 0,
          productoMasCaro: null,
          productoMayorCantidad: null,
          productoMayorSubtotal: null
        };
      }

      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      const productoMasCaro = items.reduce((max, item) => 
        parseFloat(item.precio_unitario) > parseFloat(max.precio_unitario) ? item : max
      );

      const productoMayorCantidad = items.reduce((max, item) => 
        item.cantidad > max.cantidad ? item : max
      );

      const productoMayorSubtotal = items.reduce((max, item) => 
        parseFloat(item.subtotal) > parseFloat(max.subtotal) ? item : max
      );

      return {
        totalItems: items.reduce((sum, item) => sum + item.cantidad, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        cantidadProductos: items.length,
        productoMasCaro: {
          id_producto: productoMasCaro.id_producto,
          precio_unitario: productoMasCaro.precio_unitario,
          nombre: `Producto ${productoMasCaro.id_producto}`
        },
        productoMayorCantidad: {
          id_producto: productoMayorCantidad.id_producto,
          cantidad: productoMayorCantidad.cantidad,
          nombre: `Producto ${productoMayorCantidad.id_producto}`
        },
        productoMayorSubtotal: {
          id_producto: productoMayorSubtotal.id_producto,
          subtotal: productoMayorSubtotal.subtotal,
          nombre: `Producto ${productoMayorSubtotal.id_producto}`
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de la orden: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener productos más vendidos
  async getProductosMasVendidos(options = {}) {
    try {
      const { limit = 10 } = options;

      const productos = await OrdenItem.findAll({
        attributes: [
          'id_producto',
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido'],
          [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_ingresos']
        ],
        group: ['id_producto'],
        order: [[sequelize.literal('total_vendido'), 'DESC']],
        limit: parseInt(limit)
      });

      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos más vendidos: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar si producto está en orden
  async verificarProductoEnOrden(idOrden, idProducto) {
    try {
      const existe = await OrdenItem.findOne({
        where: {
          id_orden: idOrden,
          id_producto: idProducto
        }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar producto en orden: ${error.message}`);
    }
  }

  // CÁLCULO - Calcular subtotal manualmente (para validación)
  async calcularSubtotal(cantidad, precioUnitario) {
    try {
      const subtotal = (Number(cantidad) * Number(precioUnitario)).toFixed(2);
      return parseFloat(subtotal);
    } catch (error) {
      throw new Error(`Error al calcular subtotal: ${error.message}`);
    }
  }

  // MIGRACIÓN - Recalcular subtotales para todos los items (útil para migraciones)
  async recalcularTodosSubtotales() {
    try {
      const items = await OrdenItem.findAll();
      let actualizados = 0;

      for (const item of items) {
        const subtotalCalculado = await this.calcularSubtotal(item.cantidad, item.precio_unitario);
        
        if (parseFloat(item.subtotal) !== subtotalCalculado) {
          await OrdenItem.update(
            { subtotal: subtotalCalculado },
            { where: { id_orden_item: item.id_orden_item } }
          );
          actualizados++;
        }
      }

      return {
        message: `Subtotales recalculados: ${actualizados} item(s) actualizado(s)`,
        totalItems: items.length,
        itemsActualizados: actualizados
      };
    } catch (error) {
      throw new Error(`Error al recalcular subtotales: ${error.message}`);
    }
  }
}

export default new OrdenItemService();
