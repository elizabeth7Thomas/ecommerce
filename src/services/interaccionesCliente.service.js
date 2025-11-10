import InteraccionesCliente from '../models/interaccionesCliente.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

class InteraccionesClienteService {
  // CREATE - Crear nueva interacción
  async createInteraccion(interaccionData) {
    try {
      // Validar fecha de próxima acción
      if (interaccionData.fecha_proxima_accion && 
          new Date(interaccionData.fecha_proxima_accion) <= new Date()) {
        throw new Error('La fecha de próxima acción debe ser futura');
      }

      const interaccion = await InteraccionesCliente.create(interaccionData);
      return interaccion;
    } catch (error) {
      throw new Error(`Error al crear interacción: ${error.message}`);
    }
  }

  // READ - Obtener interacción por ID
  async getInteraccionById(idInteraccion) {
    try {
      const interaccion = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccion) {
        throw new Error('Interacción no encontrada');
      }
      return interaccion;
    } catch (error) {
      throw new Error(`Error al obtener interacción: ${error.message}`);
    }
  }

  // READ - Obtener todas las interacciones (con filtros)
  async getAllInteracciones(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        id_cliente, 
        id_usuario_asignado,
        tipo_interaccion,
        estado,
        fecha_desde,
        fecha_hasta,
        orderBy = 'fecha_interaccion',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (id_cliente) {
        whereClause.id_cliente = id_cliente;
      }
      
      if (id_usuario_asignado) {
        whereClause.id_usuario_asignado = id_usuario_asignado;
      }
      
      if (tipo_interaccion) {
        whereClause.tipo_interaccion = tipo_interaccion;
      }
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_interaccion = {};
        if (fecha_desde) {
          whereClause.fecha_interaccion[Op.gte] = new Date(fecha_desde);
        }
        if (fecha_hasta) {
          whereClause.fecha_interaccion[Op.lte] = new Date(fecha_hasta);
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener interacciones: ${error.message}`);
    }
  }

  // READ - Obtener interacciones por cliente
  async getInteraccionesByCliente(idCliente, options = {}) {
    try {
      const { page = 1, limit = 20, tipo_interaccion, estado } = options;
      
      const whereClause = { id_cliente: idCliente };
      
      if (tipo_interaccion) {
        whereClause.tipo_interaccion = tipo_interaccion;
      }
      
      if (estado) {
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_interaccion', 'DESC']]
      });

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener interacciones del cliente: ${error.message}`);
    }
  }

  // READ - Obtener interacciones por usuario asignado
  async getInteraccionesByUsuario(idUsuario, options = {}) {
    try {
      const { page = 1, limit = 20, estado } = options;
      
      const whereClause = { id_usuario_asignado: idUsuario };
      
      if (estado) {
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_interaccion', 'DESC']]
      });

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener interacciones del usuario: ${error.message}`);
    }
  }

  // READ - Obtener próximas acciones pendientes
  async getProximasAccionesPendientes(dias = 7) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const interacciones = await InteraccionesCliente.findAll({
        where: {
          estado: 'pendiente',
          fecha_proxima_accion: {
            [Op.between]: [new Date(), fechaLimite]
          }
        },
        order: [['fecha_proxima_accion', 'ASC']]
      });

      return interacciones;
    } catch (error) {
      throw new Error(`Error al obtener próximas acciones: ${error.message}`);
    }
  }

  // READ - Obtener interacciones vencidas (próximas acciones pasadas)
  async getInteraccionesVencidas() {
    try {
      const interacciones = await InteraccionesCliente.findAll({
        where: {
          estado: 'pendiente',
          fecha_proxima_accion: {
            [Op.lt]: new Date()
          }
        },
        order: [['fecha_proxima_accion', 'ASC']]
      });

      return interacciones;
    } catch (error) {
      throw new Error(`Error al obtener interacciones vencidas: ${error.message}`);
    }
  }

  // UPDATE - Actualizar interacción
  async updateInteraccion(idInteraccion, updateData) {
    try {
      // Validar fecha de próxima acción si se está actualizando
      if (updateData.fecha_proxima_accion && 
          new Date(updateData.fecha_proxima_accion) <= new Date()) {
        throw new Error('La fecha de próxima acción debe ser futura');
      }

      const [updated] = await InteraccionesCliente.update(updateData, {
        where: { id_interaccion: idInteraccion }
      });

      if (updated === 0) {
        throw new Error('Interacción no encontrada');
      }

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      throw new Error(`Error al actualizar interacción: ${error.message}`);
    }
  }

  // UPDATE - Cambiar estado de interacción
  async cambiarEstadoInteraccion(idInteraccion, nuevoEstado) {
    try {
      const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado no válido');
      }

      const [updated] = await InteraccionesCliente.update(
        { estado: nuevoEstado },
        { where: { id_interaccion: idInteraccion } }
      );

      if (updated === 0) {
        throw new Error('Interacción no encontrada');
      }

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      throw new Error(`Error al cambiar estado de interacción: ${error.message}`);
    }
  }

  // UPDATE - Marcar como completada
  async marcarComoCompletada(idInteraccion, resultado = null) {
    try {
      const updateData = { estado: 'completado' };
      
      if (resultado) {
        updateData.resultado = resultado;
      }

      const [updated] = await InteraccionesCliente.update(updateData, {
        where: { id_interaccion: idInteraccion }
      });

      if (updated === 0) {
        throw new Error('Interacción no encontrada');
      }

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      throw new Error(`Error al marcar como completada: ${error.message}`);
    }
  }

  // UPDATE - Asignar usuario
  async asignarUsuario(idInteraccion, idUsuario) {
    try {
      const [updated] = await InteraccionesCliente.update(
        { id_usuario_asignado: idUsuario },
        { where: { id_interaccion: idInteraccion } }
      );

      if (updated === 0) {
        throw new Error('Interacción no encontrada');
      }

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      throw new Error(`Error al asignar usuario: ${error.message}`);
    }
  }

  // UPDATE - Programar próxima acción
  async programarProximaAccion(idInteraccion, proximaAccion, fechaProximaAccion) {
    try {
      if (new Date(fechaProximaAccion) <= new Date()) {
        throw new Error('La fecha de próxima acción debe ser futura');
      }

      const [updated] = await InteraccionesCliente.update(
        { 
          proxima_accion: proximaAccion,
          fecha_proxima_accion: fechaProximaAccion,
          estado: 'pendiente'
        },
        { where: { id_interaccion: idInteraccion } }
      );

      if (updated === 0) {
        throw new Error('Interacción no encontrada');
      }

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      throw new Error(`Error al programar próxima acción: ${error.message}`);
    }
  }

  // DELETE - Eliminar interacción
  async deleteInteraccion(idInteraccion) {
    try {
      const deleted = await InteraccionesCliente.destroy({
        where: { id_interaccion: idInteraccion }
      });

      if (deleted === 0) {
        throw new Error('Interacción no encontrada');
      }

      return { message: 'Interacción eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar interacción: ${error.message}`);
    }
  }

  // DELETE - Eliminar interacciones por cliente
  async deleteInteraccionesByCliente(idCliente) {
    try {
      const deleted = await InteraccionesCliente.destroy({
        where: { id_cliente: idCliente }
      });

      return {
        message: `${deleted} interacción(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar interacciones del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas generales
  async getEstadisticasGenerales() {
    try {
      const total = await InteraccionesCliente.count();
      
      const porEstado = await InteraccionesCliente.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id_interaccion')), 'cantidad']
        ],
        group: ['estado']
      });

      const porTipo = await InteraccionesCliente.findAll({
        attributes: [
          'tipo_interaccion',
          [sequelize.fn('COUNT', sequelize.col('id_interaccion')), 'cantidad']
        ],
        group: ['tipo_interaccion']
      });

      const interaccionesEsteMes = await InteraccionesCliente.count({
        where: {
          fecha_interaccion: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      return {
        total,
        porEstado,
        porTipo,
        interaccionesEsteMes
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por cliente
  async getEstadisticasByCliente(idCliente) {
    try {
      const total = await InteraccionesCliente.count({
        where: { id_cliente: idCliente }
      });

      const ultimaInteraccion = await InteraccionesCliente.findOne({
        where: { id_cliente: idCliente },
        order: [['fecha_interaccion', 'DESC']]
      });

      const porTipo = await InteraccionesCliente.findAll({
        attributes: [
          'tipo_interaccion',
          [sequelize.fn('COUNT', sequelize.col('id_interaccion')), 'cantidad']
        ],
        where: { id_cliente: idCliente },
        group: ['tipo_interaccion']
      });

      return {
        total,
        ultimaInteraccion: ultimaInteraccion || null,
        porTipo
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por usuario
  async getEstadisticasByUsuario(idUsuario) {
    try {
      const total = await InteraccionesCliente.count({
        where: { id_usuario_asignado: idUsuario }
      });

      const completadas = await InteraccionesCliente.count({
        where: { 
          id_usuario_asignado: idUsuario,
          estado: 'completado'
        }
      });

      const pendientes = await InteraccionesCliente.count({
        where: { 
          id_usuario_asignado: idUsuario,
          estado: 'pendiente'
        }
      });

      return {
        total,
        completadas,
        pendientes,
        tasaCompletitud: total > 0 ? (completadas / total * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del usuario: ${error.message}`);
    }
  }

  // REPORTES - Obtener timeline de interacciones por cliente
  async getTimelineCliente(idCliente) {
    try {
      const interacciones = await InteraccionesCliente.findAll({
        where: { id_cliente: idCliente },
        order: [['fecha_interaccion', 'DESC']],
        limit: 50
      });

      return interacciones;
    } catch (error) {
      throw new Error(`Error al obtener timeline del cliente: ${error.message}`);
    }
  }
}

export default new InteraccionesClienteService();
