import InventarioService from '../services/inventario.service.js';
import response from '../utils/response.js';

class InventarioController {
  // CREATE
  async createInventario(req, res) {
    try {
      const { id_producto, id_almacen, cantidad_actual, cantidad_minima, cantidad_maxima } = req.body;

      if (!id_producto || !id_almacen || cantidad_actual === undefined || !cantidad_minima || !cantidad_maxima) {
        return response.badRequest(res, 'Todos los campos son requeridos');
      }

      const inventario = await InventarioService.createInventario({
        id_producto,
        id_almacen,
        cantidad_actual: parseInt(cantidad_actual),
        cantidad_minima: parseInt(cantidad_minima),
        cantidad_maxima: parseInt(cantidad_maxima)
      });

      return response.created(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getInventarioById(req, res) {
    try {
      const { idInventario } = req.params;

      const inventario = await InventarioService.getInventarioById(idInventario);
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getInventarioByProductoAlmacen(req, res) {
    try {
      const { idProducto, idAlmacen } = req.params;

      const inventario = await InventarioService.getInventarioByProductoAlmacen(idProducto, idAlmacen);
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getAllInventario(req, res) {
    try {
      const { 
        page, 
        limit, 
        id_producto, 
        id_almacen,
        stock_bajo,
        stock_excedido,
        orderBy,
        order
      } = req.query;

      const inventario = await InventarioService.getAllInventario({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        id_producto,
        id_almacen,
        stock_bajo: stock_bajo === 'true',
        stock_excedido: stock_excedido === 'true',
        orderBy: orderBy || 'fecha_actualizacion',
        order: order || 'DESC'
      });

      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getInventarioByProducto(req, res) {
    try {
      const { idProducto } = req.params;

      const inventario = await InventarioService.getInventarioByProducto(idProducto);
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getInventarioByAlmacen(req, res) {
    try {
      const { idAlmacen } = req.params;
      const { page, limit, stock_bajo } = req.query;

      const inventario = await InventarioService.getInventarioByAlmacen(idAlmacen, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        stock_bajo: stock_bajo === 'true'
      });

      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ
  async getStockTotalByProducto(req, res) {
    try {
      const { idProducto } = req.params;

      const stock = await InventarioService.getStockTotalByProducto(idProducto);
      return response.success(res, stock);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async updateInventario(req, res) {
    try {
      const { idInventario } = req.params;
      const updateData = req.body;

      const inventario = await InventarioService.updateInventario(idInventario, updateData);
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async actualizarCantidad(req, res) {
    try {
      const { idInventario } = req.params;
      const { cantidad_actual } = req.body;

      if (cantidad_actual === undefined) {
        return response.badRequest(res, 'El campo cantidad_actual es requerido');
      }

      const inventario = await InventarioService.actualizarCantidad(idInventario, parseInt(cantidad_actual));
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async ajustarCantidad(req, res) {
    try {
      const { idInventario } = req.params;
      const { cantidad_ajuste } = req.body;

      if (cantidad_ajuste === undefined) {
        return response.badRequest(res, 'El campo cantidad_ajuste es requerido');
      }

      const inventario = await InventarioService.ajustarCantidad(idInventario, parseInt(cantidad_ajuste));
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async incrementarCantidad(req, res) {
    try {
      const { idInventario } = req.params;
      const { cantidad } = req.body;

      if (!cantidad) {
        return response.badRequest(res, 'El campo cantidad es requerido');
      }

      const inventario = await InventarioService.incrementarCantidad(idInventario, parseInt(cantidad));
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async decrementarCantidad(req, res) {
    try {
      const { idInventario } = req.params;
      const { cantidad } = req.body;

      if (!cantidad) {
        return response.badRequest(res, 'El campo cantidad es requerido');
      }

      const inventario = await InventarioService.decrementarCantidad(idInventario, parseInt(cantidad));
      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async actualizarNivelesStock(req, res) {
    try {
      const { idInventario } = req.params;
      const { cantidad_minima, cantidad_maxima } = req.body;

      if (!cantidad_minima || !cantidad_maxima) {
        return response.badRequest(res, 'Los campos cantidad_minima y cantidad_maxima son requeridos');
      }

      const inventario = await InventarioService.actualizarNivelesStock(
        idInventario,
        parseInt(cantidad_minima),
        parseInt(cantidad_maxima)
      );

      return response.success(res, inventario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // DELETE
  async deleteInventario(req, res) {
    try {
      const { idInventario } = req.params;

      const resultado = await InventarioService.deleteInventario(idInventario);
      return response.noContent(res);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // DELETE
  async deleteInventarioByProductoAlmacen(req, res) {
    try {
      const { idProducto, idAlmacen } = req.params;

      await InventarioService.deleteInventarioByProductoAlmacen(idProducto, idAlmacen);
      return response.noContent(res);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // ESTADÍSTICAS
  async getProductosStockBajo(req, res) {
    try {
      const productos = await InventarioService.getProductosStockBajo();
      return response.success(res, productos);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // ESTADÍSTICAS
  async getProductosStockExcedido(req, res) {
    try {
      const productos = await InventarioService.getProductosStockExcedido();
      return response.success(res, productos);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // ESTADÍSTICAS
  async getResumenInventario(req, res) {
    try {
      const resumen = await InventarioService.getResumenInventario();
      return response.success(res, resumen);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // VALIDACIÓN
  async verificarStockSuficiente(req, res) {
    try {
      const { idProducto, idAlmacen, cantidad } = req.params;

      const verificacion = await InventarioService.verificarStockSuficiente(
        idProducto,
        idAlmacen,
        parseInt(cantidad)
      );

      return response.success(res, verificacion);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // TRANSFERENCIA
  async transferirStock(req, res) {
    try {
      const { id_producto, id_almacen_origen, id_almacen_destino, cantidad } = req.body;

      if (!id_producto || !id_almacen_origen || !id_almacen_destino || !cantidad) {
        return response.badRequest(res, 'Todos los campos son requeridos');
      }

      const resultado = await InventarioService.transferirStock(
        id_producto,
        id_almacen_origen,
        id_almacen_destino,
        parseInt(cantidad)
      );

      return response.success(res, resultado);
    } catch (error) {
      return response.handleError(res, error);
    }
  }
}

export default new InventarioController();
