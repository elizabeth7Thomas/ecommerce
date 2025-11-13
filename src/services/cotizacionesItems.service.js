import Cotizaciones_Items from '../models/cotizacionesItems.model.js';

class CotizacionesItemsService {
  // CREATE - Agregar item a cotización
  async agregarItemACotizacion(itemData) {
    try {
      // Verificar si el producto ya existe en la cotización
      const existe = await Cotizaciones_Items.findOne({
        where: {
          id_cotizacion: itemData.id_cotizacion,
          id_producto: itemData.id_producto
        }
      });

      if (existe) {
        // Si ya existe, actualizar la cantidad y recalcular
        return await this.actualizarCantidad(
          existe.id_cotizacion_item,
          existe.cantidad + itemData.cantidad
        );
      }

      const item = await Cotizaciones_Items.create(itemData);
      return item;
    } catch (error) {
      throw new Error(`Error al agregar item a cotización: ${error.message}`);
    }
  }

  // CREATE - Agregar múltiples items a una cotización
  async agregarMultiplesItems(idCotizacion, itemsData) {
    try {
      const itemsCreados = [];
      
      for (const itemData of itemsData) {
        const item = await this.agregarItemACotizacion({
          ...itemData,
          id_cotizacion: idCotizacion
        });
        itemsCreados.push(item);
      }

      return {
        message: `${itemsCreados.length} item(s) agregado(s) exitosamente`,
        items: itemsCreados,
        totalItems: itemsCreados.length
      };
    } catch (error) {
      throw new Error(`Error al agregar múltiples items: ${error.message}`);
    }
  }

  // READ - Obtener item por ID
  async getItemById(idCotizacionItem) {
    try {
      const item = await Cotizaciones_Items.findByPk(idCotizacionItem);
      if (!item) {
        throw new Error('Item de cotización no encontrado');
      }
      return item;
    } catch (error) {
      throw new Error(`Error al obtener item de cotización: ${error.message}`);
    }
  }

  // READ - Obtener todos los items de una cotización
  async getItemsByCotizacion(idCotizacion) {
    try {
      const items = await Cotizaciones_Items.findAll({
        where: { id_cotizacion: idCotizacion },
        order: [['id_cotizacion_item', 'ASC']]
      });
      return items;
    } catch (error) {
      throw new Error(`Error al obtener items de la cotización: ${error.message}`);
    }
  }

  // READ - Obtener item específico en cotización
  async getItemByCotizacionProducto(idCotizacion, idProducto) {
    try {
      const item = await Cotizaciones_Items.findOne({
        where: {
          id_cotizacion: idCotizacion,
          id_producto: idProducto
        }
      });
      
      if (!item) {
        throw new Error('Item no encontrado en la cotización');
      }
      
      return item;
    } catch (error) {
      throw new Error(`Error al obtener item específico: ${error.message}`);
    }
  }

  // READ - Obtener resumen de la cotización
  async getResumenCotizacion(idCotizacion) {
    try {
      const items = await this.getItemsByCotizacion(idCotizacion);
      
      const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      const descuentoTotal = items.reduce((sum, item) => {
        const descuentoItem = (item.cantidad * item.precio_unitario * item.descuento_porcentaje) / 100;
        return sum + descuentoItem;
      }, 0);

      return {
        items,
        totalItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuentoTotal: parseFloat(descuentoTotal.toFixed(2)),
        total: parseFloat((subtotal).toFixed(2)),
        cantidadProductos: items.length
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen de la cotización: ${error.message}`);
    }
  }

  // READ - Obtener cotizaciones que contienen un producto específico
  async getCotizacionesByProducto(idProducto, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await Cotizaciones_Items.findAndCountAll({
        where: { id_producto: idProducto },
        limit: parseInt(limit),
        offset: offset,
        order: [['id_cotizacion', 'DESC']]
      });

      return {
        items: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones por producto: ${error.message}`);
    }
  }

  // UPDATE - Actualizar cantidad de item
  async actualizarCantidad(idCotizacionItem, nuevaCantidad) {
    try {
      if (nuevaCantidad < 1) {
        // Si la cantidad es menor a 1, eliminar el item
        return await this.eliminarItem(idCotizacionItem);
      }

      const [updated] = await Cotizaciones_Items.update(
        { cantidad: nuevaCantidad },
        { where: { id_cotizacion_item: idCotizacionItem } }
      );

      if (updated === 0) {
        throw new Error('Item de cotización no encontrado');
      }

      return await this.getItemById(idCotizacionItem);
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Actualizar precio unitario
  async actualizarPrecio(idCotizacionItem, nuevoPrecio) {
    try {
      if (nuevoPrecio < 0) {
        throw new Error('El precio no puede ser negativo');
      }

      const [updated] = await Cotizaciones_Items.update(
        { precio_unitario: nuevoPrecio },
        { where: { id_cotizacion_item: idCotizacionItem } }
      );

      if (updated === 0) {
        throw new Error('Item de cotización no encontrado');
      }

      return await this.getItemById(idCotizacionItem);
    } catch (error) {
      throw new Error(`Error al actualizar precio: ${error.message}`);
    }
  }

  // UPDATE - Actualizar porcentaje de descuento
  async actualizarDescuento(idCotizacionItem, nuevoDescuento) {
    try {
      if (nuevoDescuento < 0 || nuevoDescuento > 100) {
        throw new Error('El descuento debe estar entre 0 y 100');
      }

      const [updated] = await Cotizaciones_Items.update(
        { descuento_porcentaje: nuevoDescuento },
        { where: { id_cotizacion_item: idCotizacionItem } }
      );

      if (updated === 0) {
        throw new Error('Item de cotización no encontrado');
      }

      return await this.getItemById(idCotizacionItem);
    } catch (error) {
      throw new Error(`Error al actualizar descuento: ${error.message}`);
    }
  }

  // UPDATE - Aplicar descuento general a todos los items de una cotización
  async aplicarDescuentoGeneral(idCotizacion, porcentajeDescuento) {
    try {
      if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
        throw new Error('El descuento debe estar entre 0 y 100');
      }

      const [updated] = await Cotizaciones_Items.update(
        { descuento_porcentaje: porcentajeDescuento },
        { where: { id_cotizacion: idCotizacion } }
      );

      return {
        message: `Descuento aplicado a ${updated} item(s) exitosamente`,
        itemsActualizados: updated
      };
    } catch (error) {
      throw new Error(`Error al aplicar descuento general: ${error.message}`);
    }
  }

  // UPDATE - Actualizar item completo
  async updateCotizacionItem(idCotizacionItem, updateData) {
    try {
      const [updated] = await Cotizaciones_Items.update(updateData, {
        where: { id_cotizacion_item: idCotizacionItem }
      });

      if (updated === 0) {
        throw new Error('Item de cotización no encontrado');
      }

      return await this.getItemById(idCotizacionItem);
    } catch (error) {
      throw new Error(`Error al actualizar item de cotización: ${error.message}`);
    }
  }

  // DELETE - Eliminar item de cotización
  async eliminarItem(idCotizacionItem) {
    try {
      const deleted = await Cotizaciones_Items.destroy({
        where: { id_cotizacion_item: idCotizacionItem }
      });

      if (deleted === 0) {
        throw new Error('Item de cotización no encontrado');
      }

      return { message: 'Item eliminado de la cotización exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar item de cotización: ${error.message}`);
    }
  }

  // DELETE - Eliminar item específico por cotización y producto
  async eliminarItemEspecifico(idCotizacion, idProducto) {
    try {
      const deleted = await Cotizaciones_Items.destroy({
        where: {
          id_cotizacion: idCotizacion,
          id_producto: idProducto
        }
      });

      if (deleted === 0) {
        throw new Error('Item no encontrado en la cotización');
      }

      return { message: 'Item eliminado de la cotización exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar item específico: ${error.message}`);
    }
  }

  // DELETE - Vaciar cotización completa (eliminar todos los items)
  async vaciarCotizacion(idCotizacion) {
    try {
      const deleted = await Cotizaciones_Items.destroy({
        where: { id_cotizacion: idCotizacion }
      });

      return { 
        message: `Cotización vaciada exitosamente`,
        itemsEliminados: deleted
      };
    } catch (error) {
      throw new Error(`Error al vaciar cotización: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de items de cotización
  async getEstadisticasCotizacion(idCotizacion) {
    try {
      const items = await this.getItemsByCotizacion(idCotizacion);
      
      if (items.length === 0) {
        return {
          totalItems: 0,
          subtotal: 0,
          descuentoTotal: 0,
          total: 0,
          productoMasCaro: null,
          productoMayorCantidad: null,
          productoMayorDescuento: null
        };
      }

      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      const descuentoTotal = items.reduce((sum, item) => {
        const descuentoItem = (item.cantidad * item.precio_unitario * item.descuento_porcentaje) / 100;
        return sum + descuentoItem;
      }, 0);

      const productoMasCaro = items.reduce((max, item) => 
        parseFloat(item.precio_unitario) > parseFloat(max.precio_unitario) ? item : max
      );

      const productoMayorCantidad = items.reduce((max, item) => 
        item.cantidad > max.cantidad ? item : max
      );

      const productoMayorDescuento = items.reduce((max, item) => 
        item.descuento_porcentaje > max.descuento_porcentaje ? item : max
      );

      return {
        totalItems: items.reduce((sum, item) => sum + item.cantidad, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuentoTotal: parseFloat(descuentoTotal.toFixed(2)),
        total: parseFloat((subtotal).toFixed(2)),
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
        productoMayorDescuento: {
          id_producto: productoMayorDescuento.id_producto,
          descuento_porcentaje: productoMayorDescuento.descuento_porcentaje,
          nombre: `Producto ${productoMayorDescuento.id_producto}`
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de la cotización: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener productos más cotizados
  async getProductosMasCotizados(options = {}) {
    try {
      const { limit = 10 } = options;

      const productos = await Cotizaciones_Items.findAll({
        attributes: [
          'id_producto',
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cotizado'],
          [sequelize.fn('COUNT', sequelize.col('id_cotizacion')), 'veces_cotizado'],
          [sequelize.fn('AVG', sequelize.col('precio_unitario')), 'precio_promedio']
        ],
        group: ['id_producto'],
        order: [[sequelize.literal('total_cotizado'), 'DESC']],
        limit: parseInt(limit)
      });

      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos más cotizados: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar si producto está en cotización
  async verificarProductoEnCotizacion(idCotizacion, idProducto) {
    try {
      const existe = await Cotizaciones_Items.findOne({
        where: {
          id_cotizacion: idCotizacion,
          id_producto: idProducto
        }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar producto en cotización: ${error.message}`);
    }
  }

  // CÁLCULO - Calcular subtotal manualmente (para validación)
  async calcularSubtotal(cantidad, precioUnitario, descuentoPorcentaje = 0) {
    try {
      const subtotal = cantidad * precioUnitario * (1 - descuentoPorcentaje / 100);
      return parseFloat(subtotal.toFixed(2));
    } catch (error) {
      throw new Error(`Error al calcular subtotal: ${error.message}`);
    }
  }

  // CÁLCULO - Calcular descuento en moneda
  async calcularDescuentoMoneda(cantidad, precioUnitario, descuentoPorcentaje) {
    try {
      const descuento = (cantidad * precioUnitario * descuentoPorcentaje) / 100;
      return parseFloat(descuento.toFixed(2));
    } catch (error) {
      throw new Error(`Error al calcular descuento: ${error.message}`);
    }
  }

  // DUPLICACIÓN - Duplicar items de una cotización a otra
  async duplicarItemsCotizacion(idCotizacionOrigen, idCotizacionDestino) {
    try {
      const itemsOrigen = await this.getItemsByCotizacion(idCotizacionOrigen);
      const itemsDuplicados = [];

      for (const item of itemsOrigen) {
        const nuevoItem = await this.agregarItemACotizacion({
          id_cotizacion: idCotizacionDestino,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje
        });
        itemsDuplicados.push(nuevoItem);
      }

      return {
        message: `${itemsDuplicados.length} item(s) duplicado(s) exitosamente`,
        items: itemsDuplicados
      };
    } catch (error) {
      throw new Error(`Error al duplicar items de cotización: ${error.message}`);
    }
  }
}

export default new CotizacionesItemsService();