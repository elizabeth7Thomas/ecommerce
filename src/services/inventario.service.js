import Inventario from '../models/inventario.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

class InventarioService {
  // CREATE - Crear nuevo registro de inventario
  async createInventario(inventarioData) {
    try {
      // Validar cantidades
      if (inventarioData.cantidad_minima > inventarioData.cantidad_maxima) {
        throw new Error('La cantidad mínima no puede ser mayor que la cantidad máxima');
      }

      // Verificar si ya existe el producto en el almacén
      const existe = await Inventario.findOne({
        where: {
          id_producto: inventarioData.id_producto,
          id_almacen: inventarioData.id_almacen
        }
      });

      if (existe) {
        throw new Error('El producto ya existe en este almacén');
      }

      const inventario = await Inventario.create(inventarioData);
      return inventario;
    } catch (error) {
      throw new Error(`Error al crear registro de inventario: ${error.message}`);
    }
  }

  // READ - Obtener inventario por ID
  async getInventarioById(idInventario) {
    try {
      const inventario = await Inventario.findByPk(idInventario);
      if (!inventario) {
        throw new Error('Registro de inventario no encontrado');
      }
      return inventario;
    } catch (error) {
      throw new Error(`Error al obtener inventario: ${error.message}`);
    }
  }

  // READ - Obtener inventario por producto y almacén
  async getInventarioByProductoAlmacen(idProducto, idAlmacen) {
    try {
      const inventario = await Inventario.findOne({
        where: {
          id_producto: idProducto,
          id_almacen: idAlmacen
        }
      });

      if (!inventario) {
        throw new Error('Registro de inventario no encontrado');
      }

      return inventario;
    } catch (error) {
      throw new Error(`Error al obtener inventario: ${error.message}`);
    }
  }

  // READ - Obtener todos los registros de inventario (con filtros)
  async getAllInventario(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        id_producto, 
        id_almacen,
        stock_bajo = false,
        stock_excedido = false,
        orderBy = 'fecha_actualizacion',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (id_producto) {
        whereClause.id_producto = id_producto;
      }
      
      if (id_almacen) {
        whereClause.id_almacen = id_almacen;
      }

      // Filtro para stock bajo
      if (stock_bajo) {
        whereClause.cantidad_actual = {
          [Op.lte]: sequelize.col('cantidad_minima')
        };
      }

      // Filtro para stock excedido
      if (stock_excedido) {
        whereClause.cantidad_actual = {
          [Op.gt]: sequelize.col('cantidad_maxima')
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Inventario.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        inventario: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener inventario: ${error.message}`);
    }
  }

  // READ - Obtener inventario por producto
  async getInventarioByProducto(idProducto) {
    try {
      const inventario = await Inventario.findAll({
        where: { id_producto: idProducto },
        order: [['id_almacen', 'ASC']]
      });
      return inventario;
    } catch (error) {
      throw new Error(`Error al obtener inventario del producto: ${error.message}`);
    }
  }

  // READ - Obtener inventario por almacén
  async getInventarioByAlmacen(idAlmacen, options = {}) {
    try {
      const { page = 1, limit = 50, stock_bajo } = options;
      
      const whereClause = { id_almacen: idAlmacen };
      
      if (stock_bajo) {
        whereClause.cantidad_actual = {
          [Op.lte]: sequelize.col('cantidad_minima')
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Inventario.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['id_producto', 'ASC']]
      });

      return {
        inventario: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener inventario del almacén: ${error.message}`);
    }
  }

  // READ - Obtener stock total por producto (suma de todos los almacenes)
  async getStockTotalByProducto(idProducto) {
    try {
      const resultado = await Inventario.findAll({
        where: { id_producto: idProducto },
        attributes: [
          'id_producto',
          [sequelize.fn('SUM', sequelize.col('cantidad_actual')), 'stock_total']
        ],
        group: ['id_producto']
      });

      const stockTotal = resultado.length > 0 ? parseInt(resultado[0].dataValues.stock_total) : 0;
      
      return {
        id_producto: idProducto,
        stock_total: stockTotal
      };
    } catch (error) {
      throw new Error(`Error al obtener stock total: ${error.message}`);
    }
  }

  // UPDATE - Actualizar inventario
  async updateInventario(idInventario, updateData) {
    try {
      // Validar cantidades si se están actualizando
      if (updateData.cantidad_minima !== undefined && updateData.cantidad_maxima !== undefined) {
        if (updateData.cantidad_minima > updateData.cantidad_maxima) {
          throw new Error('La cantidad mínima no puede ser mayor que la cantidad máxima');
        }
      }

      // Actualizar fecha de actualización
      updateData.fecha_actualizacion = new Date();

      const [updated] = await Inventario.update(updateData, {
        where: { id_inventario: idInventario }
      });

      if (updated === 0) {
        throw new Error('Registro de inventario no encontrado');
      }

      return await this.getInventarioById(idInventario);
    } catch (error) {
      throw new Error(`Error al actualizar inventario: ${error.message}`);
    }
  }

  // UPDATE - Actualizar cantidad actual
  async actualizarCantidad(idInventario, nuevaCantidad) {
    try {
      if (nuevaCantidad < 0) {
        throw new Error('La cantidad no puede ser negativa');
      }

      const [updated] = await Inventario.update(
        { 
          cantidad_actual: nuevaCantidad,
          fecha_actualizacion: new Date()
        },
        { where: { id_inventario: idInventario } }
      );

      if (updated === 0) {
        throw new Error('Registro de inventario no encontrado');
      }

      return await this.getInventarioById(idInventario);
    } catch (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Ajustar cantidad (sumar/restar)
  async ajustarCantidad(idInventario, cantidadAjuste) {
    try {
      const inventario = await this.getInventarioById(idInventario);
      
      const nuevaCantidad = inventario.cantidad_actual + cantidadAjuste;
      
      if (nuevaCantidad < 0) {
        throw new Error('No hay suficiente stock para realizar este ajuste');
      }

      return await this.actualizarCantidad(idInventario, nuevaCantidad);
    } catch (error) {
      throw new Error(`Error al ajustar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Incrementar cantidad
  async incrementarCantidad(idInventario, cantidad) {
    try {
      if (cantidad <= 0) {
        throw new Error('La cantidad a incrementar debe ser positiva');
      }
      return await this.ajustarCantidad(idInventario, cantidad);
    } catch (error) {
      throw new Error(`Error al incrementar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Decrementar cantidad
  async decrementarCantidad(idInventario, cantidad) {
    try {
      if (cantidad <= 0) {
        throw new Error('La cantidad a decrementar debe ser positiva');
      }
      return await this.ajustarCantidad(idInventario, -cantidad);
    } catch (error) {
      throw new Error(`Error al decrementar cantidad: ${error.message}`);
    }
  }

  // UPDATE - Actualizar niveles de stock
  async actualizarNivelesStock(idInventario, cantidadMinima, cantidadMaxima) {
    try {
      if (cantidadMinima > cantidadMaxima) {
        throw new Error('La cantidad mínima no puede ser mayor que la cantidad máxima');
      }

      const [updated] = await Inventario.update(
        { 
          cantidad_minima: cantidadMinima,
          cantidad_maxima: cantidadMaxima,
          fecha_actualizacion: new Date()
        },
        { where: { id_inventario: idInventario } }
      );

      if (updated === 0) {
        throw new Error('Registro de inventario no encontrado');
      }

      return await this.getInventarioById(idInventario);
    } catch (error) {
      throw new Error(`Error al actualizar niveles de stock: ${error.message}`);
    }
  }

  // DELETE - Eliminar registro de inventario
  async deleteInventario(idInventario) {
    try {
      const deleted = await Inventario.destroy({
        where: { id_inventario: idInventario }
      });

      if (deleted === 0) {
        throw new Error('Registro de inventario no encontrado');
      }

      return { message: 'Registro de inventario eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar inventario: ${error.message}`);
    }
  }

  // DELETE - Eliminar inventario por producto y almacén
  async deleteInventarioByProductoAlmacen(idProducto, idAlmacen) {
    try {
      const deleted = await Inventario.destroy({
        where: {
          id_producto: idProducto,
          id_almacen: idAlmacen
        }
      });

      if (deleted === 0) {
        throw new Error('Registro de inventario no encontrado');
      }

      return { message: 'Registro de inventario eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar inventario: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener productos con stock bajo
  async getProductosStockBajo() {
    try {
      const productos = await Inventario.findAll({
        where: {
          cantidad_actual: {
            [Op.lte]: sequelize.col('cantidad_minima')
          }
        },
        order: [['cantidad_actual', 'ASC']]
      });

      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos con stock bajo: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener productos con stock excedido
  async getProductosStockExcedido() {
    try {
      const productos = await Inventario.findAll({
        where: {
          cantidad_actual: {
            [Op.gt]: sequelize.col('cantidad_maxima')
          }
        },
        order: [['cantidad_actual', 'DESC']]
      });

      return productos;
    } catch (error) {
      throw new Error(`Error al obtener productos con stock excedido: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener resumen de inventario
  async getResumenInventario() {
    try {
      const totalProductos = await Inventario.count();
      
      const stockBajo = await Inventario.count({
        where: {
          cantidad_actual: {
            [Op.lte]: sequelize.col('cantidad_minima')
          }
        }
      });

      const stockExcedido = await Inventario.count({
        where: {
          cantidad_actual: {
            [Op.gt]: sequelize.col('cantidad_maxima')
          }
        }
      });

      const valorTotal = await Inventario.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('cantidad_actual')), 'total_unidades']
        ]
      });

      return {
        totalRegistros: totalProductos,
        productosStockBajo: stockBajo,
        productosStockExcedido: stockExcedido,
        totalUnidades: valorTotal[0]?.dataValues.total_unidades || 0
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen de inventario: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar si hay suficiente stock
  async verificarStockSuficiente(idProducto, idAlmacen, cantidadRequerida) {
    try {
      const inventario = await this.getInventarioByProductoAlmacen(idProducto, idAlmacen);
      
      return {
        suficiente: inventario.cantidad_actual >= cantidadRequerida,
        cantidad_actual: inventario.cantidad_actual,
        cantidad_requerida: cantidadRequerida,
        diferencia: inventario.cantidad_actual - cantidadRequerida
      };
    } catch (error) {
      throw new Error(`Error al verificar stock: ${error.message}`);
    }
  }

  // TRANSFERENCIA - Transferir stock entre almacenes
  async transferirStock(idProducto, idAlmacenOrigen, idAlmacenDestino, cantidad) {
    try {
      if (cantidad <= 0) {
        throw new Error('La cantidad a transferir debe ser positiva');
      }

      // Verificar stock en almacén origen
      const stockOrigen = await this.verificarStockSuficiente(idProducto, idAlmacenOrigen, cantidad);
      
      if (!stockOrigen.suficiente) {
        throw new Error(`Stock insuficiente en almacén origen. Disponible: ${stockOrigen.cantidad_actual}, Requerido: ${cantidad}`);
      }

      // Disminuir en almacén origen
      await this.decrementarCantidad(
        (await this.getInventarioByProductoAlmacen(idProducto, idAlmacenOrigen)).id_inventario,
        cantidad
      );

      // Aumentar en almacén destino (o crear registro si no existe)
      try {
        await this.incrementarCantidad(
          (await this.getInventarioByProductoAlmacen(idProducto, idAlmacenDestino)).id_inventario,
          cantidad
        );
      } catch (error) {
        // Si no existe el registro en el almacén destino, crearlo
        if (error.message.includes('no encontrado')) {
          await this.createInventario({
            id_producto: idProducto,
            id_almacen: idAlmacenDestino,
            cantidad_actual: cantidad
          });
        } else {
          throw error;
        }
      }

      return {
        message: `Transferencia de ${cantidad} unidades completada exitosamente`,
        id_producto: idProducto,
        id_almacen_origen: idAlmacenOrigen,
        id_almacen_destino: idAlmacenDestino,
        cantidad: cantidad
      };
    } catch (error) {
      throw new Error(`Error al transferir stock: ${error.message}`);
    }
  }
}

export default new InventarioService();
