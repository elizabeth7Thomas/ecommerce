import ordenItemService from '../services/ordenesItems.service.js';
import * as response from '../utils/response.js';

class OrdenItemController {
  // CREATE - Crear nuevo item de orden
  async createOrdenItem(req, res) {
    try {
      const ordenItem = await ordenItemService.createOrdenItem(req.body);
      res.status(201).json(response.created(ordenItem, 'Item agregado a la orden exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Crear múltiples items para una orden
  async createMultipleOrdenItems(req, res) {
    try {
      const { idOrden } = req.params;
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json(response.badRequest('Se requiere un array de items'));
      }

      const result = await ordenItemService.createMultipleOrdenItems(idOrden, items);
      res.status(201).json(response.created(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener item por ID
  async getOrdenItemById(req, res) {
    try {
      const { id } = req.params;
      const ordenItem = await ordenItemService.getOrdenItemById(id);
      res.status(200).json(response.success(ordenItem));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todos los items de una orden
  async getItemsByOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const items = await ordenItemService.getItemsByOrden(idOrden);
      res.status(200).json(response.success(items));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener item específico en orden
  async getItemByOrdenProducto(req, res) {
    try {
      const { idOrden, idProducto } = req.params;
      const ordenItem = await ordenItemService.getItemByOrdenProducto(idOrden, idProducto);
      res.status(200).json(response.success(ordenItem));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener resumen de la orden
  async getResumenOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const resumen = await ordenItemService.getResumenOrden(idOrden);
      res.status(200).json(response.success(resumen));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener órdenes que contienen un producto
  async getOrdenesByProducto(req, res) {
    try {
      const { idProducto } = req.params;
      const { page, limit } = req.query;
      
      const ordenes = await ordenItemService.getOrdenesByProducto(idProducto, {
        page,
        limit
      });
      res.status(200).json(response.success(ordenes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar cantidad de item
  async actualizarCantidad(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;
      
      if (!cantidad || cantidad < 0) {
        return res.status(400).json(response.badRequest('La cantidad debe ser un número positivo'));
      }

      const ordenItem = await ordenItemService.actualizarCantidad(id, cantidad);
      res.status(200).json(response.success(ordenItem, 'Cantidad actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar precio unitario
  async actualizarPrecio(req, res) {
    try {
      const { id } = req.params;
      const { precio_unitario } = req.body;
      
      if (!precio_unitario || precio_unitario < 0) {
        return res.status(400).json(response.badRequest('El precio debe ser un número positivo'));
      }

      const ordenItem = await ordenItemService.actualizarPrecio(id, precio_unitario);
      res.status(200).json(response.success(ordenItem, 'Precio actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar item completo
  async updateOrdenItem(req, res) {
    try {
      const { id } = req.params;
      const ordenItem = await ordenItemService.updateOrdenItem(id, req.body);
      res.status(200).json(response.success(ordenItem, 'Item actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar item de orden por ID
  async deleteOrdenItem(req, res) {
    try {
      const { id } = req.params;
      const result = await ordenItemService.deleteOrdenItem(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar item específico por orden y producto
  async deleteItemEspecifico(req, res) {
    try {
      const { idOrden, idProducto } = req.params;
      const result = await ordenItemService.deleteItemEspecifico(idOrden, idProducto);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Vaciar orden completa
  async vaciarOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const result = await ordenItemService.vaciarOrden(idOrden);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de items de orden
  async getEstadisticasOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const estadisticas = await ordenItemService.getEstadisticasOrden(idOrden);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener productos más vendidos
  async getProductosMasVendidos(req, res) {
    try {
      const { limit } = req.query;
      const productos = await ordenItemService.getProductosMasVendidos({ limit });
      res.status(200).json(response.success(productos));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // VALIDACIÓN - Verificar si producto está en orden
  async verificarProductoEnOrden(req, res) {
    try {
      const { idOrden, idProducto } = req.params;
      const existe = await ordenItemService.verificarProductoEnOrden(idOrden, idProducto);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Calcular subtotal
  async calcularSubtotal(req, res) {
    try {
      const { cantidad, precio_unitario } = req.body;
      
      if (!cantidad || !precio_unitario) {
        return res.status(400).json(response.badRequest('cantidad y precio_unitario son requeridos'));
      }

      const subtotal = await ordenItemService.calcularSubtotal(cantidad, precio_unitario);
      res.status(200).json(response.success({ subtotal }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // MIGRACIÓN - Recalcular subtotales para todos los items
  async recalcularTodosSubtotales(req, res) {
    try {
      const result = await ordenItemService.recalcularTodosSubtotales();
      res.status(200).json(response.success(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new OrdenItemController();
