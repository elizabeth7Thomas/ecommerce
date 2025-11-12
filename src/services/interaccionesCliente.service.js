import InteraccionesCliente from '../models/interaccionesCliente.model.js';
import { Cliente, Usuario } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Clase personalizada para errores de negocio
class InteraccionesClienteServiceError extends Error {
  constructor(message, code = 'INTERACCION_ERROR') {
    super(message);
    this.name = 'InteraccionesClienteServiceError';
    this.code = code;
  }
}

// Validadores privados
const Validadores = {
  fechaProximaAccionFutura(fecha) {
    if (!fecha) return true;
    const fechaProxima = new Date(fecha);
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    return fechaProxima > ahora;
  },

  tipoInteraccionValido(tipo) {
    const tipos = ['llamada', 'email', 'chat', 'reunion', 'nota', 'reclamo', 'consulta'];
    return tipos.includes(tipo);
  },

  estadoValido(estado) {
    const estados = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    return estados.includes(estado);
  },

  async clienteExiste(idCliente) {
    return await Cliente.findByPk(idCliente);
  },

  async usuarioExiste(idUsuario) {
    return await Usuario.findByPk(idUsuario);
  }
};

class InteraccionesClienteService {
  // CREATE - Crear nueva interacción
  async createInteraccion(interaccionData) {
    try {
      // Validaciones
      if (!interaccionData || Object.keys(interaccionData).length === 0) {
        throw new InteraccionesClienteServiceError(
          'Los datos de la interacción no pueden estar vacíos',
          'EMPTY_DATA'
        );
      }

      if (!interaccionData.id_cliente) {
        throw new InteraccionesClienteServiceError(
          'El ID del cliente es requerido',
          'MISSING_CLIENT_ID'
        );
      }

      if (!interaccionData.id_usuario_asignado) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario asignado es requerido',
          'MISSING_USER_ID'
        );
      }

      if (!interaccionData.tipo_interaccion) {
        throw new InteraccionesClienteServiceError(
          'El tipo de interacción es requerido',
          'MISSING_TYPE'
        );
      }

      if (!Validadores.tipoInteraccionValido(interaccionData.tipo_interaccion)) {
        throw new InteraccionesClienteServiceError(
          `Tipo de interacción no válido. Tipos aceptados: ${['llamada', 'email', 'chat', 'reunion', 'nota', 'reclamo', 'consulta'].join(', ')}`,
          'INVALID_TYPE'
        );
      }

      // Validar fechas
      if (interaccionData.fecha_proxima_accion && 
          !Validadores.fechaProximaAccionFutura(interaccionData.fecha_proxima_accion)) {
        throw new InteraccionesClienteServiceError(
          'La fecha de próxima acción debe ser en el futuro',
          'INVALID_DATE'
        );
      }

      // Validar existencia de cliente y usuario
      const clienteExiste = await Validadores.clienteExiste(interaccionData.id_cliente);
      if (!clienteExiste) {
        throw new InteraccionesClienteServiceError(
          `Cliente con ID ${interaccionData.id_cliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const usuarioExiste = await Validadores.usuarioExiste(interaccionData.id_usuario_asignado);
      if (!usuarioExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario con ID ${interaccionData.id_usuario_asignado} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

      // Si hay id_oportunidad, validar que sea número válido
      if (interaccionData.id_oportunidad && isNaN(interaccionData.id_oportunidad)) {
        throw new InteraccionesClienteServiceError(
          'El ID de oportunidad debe ser un número válido',
          'INVALID_OPPORTUNITY_ID'
        );
      }

      const interaccion = await InteraccionesCliente.create(interaccionData);
      return interaccion;
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al crear interacción: ${error.message}`,
        'CREATE_FAILED'
      );
    }
  }

  // READ - Obtener interacción por ID
  async getInteraccionById(idInteraccion) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      const interaccion = await InteraccionesCliente.findByPk(idInteraccion, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuarioAsignado' }
        ]
      });

      if (!interaccion) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      return interaccion;
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener interacción: ${error.message}`,
        'GET_FAILED'
      );
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

      // Validar parámetros
      if (page < 1 || limit < 1) {
        throw new InteraccionesClienteServiceError(
          'Page y limit deben ser mayores a 0',
          'INVALID_PARAMS'
        );
      }

      // Validar order
      if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
        throw new InteraccionesClienteServiceError(
          'El parámetro "order" debe ser ASC o DESC',
          'INVALID_ORDER'
        );
      }

      const whereClause = {};
      
      if (id_cliente) whereClause.id_cliente = id_cliente;
      if (id_usuario_asignado) whereClause.id_usuario_asignado = id_usuario_asignado;
      
      if (tipo_interaccion) {
        if (!Validadores.tipoInteraccionValido(tipo_interaccion)) {
          throw new InteraccionesClienteServiceError(
            `Tipo de interacción no válido: ${tipo_interaccion}`,
            'INVALID_TYPE'
          );
        }
        whereClause.tipo_interaccion = tipo_interaccion;
      }
      
      if (estado) {
        if (!Validadores.estadoValido(estado)) {
          throw new InteraccionesClienteServiceError(
            `Estado no válido: ${estado}`,
            'INVALID_STATE'
          );
        }
        whereClause.estado = estado;
      }
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_interaccion = {};
        if (fecha_desde) {
          const fechaDesdeDate = new Date(fecha_desde);
          if (isNaN(fechaDesdeDate.getTime())) {
            throw new InteraccionesClienteServiceError(
              'Formato de fecha_desde inválido. Use formato ISO (YYYY-MM-DD)',
              'INVALID_DATE_FORMAT'
            );
          }
          whereClause.fecha_interaccion[Op.gte] = fechaDesdeDate;
        }
        if (fecha_hasta) {
          const fechaHastaDate = new Date(fecha_hasta);
          if (isNaN(fechaHastaDate.getTime())) {
            throw new InteraccionesClienteServiceError(
              'Formato de fecha_hasta inválido. Use formato ISO (YYYY-MM-DD)',
              'INVALID_DATE_FORMAT'
            );
          }
          whereClause.fecha_interaccion[Op.lte] = fechaHastaDate;
        }
        if (fecha_desde && fecha_hasta && new Date(fecha_desde) > new Date(fecha_hasta)) {
          throw new InteraccionesClienteServiceError(
            'fecha_desde no puede ser mayor que fecha_hasta',
            'INVALID_DATE_RANGE'
          );
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]],
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuarioAsignado' }
        ]
      });

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener interacciones: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener interacciones por cliente
  async getInteraccionesByCliente(idCliente, options = {}) {
    try {
      if (!idCliente) {
        throw new InteraccionesClienteServiceError(
          'El ID del cliente es requerido',
          'MISSING_CLIENT_ID'
        );
      }

      const clienteExiste = await Validadores.clienteExiste(idCliente);
      if (!clienteExiste) {
        throw new InteraccionesClienteServiceError(
          `Cliente con ID ${idCliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const { page = 1, limit = 20, tipo_interaccion, estado } = options;
      
      const whereClause = { id_cliente: idCliente };
      
      if (tipo_interaccion) {
        if (!Validadores.tipoInteraccionValido(tipo_interaccion)) {
          throw new InteraccionesClienteServiceError(
            `Tipo de interacción no válido: ${tipo_interaccion}`,
            'INVALID_TYPE'
          );
        }
        whereClause.tipo_interaccion = tipo_interaccion;
      }
      
      if (estado) {
        if (!Validadores.estadoValido(estado)) {
          throw new InteraccionesClienteServiceError(
            `Estado no válido: ${estado}`,
            'INVALID_STATE'
          );
        }
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_interaccion', 'DESC']]
      });

      if (count === 0) {
        throw new InteraccionesClienteServiceError(
          `No hay interacciones registradas para el cliente ${idCliente}`,
          'NO_INTERACTIONS'
        );
      }

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener interacciones del cliente: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener interacciones por usuario asignado
  async getInteraccionesByUsuario(idUsuario, options = {}) {
    try {
      if (!idUsuario) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario es requerido',
          'MISSING_USER_ID'
        );
      }

      const usuarioExiste = await Validadores.usuarioExiste(idUsuario);
      if (!usuarioExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario con ID ${idUsuario} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

      const { page = 1, limit = 20, estado } = options;
      
      const whereClause = { id_usuario_asignado: idUsuario };
      
      if (estado) {
        if (!Validadores.estadoValido(estado)) {
          throw new InteraccionesClienteServiceError(
            `Estado no válido: ${estado}`,
            'INVALID_STATE'
          );
        }
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await InteraccionesCliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_interaccion', 'DESC']]
      });

      if (count === 0) {
        throw new InteraccionesClienteServiceError(
          `No hay interacciones asignadas al usuario ${idUsuario}`,
          'NO_INTERACTIONS'
        );
      }

      return {
        interacciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener interacciones del usuario: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener próximas acciones pendientes
  async getProximasAccionesPendientes(dias = 7) {
    try {
      if (dias < 1) {
        throw new InteraccionesClienteServiceError(
          'El número de días debe ser mayor a 0',
          'INVALID_DAYS'
        );
      }

      const ahora = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const interacciones = await InteraccionesCliente.findAll({
        where: {
          estado: 'pendiente',
          fecha_proxima_accion: {
            [Op.between]: [ahora, fechaLimite]
          }
        },
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuarioAsignado' }
        ],
        order: [['fecha_proxima_accion', 'ASC']]
      });

      return {
        interacciones,
        total: interacciones.length,
        periodoDias: dias,
        proximaDesde: ahora,
        proximaHasta: fechaLimite
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener próximas acciones: ${error.message}`,
        'GET_FAILED'
      );
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
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuarioAsignado' }
        ],
        order: [['fecha_proxima_accion', 'ASC']]
      });

      return {
        interacciones,
        total: interacciones.length,
        diasAtrasadas: interacciones.map(i => ({
          id: i.id_interaccion,
          diasAtras: Math.floor((new Date() - new Date(i.fecha_proxima_accion)) / (1000 * 60 * 60 * 24))
        }))
      };
    } catch (error) {
      throw new InteraccionesClienteServiceError(
        `Error al obtener interacciones vencidas: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // UPDATE - Actualizar interacción
  async updateInteraccion(idInteraccion, updateData) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new InteraccionesClienteServiceError(
          'Los datos a actualizar no pueden estar vacíos',
          'EMPTY_DATA'
        );
      }

      // Obtener la interacción actual
      const interaccionActual = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccionActual) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      // Validar cambios
      if (updateData.tipo_interaccion && !Validadores.tipoInteraccionValido(updateData.tipo_interaccion)) {
        throw new InteraccionesClienteServiceError(
          `Tipo de interacción no válido: ${updateData.tipo_interaccion}`,
          'INVALID_TYPE'
        );
      }

      if (updateData.estado && !Validadores.estadoValido(updateData.estado)) {
        throw new InteraccionesClienteServiceError(
          `Estado no válido: ${updateData.estado}`,
          'INVALID_STATE'
        );
      }

      if (updateData.fecha_proxima_accion && 
          !Validadores.fechaProximaAccionFutura(updateData.fecha_proxima_accion)) {
        throw new InteraccionesClienteServiceError(
          'La fecha de próxima acción debe ser en el futuro',
          'INVALID_DATE'
        );
      }

      if (updateData.id_usuario_asignado) {
        const usuarioExiste = await Validadores.usuarioExiste(updateData.id_usuario_asignado);
        if (!usuarioExiste) {
          throw new InteraccionesClienteServiceError(
            `Usuario con ID ${updateData.id_usuario_asignado} no encontrado`,
            'USER_NOT_FOUND'
          );
        }
      }

      await interaccionActual.update(updateData);
      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al actualizar interacción: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  // UPDATE - Cambiar estado de interacción
  async cambiarEstadoInteraccion(idInteraccion, nuevoEstado) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      if (!nuevoEstado) {
        throw new InteraccionesClienteServiceError(
          'El nuevo estado es requerido',
          'MISSING_STATE'
        );
      }

      if (!Validadores.estadoValido(nuevoEstado)) {
        throw new InteraccionesClienteServiceError(
          `Estado no válido. Estados aceptados: ${['pendiente', 'en_proceso', 'completado', 'cancelado'].join(', ')}`,
          'INVALID_STATE'
        );
      }

      const interaccion = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccion) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      if (interaccion.estado === nuevoEstado) {
        throw new InteraccionesClienteServiceError(
          `La interacción ya tiene el estado '${nuevoEstado}'`,
          'SAME_STATE'
        );
      }

      await interaccion.update({ estado: nuevoEstado });
      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al cambiar estado: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  // UPDATE - Marcar como completada
  async marcarComoCompletada(idInteraccion, resultado = null) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      const interaccion = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccion) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      const updateData = { estado: 'completado' };
      if (resultado) {
        updateData.resultado = resultado;
      }

      await interaccion.update(updateData);
      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al marcar como completada: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  // UPDATE - Asignar usuario
  async asignarUsuario(idInteraccion, idUsuario) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      if (!idUsuario) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario es requerido',
          'MISSING_USER_ID'
        );
      }

      const interaccion = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccion) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      const usuarioExiste = await Validadores.usuarioExiste(idUsuario);
      if (!usuarioExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario con ID ${idUsuario} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

      if (interaccion.id_usuario_asignado === idUsuario) {
        throw new InteraccionesClienteServiceError(
          `La interacción ya está asignada al usuario ${idUsuario}`,
          'SAME_USER'
        );
      }

      await interaccion.update({ id_usuario_asignado: idUsuario });
      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al asignar usuario: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  // UPDATE - Programar próxima acción
  async programarProximaAccion(idInteraccion, proximaAccion, fechaProximaAccion) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      if (!proximaAccion || proximaAccion.trim() === '') {
        throw new InteraccionesClienteServiceError(
          'La próxima acción no puede estar vacía',
          'EMPTY_ACTION'
        );
      }

      if (!fechaProximaAccion) {
        throw new InteraccionesClienteServiceError(
          'La fecha de próxima acción es requerida',
          'MISSING_DATE'
        );
      }

      if (!Validadores.fechaProximaAccionFutura(fechaProximaAccion)) {
        throw new InteraccionesClienteServiceError(
          'La fecha de próxima acción debe ser en el futuro',
          'INVALID_DATE'
        );
      }

      const interaccion = await InteraccionesCliente.findByPk(idInteraccion);
      if (!interaccion) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      await interaccion.update({
        proxima_accion: proximaAccion,
        fecha_proxima_accion: fechaProximaAccion,
        estado: 'pendiente'
      });

      return await this.getInteraccionById(idInteraccion);
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al programar próxima acción: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  // DELETE - Eliminar interacción
  async deleteInteraccion(idInteraccion) {
    try {
      if (!idInteraccion) {
        throw new InteraccionesClienteServiceError(
          'El ID de la interacción es requerido',
          'MISSING_ID'
        );
      }

      const deleted = await InteraccionesCliente.destroy({
        where: { id_interaccion: idInteraccion }
      });

      if (deleted === 0) {
        throw new InteraccionesClienteServiceError(
          `Interacción con ID ${idInteraccion} no encontrada`,
          'NOT_FOUND'
        );
      }

      return { 
        message: 'Interacción eliminada exitosamente',
        id_eliminada: idInteraccion
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al eliminar interacción: ${error.message}`,
        'DELETE_FAILED'
      );
    }
  }

  // DELETE - Eliminar interacciones por cliente
  async deleteInteraccionesByCliente(idCliente) {
    try {
      if (!idCliente) {
        throw new InteraccionesClienteServiceError(
          'El ID del cliente es requerido',
          'MISSING_CLIENT_ID'
        );
      }

      const clienteExiste = await Validadores.clienteExiste(idCliente);
      if (!clienteExiste) {
        throw new InteraccionesClienteServiceError(
          `Cliente con ID ${idCliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const deleted = await InteraccionesCliente.destroy({
        where: { id_cliente: idCliente }
      });

      return {
        message: `${deleted} interacción(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted,
        id_cliente: idCliente
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al eliminar interacciones del cliente: ${error.message}`,
        'DELETE_FAILED'
      );
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
        group: ['estado'],
        raw: true
      });

      const porTipo = await InteraccionesCliente.findAll({
        attributes: [
          'tipo_interaccion',
          [sequelize.fn('COUNT', sequelize.col('id_interaccion')), 'cantidad']
        ],
        group: ['tipo_interaccion'],
        raw: true
      });

      const ahora = new Date();
      const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const interaccionesEsteMes = await InteraccionesCliente.count({
        where: {
          fecha_interaccion: {
            [Op.gte]: primerDiaDelMes
          }
        }
      });

      const ultimaInteraccion = await InteraccionesCliente.findOne({
        order: [['fecha_interaccion', 'DESC']]
      });

      return {
        total,
        interaccionesEsteMes,
        porEstado: Object.fromEntries(porEstado.map(e => [e.estado, parseInt(e.cantidad)])),
        porTipo: Object.fromEntries(porTipo.map(t => [t.tipo_interaccion, parseInt(t.cantidad)])),
        ultimaInteraccion: ultimaInteraccion ? ultimaInteraccion.fecha_interaccion : null
      };
    } catch (error) {
      throw new InteraccionesClienteServiceError(
        `Error al obtener estadísticas: ${error.message}`,
        'STATS_FAILED'
      );
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por cliente
  async getEstadisticasByCliente(idCliente) {
    try {
      if (!idCliente) {
        throw new InteraccionesClienteServiceError(
          'El ID del cliente es requerido',
          'MISSING_CLIENT_ID'
        );
      }

      const clienteExiste = await Validadores.clienteExiste(idCliente);
      if (!clienteExiste) {
        throw new InteraccionesClienteServiceError(
          `Cliente con ID ${idCliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

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
        group: ['tipo_interaccion'],
        raw: true
      });

      const porEstado = await InteraccionesCliente.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id_interaccion')), 'cantidad']
        ],
        where: { id_cliente: idCliente },
        group: ['estado'],
        raw: true
      });

      return {
        total,
        ultimaInteraccion: ultimaInteraccion ? ultimaInteraccion.fecha_interaccion : null,
        porTipo: Object.fromEntries(porTipo.map(t => [t.tipo_interaccion, parseInt(t.cantidad)])),
        porEstado: Object.fromEntries(porEstado.map(e => [e.estado, parseInt(e.cantidad)]))
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener estadísticas del cliente: ${error.message}`,
        'STATS_FAILED'
      );
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por usuario
  async getEstadisticasByUsuario(idUsuario) {
    try {
      if (!idUsuario) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario es requerido',
          'MISSING_USER_ID'
        );
      }

      const usuarioExiste = await Validadores.usuarioExiste(idUsuario);
      if (!usuarioExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario con ID ${idUsuario} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

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

      const enProceso = await InteraccionesCliente.count({
        where: { 
          id_usuario_asignado: idUsuario,
          estado: 'en_proceso'
        }
      });

      return {
        total,
        completadas,
        pendientes,
        enProceso,
        tasaCompletitud: total > 0 ? parseFloat((completadas / total * 100).toFixed(2)) : 0,
        efectividad: total > 0 ? parseFloat(((completadas + enProceso) / total * 100).toFixed(2)) : 0
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener estadísticas del usuario: ${error.message}`,
        'STATS_FAILED'
      );
    }
  }

  // REPORTES - Obtener timeline de interacciones por cliente
  async getTimelineCliente(idCliente, limite = 50) {
    try {
      if (!idCliente) {
        throw new InteraccionesClienteServiceError(
          'El ID del cliente es requerido',
          'MISSING_CLIENT_ID'
        );
      }

      if (limite < 1) {
        throw new InteraccionesClienteServiceError(
          'El límite debe ser mayor a 0',
          'INVALID_LIMIT'
        );
      }

      const clienteExiste = await Validadores.clienteExiste(idCliente);
      if (!clienteExiste) {
        throw new InteraccionesClienteServiceError(
          `Cliente con ID ${idCliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const interacciones = await InteraccionesCliente.findAll({
        where: { id_cliente: idCliente },
        include: [
          { model: Usuario, as: 'usuarioAsignado' }
        ],
        order: [['fecha_interaccion', 'DESC']],
        limit: parseInt(limite)
      });

      return {
        timeline: interacciones,
        total: interacciones.length,
        idCliente
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al obtener timeline del cliente: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // MÉTODOS AVANZADOS - Reasignar interacciones
  async reasignarInteracciones(idUsuarioActual, idUsuarioNuevo, filtro = {}) {
    try {
      if (!idUsuarioActual) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario actual es requerido',
          'MISSING_USER_ID'
        );
      }

      if (!idUsuarioNuevo) {
        throw new InteraccionesClienteServiceError(
          'El ID del usuario nuevo es requerido',
          'MISSING_USER_ID'
        );
      }

      if (idUsuarioActual === idUsuarioNuevo) {
        throw new InteraccionesClienteServiceError(
          'Los usuarios no pueden ser iguales',
          'SAME_USER'
        );
      }

      const usuarioActualExiste = await Validadores.usuarioExiste(idUsuarioActual);
      if (!usuarioActualExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario actual con ID ${idUsuarioActual} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

      const usuarioNuevoExiste = await Validadores.usuarioExiste(idUsuarioNuevo);
      if (!usuarioNuevoExiste) {
        throw new InteraccionesClienteServiceError(
          `Usuario nuevo con ID ${idUsuarioNuevo} no encontrado`,
          'USER_NOT_FOUND'
        );
      }

      const whereClause = { id_usuario_asignado: idUsuarioActual };

      // Aplicar filtros adicionales si existen
      if (filtro.estado) {
        whereClause.estado = filtro.estado;
      }

      if (filtro.tipo_interaccion) {
        whereClause.tipo_interaccion = filtro.tipo_interaccion;
      }

      const [actualizadas] = await InteraccionesCliente.update(
        { id_usuario_asignado: idUsuarioNuevo },
        { where: whereClause }
      );

      return {
        message: `${actualizadas} interacción(es) reasignada(s) exitosamente`,
        totalReasignadas: actualizadas,
        deUsuario: idUsuarioActual,
        aUsuario: idUsuarioNuevo,
        filtrosAplicados: filtro
      };
    } catch (error) {
      if (error instanceof InteraccionesClienteServiceError) {
        throw error;
      }
      throw new InteraccionesClienteServiceError(
        `Error al reasignar interacciones: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }
}

export default new InteraccionesClienteService();
