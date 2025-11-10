import interaccionesClienteService from '../services/interaccionesCliente.service.js';
import * as response from '../utils/response.js';

class InteraccionesClienteController {
  // CREATE - Crear nueva interacción
  async createInteraccion(req, res) {
    try {
      const interaccion = await interaccionesClienteService.createInteraccion(req.body);
      res.status(201).json(response.created(interaccion, 'Interacción creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener interacción por ID
  async getInteraccionById(req, res) {
    try {
      const { id } = req.params;
      const interaccion = await interaccionesClienteService.getInteraccionById(id);
      res.status(200).json(response.success(interaccion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todas las interacciones
  async getAllInteracciones(req, res) {
    try {
      const { 
        page, limit, id_cliente, id_usuario_asignado, 
        tipo_interaccion, estado, fecha_desde, fecha_hasta, 
        orderBy, order 
      } = req.query;
      
      const interacciones = await interaccionesClienteService.getAllInteracciones({
        page,
        limit,
        id_cliente,
        id_usuario_asignado,
        tipo_interaccion,
        estado,
        fecha_desde,
        fecha_hasta,
        orderBy,
        order
      });
      res.status(200).json(response.success(interacciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener interacciones por cliente
  async getInteraccionesByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const { page, limit, tipo_interaccion, estado } = req.query;
      
      const interacciones = await interaccionesClienteService.getInteraccionesByCliente(idCliente, {
        page,
        limit,
        tipo_interaccion,
        estado
      });
      res.status(200).json(response.success(interacciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener interacciones por usuario
  async getInteraccionesByUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const { page, limit, estado } = req.query;
      
      const interacciones = await interaccionesClienteService.getInteraccionesByUsuario(idUsuario, {
        page,
        limit,
        estado
      });
      res.status(200).json(response.success(interacciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener próximas acciones pendientes
  async getProximasAccionesPendientes(req, res) {
    try {
      const { dias = 7 } = req.query;
      const interacciones = await interaccionesClienteService.getProximasAccionesPendientes(parseInt(dias));
      res.status(200).json(response.success(interacciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener interacciones vencidas
  async getInteraccionesVencidas(req, res) {
    try {
      const interacciones = await interaccionesClienteService.getInteraccionesVencidas();
      res.status(200).json(response.success(interacciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar interacción
  async updateInteraccion(req, res) {
    try {
      const { id } = req.params;
      const interaccion = await interaccionesClienteService.updateInteraccion(id, req.body);
      res.status(200).json(response.success(interaccion, 'Interacción actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Cambiar estado de interacción
  async cambiarEstadoInteraccion(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json(response.badRequest('El estado es requerido'));
      }

      const interaccion = await interaccionesClienteService.cambiarEstadoInteraccion(id, estado);
      res.status(200).json(response.success(interaccion, `Interacción ${estado} exitosamente`));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como completada
  async marcarComoCompletada(req, res) {
    try {
      const { id } = req.params;
      const { resultado } = req.body;
      
      const interaccion = await interaccionesClienteService.marcarComoCompletada(id, resultado);
      res.status(200).json(response.success(interaccion, 'Interacción completada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Asignar usuario
  async asignarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario_asignado } = req.body;
      
      if (!id_usuario_asignado) {
        return res.status(400).json(response.badRequest('El id_usuario_asignado es requerido'));
      }

      const interaccion = await interaccionesClienteService.asignarUsuario(id, id_usuario_asignado);
      res.status(200).json(response.success(interaccion, 'Usuario asignado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Programar próxima acción
  async programarProximaAccion(req, res) {
    try {
      const { id } = req.params;
      const { proxima_accion, fecha_proxima_accion } = req.body;
      
      if (!proxima_accion || !fecha_proxima_accion) {
        return res.status(400).json(response.badRequest('proxima_accion y fecha_proxima_accion son requeridos'));
      }

      const interaccion = await interaccionesClienteService.programarProximaAccion(
        id, 
        proxima_accion, 
        fecha_proxima_accion
      );
      res.status(200).json(response.success(interaccion, 'Próxima acción programada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar interacción
  async deleteInteraccion(req, res) {
    try {
      const { id } = req.params;
      const result = await interaccionesClienteService.deleteInteraccion(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar interacciones por cliente
  async deleteInteraccionesByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const result = await interaccionesClienteService.deleteInteraccionesByCliente(idCliente);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas generales
  async getEstadisticasGenerales(req, res) {
    try {
      const estadisticas = await interaccionesClienteService.getEstadisticasGenerales();
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
      const estadisticas = await interaccionesClienteService.getEstadisticasByCliente(idCliente);
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
      const estadisticas = await interaccionesClienteService.getEstadisticasByUsuario(idUsuario);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Obtener timeline de interacciones por cliente
  async getTimelineCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const timeline = await interaccionesClienteService.getTimelineCliente(idCliente);
      res.status(200).json(response.success(timeline));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new InteraccionesClienteController();
