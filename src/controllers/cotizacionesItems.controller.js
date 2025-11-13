import cotizacionesItemsService from '../services/cotizacionesItems.service.js';
import * as response from '../utils/response.js';

class CotizacionesItemsController {
  // CREATE - Agregar item a cotización
  async agregarItemACotizacion(req, res) {
    try {
      const item = await cotizacionesItemsService.agregarItemACotizacion(req.body);
      res.status(201).json(response.created(item, 'Item agregado a la cotización exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Agregar múltiples items a una cotización
  async agregarMultiplesItems(req, res) {
    try {
      const { idCotizacion } = req.params;
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json(response.badRequest('Se requiere un array de items'));
      }

      const result = await cotizacionesItemsService.agregarMultiplesItems(idCotizacion, items);
      res.status(201).json(response.created(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener item por ID
  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await cotizacionesItemsService.getItemById(id);
      res.status(200).json(response.success(item));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todos los items de una cotización
  async getItemsByCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const items = await cotizacionesItemsService.getItemsByCotizacion(idCotizacion);
      res.status(200).json(response.success(items));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener item específico en cotización
  async getItemByCotizacionProducto(req, res) {
    try {
      const { idCotizacion, idProducto } = req.params;
      const item = await cotizacionesItemsService.getItemByCotizacionProducto(idCotizacion, idProducto);
      res.status(200).json(response.success(item));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener resumen de la cotización
  async getResumenCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const resumen = await cotizacionesItemsService.getResumenCotizacion(idCotizacion);
      res.status(200).json(response.success(resumen));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener cotizaciones que contienen un producto
  async getCotizacionesByProducto(req, res) {
    try {
      const { idProducto } = req.params;
      const { page, limit } = req.query;
      
      const cotizaciones = await cotizacionesItemsService.getCotizacionesByProducto(idProducto, {
        page,
        limit
      });
      res.status(200).json(response.success(cotizaciones));
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

      const item = await cotizacionesItemsService.actualizarCantidad(id, cantidad);
      res.status(200).json(response.success(item, 'Cantidad actualizada exitosamente'));
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

      const item = await cotizacionesItemsService.actualizarPrecio(id, precio_unitario);
      res.status(200).json(response.success(item, 'Precio actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar porcentaje de descuento
  async actualizarDescuento(req, res) {
    try {
      const { id } = req.params;
      const { descuento_porcentaje } = req.body;
      
      if (descuento_porcentaje === undefined || descuento_porcentaje < 0 || descuento_porcentaje > 100) {
        return res.status(400).json(response.badRequest('El descuento debe estar entre 0 y 100'));
      }

      const item = await cotizacionesItemsService.actualizarDescuento(id, descuento_porcentaje);
      res.status(200).json(response.success(item, 'Descuento actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Aplicar descuento general
  async aplicarDescuentoGeneral(req, res) {
    try {
      const { idCotizacion } = req.params;
      const { descuento_porcentaje } = req.body;
      
      if (descuento_porcentaje === undefined || descuento_porcentaje < 0 || descuento_porcentaje > 100) {
        return res.status(400).json(response.badRequest('El descuento debe estar entre 0 y 100'));
      }

      const result = await cotizacionesItemsService.aplicarDescuentoGeneral(idCotizacion, descuento_porcentaje);
      res.status(200).json(response.success(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar item completo
  async updateCotizacionItem(req, res) {
    try {
      const { id } = req.params;
      const item = await cotizacionesItemsService.updateCotizacionItem(id, req.body);
      res.status(200).json(response.success(item, 'Item actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar item de cotización por ID
  async eliminarItem(req, res) {
    try {
      const { id } = req.params;
      const result = await cotizacionesItemsService.eliminarItem(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar item específico por cotización y producto
  async eliminarItemEspecifico(req, res) {
    try {
      const { idCotizacion, idProducto } = req.params;
      const result = await cotizacionesItemsService.eliminarItemEspecifico(idCotizacion, idProducto);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Vaciar cotización completa
  async vaciarCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const result = await cotizacionesItemsService.vaciarCotizacion(idCotizacion);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de items de cotización
  async getEstadisticasCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const estadisticas = await cotizacionesItemsService.getEstadisticasCotizacion(idCotizacion);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener productos más cotizados
  async getProductosMasCotizados(req, res) {
    try {
      const { limit } = req.query;
      const productos = await cotizacionesItemsService.getProductosMasCotizados({ limit });
      res.status(200).json(response.success(productos));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // VALIDACIÓN - Verificar si producto está en cotización
  async verificarProductoEnCotizacion(req, res) {
    try {
      const { idCotizacion, idProducto } = req.params;
      const existe = await cotizacionesItemsService.verificarProductoEnCotizacion(idCotizacion, idProducto);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // CÁLCULO - Calcular subtotal
  async calcularSubtotal(req, res) {
    try {
      const { cantidad, precio_unitario, descuento_porcentaje = 0 } = req.body;
      
      if (!cantidad || !precio_unitario) {
        return res.status(400).json(response.badRequest('cantidad y precio_unitario son requeridos'));
      }

      const subtotal = await cotizacionesItemsService.calcularSubtotal(cantidad, precio_unitario, descuento_porcentaje);
      res.status(200).json(response.success({ subtotal }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CÁLCULO - Calcular descuento en moneda
  async calcularDescuentoMoneda(req, res) {
    try {
      const { cantidad, precio_unitario, descuento_porcentaje } = req.body;
      
      if (!cantidad || !precio_unitario || descuento_porcentaje === undefined) {
        return res.status(400).json(response.badRequest('cantidad, precio_unitario y descuento_porcentaje son requeridos'));
      }

      const descuento = await cotizacionesItemsService.calcularDescuentoMoneda(cantidad, precio_unitario, descuento_porcentaje);
      res.status(200).json(response.success({ descuento }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DUPLICACIÓN - Duplicar items de una cotización a otra
  async duplicarItemsCotizacion(req, res) {
    try {
      const { idCotizacionOrigen, idCotizacionDestino } = req.body;
      
      if (!idCotizacionOrigen || !idCotizacionDestino) {
        return res.status(400).json(response.badRequest('idCotizacionOrigen e idCotizacionDestino son requeridos'));
      }

      const resultado = await cotizacionesItemsService.duplicarItemsCotizacion(idCotizacionOrigen, idCotizacionDestino);
      res.status(200).json(response.success(resultado, resultado.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }
}

export default new CotizacionesItemsController();