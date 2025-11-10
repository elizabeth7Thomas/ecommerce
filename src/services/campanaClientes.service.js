import CampanaClientes from '../models/campanaClientes.model.js';
import sequelize from '../config/database.js';

class CampanaClientesService {
  // CREATE - Asignar cliente a campaña
  async asignarClienteACampana(campanaClienteData) {
    try {
      // Verificar si ya existe la asignación
      const existe = await CampanaClientes.findOne({
        where: {
          id_campana: campanaClienteData.id_campana,
          id_cliente: campanaClienteData.id_cliente
        }
      });

      if (existe) {
        throw new Error('El cliente ya está asignado a esta campaña');
      }

      const campanaCliente = await CampanaClientes.create(campanaClienteData);
      return campanaCliente;
    } catch (error) {
      throw new Error(`Error al asignar cliente a campaña: ${error.message}`);
    }
  }

  // CREATE - Asignar múltiples clientes a una campaña
  async asignarMultiplesClientes(idCampana, clientesIds) {
    try {
      const asignaciones = [];
      
      for (const idCliente of clientesIds) {
        // Verificar si ya existe la asignación
        const existe = await CampanaClientes.findOne({
          where: { id_campana: idCampana, id_cliente: idCliente }
        });

        if (!existe) {
          const asignacion = await CampanaClientes.create({
            id_campana: idCampana,
            id_cliente: idCliente,
            estado_envio: 'pendiente'
          });
          asignaciones.push(asignacion);
        }
      }

      return {
        message: `${asignaciones.length} cliente(s) asignado(s) exitosamente`,
        asignaciones,
        totalAsignados: asignaciones.length
      };
    } catch (error) {
      throw new Error(`Error al asignar múltiples clientes: ${error.message}`);
    }
  }

  // READ - Obtener asignación específica
  async getAsignacion(idCampana, idCliente) {
    try {
      const asignacion = await CampanaClientes.findOne({
        where: {
          id_campana: idCampana,
          id_cliente: idCliente
        }
      });

      if (!asignacion) {
        throw new Error('Asignación no encontrada');
      }

      return asignacion;
    } catch (error) {
      throw new Error(`Error al obtener asignación: ${error.message}`);
    }
  }

  // READ - Obtener todos los clientes de una campaña
  async getClientesByCampana(idCampana, options = {}) {
    try {
      const { estado_envio, page = 1, limit = 50 } = options;
      
      const whereClause = { id_campana: idCampana };
      if (estado_envio) {
        whereClause.estado_envio = estado_envio;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await CampanaClientes.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_envio', 'DESC']]
      });

      return {
        clientes: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener clientes de la campaña: ${error.message}`);
    }
  }

  // READ - Obtener todas las campañas de un cliente
  async getCampanasByCliente(idCliente, options = {}) {
    try {
      const { estado_envio, page = 1, limit = 50 } = options;
      
      const whereClause = { id_cliente: idCliente };
      if (estado_envio) {
        whereClause.estado_envio = estado_envio;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await CampanaClientes.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_envio', 'DESC']]
      });

      return {
        campanas: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener campañas del cliente: ${error.message}`);
    }
  }

  // UPDATE - Actualizar estado de envío
  async actualizarEstadoEnvio(idCampana, idCliente, nuevoEstado) {
    try {
      const estadosValidos = ['pendiente', 'enviado', 'abierto', 'respondido', 'fallido'];
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado de envío no válido');
      }

      const updateData = { estado_envio: nuevoEstado };

      // Actualizar fechas según el estado
      if (nuevoEstado === 'enviado') {
        updateData.fecha_envio = new Date();
      } else if (nuevoEstado === 'abierto') {
        updateData.fecha_apertura = new Date();
      } else if (nuevoEstado === 'respondido') {
        updateData.fecha_respuesta = new Date();
      }

      const [updated] = await CampanaClientes.update(updateData, {
        where: {
          id_campana: idCampana,
          id_cliente: idCliente
        }
      });

      if (updated === 0) {
        throw new Error('Asignación no encontrada');
      }

      return await this.getAsignacion(idCampana, idCliente);
    } catch (error) {
      throw new Error(`Error al actualizar estado de envío: ${error.message}`);
    }
  }

  // UPDATE - Marcar como enviado
  async marcarComoEnviado(idCampana, idCliente) {
    return await this.actualizarEstadoEnvio(idCampana, idCliente, 'enviado');
  }

  // UPDATE - Marcar como abierto
  async marcarComoAbierto(idCampana, idCliente) {
    return await this.actualizarEstadoEnvio(idCampana, idCliente, 'abierto');
  }

  // UPDATE - Marcar como respondido
  async marcarComoRespondido(idCampana, idCliente) {
    return await this.actualizarEstadoEnvio(idCampana, idCliente, 'respondido');
  }

  // UPDATE - Marcar como fallido
  async marcarComoFallido(idCampana, idCliente) {
    return await this.actualizarEstadoEnvio(idCampana, idCliente, 'fallido');
  }

  // UPDATE - Actualizar notas
  async actualizarNotas(idCampana, idCliente, notas) {
    try {
      const [updated] = await CampanaClientes.update(
        { notas },
        {
          where: {
            id_campana: idCampana,
            id_cliente: idCliente
          }
        }
      );

      if (updated === 0) {
        throw new Error('Asignación no encontrada');
      }

      return await this.getAsignacion(idCampana, idCliente);
    } catch (error) {
      throw new Error(`Error al actualizar notas: ${error.message}`);
    }
  }

  // UPDATE - Actualizar asignación completa
  async updateAsignacion(idCampana, idCliente, updateData) {
    try {
      const [updated] = await CampanaClientes.update(updateData, {
        where: {
          id_campana: idCampana,
          id_cliente: idCliente
        }
      });

      if (updated === 0) {
        throw new Error('Asignación no encontrada');
      }

      return await this.getAsignacion(idCampana, idCliente);
    } catch (error) {
      throw new Error(`Error al actualizar asignación: ${error.message}`);
    }
  }

  // DELETE - Eliminar asignación
  async eliminarAsignacion(idCampana, idCliente) {
    try {
      const deleted = await CampanaClientes.destroy({
        where: {
          id_campana: idCampana,
          id_cliente: idCliente
        }
      });

      if (deleted === 0) {
        throw new Error('Asignación no encontrada');
      }

      return { message: 'Asignación eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar asignación: ${error.message}`);
    }
  }

  // DELETE - Eliminar todos los clientes de una campaña
  async eliminarClientesDeCampana(idCampana) {
    try {
      const deleted = await CampanaClientes.destroy({
        where: { id_campana: idCampana }
      });

      return {
        message: `${deleted} asignación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar clientes de la campaña: ${error.message}`);
    }
  }

  // DELETE - Eliminar todas las campañas de un cliente
  async eliminarCampanasDeCliente(idCliente) {
    try {
      const deleted = await CampanaClientes.destroy({
        where: { id_cliente: idCliente }
      });

      return {
        message: `${deleted} asignación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar campañas del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de una campaña
  async getEstadisticasCampana(idCampana) {
    try {
      const total = await CampanaClientes.count({
        where: { id_campana: idCampana }
      });

      const porEstado = await CampanaClientes.findAll({
        attributes: [
          'estado_envio',
          [sequelize.fn('COUNT', sequelize.col('id_cliente')), 'cantidad']
        ],
        where: { id_campana: idCampana },
        group: ['estado_envio']
      });

      const tasaApertura = total > 0 
        ? (porEstado.find(e => e.estado_envio === 'abierto')?.cantidad || 0) / total * 100
        : 0;

      const tasaRespuesta = total > 0 
        ? (porEstado.find(e => e.estado_envio === 'respondido')?.cantidad || 0) / total * 100
        : 0;

      return {
        totalClientes: total,
        porEstado,
        tasaApertura: Math.round(tasaApertura * 100) / 100,
        tasaRespuesta: Math.round(tasaRespuesta * 100) / 100,
        pendientes: porEstado.find(e => e.estado_envio === 'pendiente')?.cantidad || 0,
        enviados: porEstado.find(e => e.estado_envio === 'enviado')?.cantidad || 0,
        abiertos: porEstado.find(e => e.estado_envio === 'abierto')?.cantidad || 0,
        respondidos: porEstado.find(e => e.estado_envio === 'respondido')?.cantidad || 0,
        fallidos: porEstado.find(e => e.estado_envio === 'fallido')?.cantidad || 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de la campaña: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener clientes pendientes de envío
  async getClientesPendientes(idCampana) {
    try {
      const clientes = await CampanaClientes.findAll({
        where: {
          id_campana: idCampana,
          estado_envio: 'pendiente'
        },
        order: [['id_cliente', 'ASC']]
      });

      return clientes;
    } catch (error) {
      throw new Error(`Error al obtener clientes pendientes: ${error.message}`);
    }
  }

  // UTILIDAD - Verificar si existe asignación
  async verificarAsignacion(idCampana, idCliente) {
    try {
      const existe = await CampanaClientes.findOne({
        where: {
          id_campana: idCampana,
          id_cliente: idCliente
        }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar asignación: ${error.message}`);
    }
  }
}

export default new CampanaClientesService();
