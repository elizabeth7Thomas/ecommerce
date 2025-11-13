import CampanaClientesService from '../services/campanaClientes.service.js';
import * as response from '../utils/response.js';

class CampanaClienteController {
  
  // CREATE - Asignar cliente a campaña
  async asignarClienteACampana(req, res) {
    try {
      const { id_campana, id_cliente } = req.body;

      // Validación de campos requeridos
      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los campos id_campana e id_cliente son requeridos',
          400
        );
      }

      const campanaCliente = await CampanaClientesService.asignarClienteACampana({
        id_campana,
        id_cliente,
        estado_envio: 'pendiente'
      });

      return response.success(
        req,
        res,
        campanaCliente,
        'Cliente asignado a la campaña exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al asignar cliente a campaña:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // CREATE - Asignar múltiples clientes a una campaña
  async asignarMultiplesClientes(req, res) {
    try {
      const { id_campana, clientesIds } = req.body;

      // Validación de campos requeridos
      if (!id_campana || !Array.isArray(clientesIds) || clientesIds.length === 0) {
        return response.error(
          req,
          res,
          'id_campana y un array de clientesIds son requeridos',
          400
        );
      }

      const resultado = await CampanaClientesService.asignarMultiplesClientes(
        id_campana,
        clientesIds
      );

      return response.success(
        req,
        res,
        resultado,
        'Clientes asignados a la campaña exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al asignar múltiples clientes:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // READ - Obtener asignación específica
  async getAsignacion(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      // Validación de parámetros
      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const asignacion = await CampanaClientesService.getAsignacion(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        asignacion,
        'Asignación obtenida exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener asignación:', error);
      return response.error(req, res, error.message, 404);
    }
  }

  // READ - Obtener todos los clientes de una campaña
  async getClientesByCampana(req, res) {
    try {
      const { id_campana } = req.params;
      const { estado_envio, page = 1, limit = 50 } = req.query;

      if (!id_campana) {
        return response.error(
          req,
          res,
          'El parámetro id_campana es requerido',
          400
        );
      }

      const opciones = {
        estado_envio: estado_envio || undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const resultado = await CampanaClientesService.getClientesByCampana(
        id_campana,
        opciones
      );

      return response.success(
        req,
        res,
        resultado,
        'Clientes de la campaña obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener clientes de la campaña:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener todas las campañas de un cliente
  async getCampanasByCliente(req, res) {
    try {
      const { id_cliente } = req.params;
      const { estado_envio, page = 1, limit = 50 } = req.query;

      if (!id_cliente) {
        return response.error(
          req,
          res,
          'El parámetro id_cliente es requerido',
          400
        );
      }

      const opciones = {
        estado_envio: estado_envio || undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const resultado = await CampanaClientesService.getCampanasByCliente(
        id_cliente,
        opciones
      );

      return response.success(
        req,
        res,
        resultado,
        'Campañas del cliente obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener campañas del cliente:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UPDATE - Actualizar estado de envío
  async actualizarEstadoEnvio(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;
      const { nuevoEstado } = req.body;

      // Validación de parámetros
      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      // Validación del nuevo estado
      if (!nuevoEstado) {
        return response.error(
          req,
          res,
          'El campo nuevoEstado es requerido',
          400
        );
      }

      const estadosValidos = ['pendiente', 'enviado', 'abierto', 'respondido', 'fallido'];
      if (!estadosValidos.includes(nuevoEstado)) {
        return response.error(
          req,
          res,
          `Estado inválido. Válidos: ${estadosValidos.join(', ')}`,
          400
        );
      }

      const asignacion = await CampanaClientesService.actualizarEstadoEnvio(
        id_campana,
        id_cliente,
        nuevoEstado
      );

      return response.success(
        req,
        res,
        asignacion,
        `Estado actualizado a '${nuevoEstado}' exitosamente`
      );
    } catch (error) {
      console.error('Error al actualizar estado de envío:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar como enviado
  async marcarComoEnviado(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const asignacion = await CampanaClientesService.marcarComoEnviado(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        asignacion,
        'Marcado como enviado exitosamente'
      );
    } catch (error) {
      console.error('Error al marcar como enviado:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar como abierto
  async marcarComoAbierto(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const asignacion = await CampanaClientesService.marcarComoAbierto(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        asignacion,
        'Marcado como abierto exitosamente'
      );
    } catch (error) {
      console.error('Error al marcar como abierto:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar como respondido
  async marcarComoRespondido(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const asignacion = await CampanaClientesService.marcarComoRespondido(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        asignacion,
        'Marcado como respondido exitosamente'
      );
    } catch (error) {
      console.error('Error al marcar como respondido:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar como fallido
  async marcarComoFallido(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const asignacion = await CampanaClientesService.marcarComoFallido(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        asignacion,
        'Marcado como fallido exitosamente'
      );
    } catch (error) {
      console.error('Error al marcar como fallido:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Actualizar notas
  async actualizarNotas(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;
      const { notas } = req.body;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      if (!notas) {
        return response.error(
          req,
          res,
          'El campo notas es requerido',
          400
        );
      }

      const asignacion = await CampanaClientesService.actualizarNotas(
        id_campana,
        id_cliente,
        notas
      );

      return response.success(
        req,
        res,
        asignacion,
        'Notas actualizadas exitosamente'
      );
    } catch (error) {
      console.error('Error al actualizar notas:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Actualizar asignación completa
  async updateAsignacion(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;
      const updateData = req.body;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      if (Object.keys(updateData).length === 0) {
        return response.error(
          req,
          res,
          'Debe proporcionar datos para actualizar',
          400
        );
      }

      const asignacion = await CampanaClientesService.updateAsignacion(
        id_campana,
        id_cliente,
        updateData
      );

      return response.success(
        req,
        res,
        asignacion,
        'Asignación actualizada exitosamente'
      );
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // DELETE - Eliminar asignación
  async eliminarAsignacion(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const resultado = await CampanaClientesService.eliminarAsignacion(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        resultado,
        'Asignación eliminada exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // DELETE - Eliminar todos los clientes de una campaña
  async eliminarClientesDeCampana(req, res) {
    try {
      const { id_campana } = req.params;

      if (!id_campana) {
        return response.error(
          req,
          res,
          'El parámetro id_campana es requerido',
          400
        );
      }

      const resultado = await CampanaClientesService.eliminarClientesDeCampana(
        id_campana
      );

      return response.success(
        req,
        res,
        resultado,
        'Clientes de la campaña eliminados exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar clientes de la campaña:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // DELETE - Eliminar todas las campañas de un cliente
  async eliminarCampanasDeCliente(req, res) {
    try {
      const { id_cliente } = req.params;

      if (!id_cliente) {
        return response.error(
          req,
          res,
          'El parámetro id_cliente es requerido',
          400
        );
      }

      const resultado = await CampanaClientesService.eliminarCampanasDeCliente(
        id_cliente
      );

      return response.success(
        req,
        res,
        resultado,
        'Campañas del cliente eliminadas exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar campañas del cliente:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de una campaña
  async getEstadisticasCampana(req, res) {
    try {
      const { id_campana } = req.params;

      if (!id_campana) {
        return response.error(
          req,
          res,
          'El parámetro id_campana es requerido',
          400
        );
      }

      const estadisticas = await CampanaClientesService.getEstadisticasCampana(
        id_campana
      );

      return response.success(
        req,
        res,
        estadisticas,
        'Estadísticas de la campaña obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UTILIDAD - Obtener clientes pendientes de envío
  async getClientesPendientes(req, res) {
    try {
      const { id_campana } = req.params;

      if (!id_campana) {
        return response.error(
          req,
          res,
          'El parámetro id_campana es requerido',
          400
        );
      }

      const clientes = await CampanaClientesService.getClientesPendientes(
        id_campana
      );

      return response.success(
        req,
        res,
        clientes,
        'Clientes pendientes obtenidos exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener clientes pendientes:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UTILIDAD - Verificar si existe asignación
  async verificarAsignacion(req, res) {
    try {
      const { id_campana, id_cliente } = req.params;

      if (!id_campana || !id_cliente) {
        return response.error(
          req,
          res,
          'Los parámetros id_campana e id_cliente son requeridos',
          400
        );
      }

      const existe = await CampanaClientesService.verificarAsignacion(
        id_campana,
        id_cliente
      );

      return response.success(
        req,
        res,
        { existe },
        'Verificación completada'
      );
    } catch (error) {
      console.error('Error al verificar asignación:', error);
      return response.error(req, res, error.message, 500);
    }
  }
}

export default new CampanaClienteController();
