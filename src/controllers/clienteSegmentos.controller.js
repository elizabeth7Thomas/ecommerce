import clienteSegmentosService from '../services/clienteSegmentos.service.js';
import * as response from '../utils/response.js';

class ClienteSegmentosController {
  // CREATE - Asignar segmento a cliente
  async asignarSegmentoACliente(req, res) {
    try {
      const asignacion = await clienteSegmentosService.asignarSegmentoACliente(req.body);
      res.status(201).json(response.created(asignacion, 'Segmento asignado a cliente exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Asignar múltiples segmentos a un cliente
  async asignarMultiplesSegmentos(req, res) {
    try {
      const { idCliente } = req.params;
      const { segmentosIds } = req.body;
      
      if (!segmentosIds || !Array.isArray(segmentosIds)) {
        return res.status(400).json(response.badRequest('Se requiere un array de segmentosIds'));
      }

      const result = await clienteSegmentosService.asignarMultiplesSegmentos(idCliente, segmentosIds);
      res.status(201).json(response.created(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Asignar múltiples clientes a un segmento
  async asignarMultiplesClientes(req, res) {
    try {
      const { idSegmento } = req.params;
      const { clientesIds } = req.body;
      
      if (!clientesIds || !Array.isArray(clientesIds)) {
        return res.status(400).json(response.badRequest('Se requiere un array de clientesIds'));
      }

      const result = await clienteSegmentosService.asignarMultiplesClientes(idSegmento, clientesIds);
      res.status(201).json(response.created(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener asignación específica
  async getAsignacion(req, res) {
    try {
      const { idCliente, idSegmento } = req.params;
      const asignacion = await clienteSegmentosService.getAsignacion(idCliente, idSegmento);
      res.status(200).json(response.success(asignacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todos los segmentos de un cliente
  async getSegmentosByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const { page, limit } = req.query;
      const segmentos = await clienteSegmentosService.getSegmentosByCliente(idCliente, {
        page,
        limit
      });
      res.status(200).json(response.success(segmentos));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener todos los clientes de un segmento
  async getClientesBySegmento(req, res) {
    try {
      const { idSegmento } = req.params;
      const { page, limit } = req.query;
      const clientes = await clienteSegmentosService.getClientesBySegmento(idSegmento, {
        page,
        limit
      });
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener clientes en múltiples segmentos
  async getClientesEnMultiplesSegmentos(req, res) {
    try {
      const { segmentosIds } = req.body;
      
      if (!segmentosIds || !Array.isArray(segmentosIds)) {
        return res.status(400).json(response.badRequest('Se requiere un array de segmentosIds'));
      }

      const clientes = await clienteSegmentosService.getClientesEnMultiplesSegmentos(segmentosIds);
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar fecha de asignación
  async actualizarFechaAsignacion(req, res) {
    try {
      const { idCliente, idSegmento } = req.params;
      const { fecha_asignacion } = req.body;
      
      if (!fecha_asignacion) {
        return res.status(400).json(response.badRequest('La fecha_asignacion es requerida'));
      }

      const asignacion = await clienteSegmentosService.actualizarFechaAsignacion(idCliente, idSegmento, fecha_asignacion);
      res.status(200).json(response.success(asignacion, 'Fecha de asignación actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar asignación
  async eliminarAsignacion(req, res) {
    try {
      const { idCliente, idSegmento } = req.params;
      const result = await clienteSegmentosService.eliminarAsignacion(idCliente, idSegmento);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar todos los segmentos de un cliente
  async eliminarSegmentosDeCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const result = await clienteSegmentosService.eliminarSegmentosDeCliente(idCliente);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar todos los clientes de un segmento
  async eliminarClientesDeSegmento(req, res) {
    try {
      const { idSegmento } = req.params;
      const result = await clienteSegmentosService.eliminarClientesDeSegmento(idSegmento);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de segmentos por cliente
  async getEstadisticasCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const estadisticas = await clienteSegmentosService.getEstadisticasCliente(idCliente);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de clientes por segmento
  async getEstadisticasSegmento(req, res) {
    try {
      const { idSegmento } = req.params;
      const estadisticas = await clienteSegmentosService.getEstadisticasSegmento(idSegmento);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener distribución de clientes por segmentos
  async getDistribucionSegmentos(req, res) {
    try {
      const distribucion = await clienteSegmentosService.getDistribucionSegmentos();
      res.status(200).json(response.success(distribucion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Verificar si existe asignación
  async verificarAsignacion(req, res) {
    try {
      const { idCliente, idSegmento } = req.params;
      const existe = await clienteSegmentosService.verificarAsignacion(idCliente, idSegmento);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new ClienteSegmentosController();
