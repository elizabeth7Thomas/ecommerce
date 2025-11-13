import cotizacionesOrdenesService from '../services/cotizacionesOrdenes.service.js';
import * as response from '../utils/response.js';

class CotizacionesOrdenesController {
  // CREATE - Crear relación cotización-orden
  async createCotizacionOrden(req, res) {
    try {
      const relacion = await cotizacionesOrdenesService.createCotizacionOrden(req.body);
      res.status(201).json(response.created(relacion, 'Relación creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Convertir cotización en orden
  async convertirCotizacionEnOrden(req, res) {
    try {
      const { idCotizacion } = req.params;
      const { id_orden } = req.body;
      
      if (!id_orden) {
        return res.status(400).json(response.badRequest('El id_orden es requerido'));
      }

      const resultado = await cotizacionesOrdenesService.convertirCotizacionEnOrden(idCotizacion, id_orden);
      res.status(201).json(response.created(resultado, resultado.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener relación por IDs
  async getRelacionByIds(req, res) {
    try {
      const { idCotizacion, idOrden } = req.params;
      const relacion = await cotizacionesOrdenesService.getRelacionByIds(idCotizacion, idOrden);
      res.status(200).json(response.success(relacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener orden por cotización
  async getOrdenByCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const relacion = await cotizacionesOrdenesService.getOrdenByCotizacion(idCotizacion);
      res.status(200).json(response.success(relacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener cotización por orden
  async getCotizacionByOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const relacion = await cotizacionesOrdenesService.getCotizacionByOrden(idOrden);
      res.status(200).json(response.success(relacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todas las relaciones
  async getAllRelaciones(req, res) {
    try {
      const { 
        page, limit, fecha_desde, fecha_hasta, orderBy, order 
      } = req.query;
      
      const relaciones = await cotizacionesOrdenesService.getAllRelaciones({
        page,
        limit,
        fecha_desde,
        fecha_hasta,
        orderBy,
        order
      });
      res.status(200).json(response.success(relaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener conversiones por fecha
  async getConversionesByFecha(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json(response.badRequest('fecha_inicio y fecha_fin son requeridos'));
      }

      const conversiones = await cotizacionesOrdenesService.getConversionesByFecha(fecha_inicio, fecha_fin);
      res.status(200).json(response.success(conversiones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener conversiones recientes
  async getConversionesRecientes(req, res) {
    try {
      const { dias = 30 } = req.query;
      const conversiones = await cotizacionesOrdenesService.getConversionesRecientes(parseInt(dias));
      res.status(200).json(response.success(conversiones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar fecha de conversión
  async actualizarFechaConversion(req, res) {
    try {
      const { idCotizacion, idOrden } = req.params;
      const { fecha_conversion } = req.body;
      
      if (!fecha_conversion) {
        return res.status(400).json(response.badRequest('La fecha_conversion es requerida'));
      }

      const relacion = await cotizacionesOrdenesService.actualizarFechaConversion(
        idCotizacion, 
        idOrden, 
        fecha_conversion
      );
      res.status(200).json(response.success(relacion, 'Fecha de conversión actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar relación
  async deleteRelacion(req, res) {
    try {
      const { idCotizacion, idOrden } = req.params;
      const result = await cotizacionesOrdenesService.deleteRelacion(idCotizacion, idOrden);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar relaciones por cotización
  async deleteRelacionesByCotizacion(req, res) {
    try {
      const { idCotizacion } = req.params;
      const result = await cotizacionesOrdenesService.deleteRelacionesByCotizacion(idCotizacion);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar relaciones por orden
  async deleteRelacionesByOrden(req, res) {
    try {
      const { idOrden } = req.params;
      const result = await cotizacionesOrdenesService.deleteRelacionesByOrden(idOrden);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de conversiones
  async getEstadisticasConversiones(req, res) {
    try {
      const estadisticas = await cotizacionesOrdenesService.getEstadisticasConversiones();
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener tasa de conversión
  async getTasaConversion(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json(response.badRequest('fecha_inicio y fecha_fin son requeridos'));
      }

      const tasa = await cotizacionesOrdenesService.getTasaConversion(fecha_inicio, fecha_fin);
      res.status(200).json(response.success(tasa));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // VALIDACIÓN - Verificar si cotización fue convertida
  async verificarCotizacionConvertida(req, res) {
    try {
      const { idCotizacion } = req.params;
      const verificacion = await cotizacionesOrdenesService.verificarCotizacionConvertida(idCotizacion);
      res.status(200).json(response.success(verificacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // VALIDACIÓN - Verificar si orden proviene de cotización
  async verificarOrdenDeCotizacion(req, res) {
    try {
      const { idOrden } = req.params;
      const verificacion = await cotizacionesOrdenesService.verificarOrdenDeCotizacion(idOrden);
      res.status(200).json(response.success(verificacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Obtener historial de conversiones
  async getHistorialConversiones(req, res) {
    try {
      const { limit } = req.query;
      const historial = await cotizacionesOrdenesService.getHistorialConversiones(limit);
      res.status(200).json(response.success(historial));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // MIGRACIÓN - Reasignar orden a cotización
  async reasignarOrdenACotizacion(req, res) {
    try {
      const { idCotizacionActual, idCotizacionNueva, idOrden } = req.body;
      
      if (!idCotizacionActual || !idCotizacionNueva || !idOrden) {
        return res.status(400).json(response.badRequest('idCotizacionActual, idCotizacionNueva e idOrden son requeridos'));
      }

      const resultado = await cotizacionesOrdenesService.reasignarOrdenACotizacion(
        idCotizacionActual,
        idCotizacionNueva,
        idOrden
      );
      res.status(200).json(response.success(resultado, resultado.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UTILIDAD - Actualizar estados expirados
  async actualizarEstadosExpirados(req, res) {
    try {
      const result = await cotizacionesOrdenesService.actualizarEstadosExpirados();
      res.status(200).json(response.success(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CotizacionesOrdenesController();