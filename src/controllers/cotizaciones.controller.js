import cotizacionesService from '../services/cotizaciones.service.js';
import * as response from '../utils/response.js';

class CotizacionesController {
  // CREATE - Crear nueva cotización
  async createCotizacion(req, res) {
    try {
      const cotizacion = await cotizacionesService.createCotizacion(req.body);
      res.status(201).json(response.created(cotizacion, 'Cotización creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener cotización por ID
  async getCotizacionById(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.getCotizacionById(id);
      res.status(200).json(response.success(cotizacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener cotización por número
  async getCotizacionByNumero(req, res) {
    try {
      const { numero } = req.params;
      const cotizacion = await cotizacionesService.getCotizacionByNumero(numero);
      res.status(200).json(response.success(cotizacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todas las cotizaciones
  async getAllCotizaciones(req, res) {
    try {
      const { 
        page, limit, id_cliente, id_usuario_creador, 
        estado, fecha_desde, fecha_hasta, orderBy, order 
      } = req.query;
      
      const cotizaciones = await cotizacionesService.getAllCotizaciones({
        page,
        limit,
        id_cliente,
        id_usuario_creador,
        estado,
        fecha_desde,
        fecha_hasta,
        orderBy,
        order
      });
      res.status(200).json(response.success(cotizaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener cotizaciones por cliente
  async getCotizacionesByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const { page, limit, estado } = req.query;
      
      const cotizaciones = await cotizacionesService.getCotizacionesByCliente(idCliente, {
        page,
        limit,
        estado
      });
      res.status(200).json(response.success(cotizaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener cotizaciones por usuario
  async getCotizacionesByUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const { page, limit, estado } = req.query;
      
      const cotizaciones = await cotizacionesService.getCotizacionesByUsuario(idUsuario, {
        page,
        limit,
        estado
      });
      res.status(200).json(response.success(cotizaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener cotizaciones próximas a expirar
  async getCotizacionesProximasExpiracion(req, res) {
    try {
      const { dias = 7 } = req.query;
      const cotizaciones = await cotizacionesService.getCotizacionesProximasExpiracion(parseInt(dias));
      res.status(200).json(response.success(cotizaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener cotizaciones expiradas
  async getCotizacionesExpiradas(req, res) {
    try {
      const cotizaciones = await cotizacionesService.getCotizacionesExpiradas();
      res.status(200).json(response.success(cotizaciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar cotización
  async updateCotizacion(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.updateCotizacion(id, req.body);
      res.status(200).json(response.success(cotizacion, 'Cotización actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Cambiar estado de cotización
  async cambiarEstadoCotizacion(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json(response.badRequest('El estado es requerido'));
      }

      const cotizacion = await cotizacionesService.cambiarEstadoCotizacion(id, estado);
      res.status(200).json(response.success(cotizacion, `Cotización ${estado} exitosamente`));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como enviada
  async marcarComoEnviada(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.marcarComoEnviada(id);
      res.status(200).json(response.success(cotizacion, 'Cotización enviada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como aceptada
  async marcarComoAceptada(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.marcarComoAceptada(id);
      res.status(200).json(response.success(cotizacion, 'Cotización aceptada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como rechazada
  async marcarComoRechazada(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.marcarComoRechazada(id);
      res.status(200).json(response.success(cotizacion, 'Cotización rechazada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como expirada
  async marcarComoExpirada(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await cotizacionesService.marcarComoExpirada(id);
      res.status(200).json(response.success(cotizacion, 'Cotización marcada como expirada'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar montos
  async actualizarMontos(req, res) {
    try {
      const { id } = req.params;
      const { subtotal, impuestos, total } = req.body;
      
      if (subtotal === undefined || impuestos === undefined || total === undefined) {
        return res.status(400).json(response.badRequest('subtotal, impuestos y total son requeridos'));
      }

      const cotizacion = await cotizacionesService.actualizarMontos(id, subtotal, impuestos, total);
      res.status(200).json(response.success(cotizacion, 'Montos actualizados exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar notas y términos
  async actualizarNotasTerminos(req, res) {
    try {
      const { id } = req.params;
      const { notas, terminos_condiciones } = req.body;
      
      const cotizacion = await cotizacionesService.actualizarNotasTerminos(id, notas, terminos_condiciones);
      res.status(200).json(response.success(cotizacion, 'Notas y términos actualizados exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar cotización
  async deleteCotizacion(req, res) {
    try {
      const { id } = req.params;
      const result = await cotizacionesService.deleteCotizacion(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar cotizaciones por cliente
  async deleteCotizacionesByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const result = await cotizacionesService.deleteCotizacionesByCliente(idCliente);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas generales
  async getEstadisticasGenerales(req, res) {
    try {
      const estadisticas = await cotizacionesService.getEstadisticasGenerales();
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por cliente
  async getEstadisticasByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const estadisticas = await cotizacionesService.getEstadisticasByCliente(idCliente);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por usuario
  async getEstadisticasByUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const estadisticas = await cotizacionesService.getEstadisticasByUsuario(idUsuario);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Generar número de cotización
  async generarNumeroCotizacion(req, res) {
    try {
      const numero = await cotizacionesService.generarNumeroCotizacion();
      res.status(200).json(response.success({ numero_cotizacion: numero }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Verificar número de cotización
  async verificarNumeroCotizacion(req, res) {
    try {
      const { numero } = req.params;
      const existe = await cotizacionesService.verificarNumeroCotizacion(numero);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Actualizar estados expirados
  async actualizarEstadosExpirados(req, res) {
    try {
      const result = await cotizacionesService.actualizarEstadosExpirados();
      res.status(200).json(response.success(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CotizacionesController();