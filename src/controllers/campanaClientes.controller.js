import campanaClientesService from '../services/campanaClientes.service.js';
import * as response from '../utils/response.js';

class CampanaClientesController {
  // CREATE - Asignar cliente a campaña
  async asignarClienteACampana(req, res) {
    try {
      const asignacion = await campanaClientesService.asignarClienteACampana(req.body);
      res.status(201).json(response.created(asignacion, 'Cliente asignado a campaña exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // CREATE - Asignar múltiples clientes a una campaña
  async asignarMultiplesClientes(req, res) {
    try {
      const { idCampana } = req.params;
      const { clientesIds } = req.body;
      
      if (!clientesIds || !Array.isArray(clientesIds)) {
        return res.status(400).json(response.badRequest('Se requiere un array de clientesIds'));
      }

      const result = await campanaClientesService.asignarMultiplesClientes(idCampana, clientesIds);
      res.status(201).json(response.created(result, result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener asignación específica
  async getAsignacion(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.getAsignacion(idCampana, idCliente);
      res.status(200).json(response.success(asignacion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todos los clientes de una campaña
  async getClientesByCampana(req, res) {
    try {
      const { idCampana } = req.params;
      const { estado_envio, page, limit } = req.query;
      const clientes = await campanaClientesService.getClientesByCampana(idCampana, {
        estado_envio,
        page,
        limit
      });
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener todas las campañas de un cliente
  async getCampanasByCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const { estado_envio, page, limit } = req.query;
      const campanas = await campanaClientesService.getCampanasByCliente(idCliente, {
        estado_envio,
        page,
        limit
      });
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar estado de envío
  async actualizarEstadoEnvio(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const { estado_envio } = req.body;
      
      if (!estado_envio) {
        return res.status(400).json(response.badRequest('El estado_envio es requerido'));
      }

      const asignacion = await campanaClientesService.actualizarEstadoEnvio(idCampana, idCliente, estado_envio);
      res.status(200).json(response.success(asignacion, 'Estado de envío actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como enviado
  async marcarComoEnviado(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.marcarComoEnviado(idCampana, idCliente);
      res.status(200).json(response.success(asignacion, 'Marcado como enviado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como abierto
  async marcarComoAbierto(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.marcarComoAbierto(idCampana, idCliente);
      res.status(200).json(response.success(asignacion, 'Marcado como abierto exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como respondido
  async marcarComoRespondido(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.marcarComoRespondido(idCampana, idCliente);
      res.status(200).json(response.success(asignacion, 'Marcado como respondido exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Marcar como fallido
  async marcarComoFallido(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.marcarComoFallido(idCampana, idCliente);
      res.status(200).json(response.success(asignacion, 'Marcado como fallido exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar notas
  async actualizarNotas(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const { notas } = req.body;
      
      const asignacion = await campanaClientesService.actualizarNotas(idCampana, idCliente, notas);
      res.status(200).json(response.success(asignacion, 'Notas actualizadas exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar asignación completa
  async updateAsignacion(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const asignacion = await campanaClientesService.updateAsignacion(idCampana, idCliente, req.body);
      res.status(200).json(response.success(asignacion, 'Asignación actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar asignación
  async eliminarAsignacion(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const result = await campanaClientesService.eliminarAsignacion(idCampana, idCliente);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar todos los clientes de una campaña
  async eliminarClientesDeCampana(req, res) {
    try {
      const { idCampana } = req.params;
      const result = await campanaClientesService.eliminarClientesDeCampana(idCampana);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar todas las campañas de un cliente
  async eliminarCampanasDeCliente(req, res) {
    try {
      const { idCliente } = req.params;
      const result = await campanaClientesService.eliminarCampanasDeCliente(idCliente);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de una campaña
  async getEstadisticasCampana(req, res) {
    try {
      const { idCampana } = req.params;
      const estadisticas = await campanaClientesService.getEstadisticasCampana(idCampana);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ESTADÍSTICAS - Obtener clientes pendientes de envío
  async getClientesPendientes(req, res) {
    try {
      const { idCampana } = req.params;
      const clientes = await campanaClientesService.getClientesPendientes(idCampana);
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Verificar si existe asignación
  async verificarAsignacion(req, res) {
    try {
      const { idCampana, idCliente } = req.params;
      const existe = await campanaClientesService.verificarAsignacion(idCampana, idCliente);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CampanaClientesController();
