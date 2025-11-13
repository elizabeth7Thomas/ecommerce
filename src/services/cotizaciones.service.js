import Cotizaciones from '../models/cotizaciones.model.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
class CotizacionesService {
  // CREATE - Crear nueva cotización
  async createCotizacion(cotizacionData) {
    try {
      // Validar fecha de expiración
      if (cotizacionData.fecha_expiracion && 
          new Date(cotizacionData.fecha_expiracion) <= new Date()) {
        throw new Error('La fecha de expiración debe ser futura');
      }

      // Generar número de cotización si no se proporciona
      if (!cotizacionData.numero_cotizacion) {
        cotizacionData.numero_cotizacion = await this.generarNumeroCotizacion();
      }

      const cotizacion = await Cotizaciones.create(cotizacionData);
      return cotizacion;
    } catch (error) {
      throw new Error(`Error al crear cotización: ${error.message}`);
    }
  }

  // READ - Obtener cotización por ID
  async getCotizacionById(idCotizacion) {
    try {
      const cotizacion = await Cotizaciones.findByPk(idCotizacion);
      if (!cotizacion) {
        throw new Error('Cotización no encontrada');
      }
      return cotizacion;
    } catch (error) {
      throw new Error(`Error al obtener cotización: ${error.message}`);
    }
  }

  // READ - Obtener cotización por número
  async getCotizacionByNumero(numeroCotizacion) {
    try {
      const cotizacion = await Cotizaciones.findOne({
        where: { numero_cotizacion: numeroCotizacion }
      });

      if (!cotizacion) {
        throw new Error('Cotización no encontrada');
      }

      return cotizacion;
    } catch (error) {
      throw new Error(`Error al obtener cotización: ${error.message}`);
    }
  }

  // READ - Obtener todas las cotizaciones (con filtros)
  async getAllCotizaciones(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        id_cliente, 
        id_usuario_creador,
        estado,
        fecha_desde,
        fecha_hasta,
        orderBy = 'fecha_creacion',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (id_cliente) {
        whereClause.id_cliente = id_cliente;
      }
      
      if (id_usuario_creador) {
        whereClause.id_usuario_creador = id_usuario_creador;
      }
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_creacion = {};
        if (fecha_desde) {
          whereClause.fecha_creacion[Op.gte] = new Date(fecha_desde);
        }
        if (fecha_hasta) {
          whereClause.fecha_creacion[Op.lte] = new Date(fecha_hasta);
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Cotizaciones.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        cotizaciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones: ${error.message}`);
    }
  }

  // READ - Obtener cotizaciones por cliente
  async getCotizacionesByCliente(idCliente, options = {}) {
    try {
      const { page = 1, limit = 20, estado } = options;
      
      const whereClause = { id_cliente: idCliente };
      
      if (estado) {
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Cotizaciones.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_creacion', 'DESC']]
      });

      return {
        cotizaciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones del cliente: ${error.message}`);
    }
  }

  // READ - Obtener cotizaciones por usuario creador
  async getCotizacionesByUsuario(idUsuario, options = {}) {
    try {
      const { page = 1, limit = 20, estado } = options;
      
      const whereClause = { id_usuario_creador: idUsuario };
      
      if (estado) {
        whereClause.estado = estado;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Cotizaciones.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_creacion', 'DESC']]
      });

      return {
        cotizaciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones del usuario: ${error.message}`);
    }
  }

  // READ - Obtener cotizaciones próximas a expirar
  async getCotizacionesProximasExpiracion(dias = 7) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const cotizaciones = await Cotizaciones.findAll({
        where: {
          estado: 'enviada',
          fecha_expiracion: {
            [Op.between]: [new Date(), fechaLimite]
          }
        },
        order: [['fecha_expiracion', 'ASC']]
      });

      return cotizaciones;
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones próximas a expirar: ${error.message}`);
    }
  }

  // READ - Obtener cotizaciones expiradas
  async getCotizacionesExpiradas() {
    try {
      const cotizaciones = await Cotizaciones.findAll({
        where: {
          estado: 'enviada',
          fecha_expiracion: {
            [Op.lt]: new Date()
          }
        },
        order: [['fecha_expiracion', 'ASC']]
      });

      return cotizaciones;
    } catch (error) {
      throw new Error(`Error al obtener cotizaciones expiradas: ${error.message}`);
    }
  }

  // UPDATE - Actualizar cotización
  async updateCotizacion(idCotizacion, updateData) {
    try {
      // Validar fecha de expiración si se está actualizando
      if (updateData.fecha_expiracion && 
          new Date(updateData.fecha_expiracion) <= new Date()) {
        throw new Error('La fecha de expiración debe ser futura');
      }

      const [updated] = await Cotizaciones.update(updateData, {
        where: { id_cotizacion: idCotizacion }
      });

      if (updated === 0) {
        throw new Error('Cotización no encontrada');
      }

      return await this.getCotizacionById(idCotizacion);
    } catch (error) {
      throw new Error(`Error al actualizar cotización: ${error.message}`);
    }
  }

  // UPDATE - Cambiar estado de cotización
  async cambiarEstadoCotizacion(idCotizacion, nuevoEstado) {
    try {
      const estadosValidos = ['borrador', 'enviada', 'aceptada', 'rechazada', 'expirada'];
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado no válido');
      }

      const [updated] = await Cotizaciones.update(
        { estado: nuevoEstado },
        { where: { id_cotizacion: idCotizacion } }
      );

      if (updated === 0) {
        throw new Error('Cotización no encontrada');
      }

      return await this.getCotizacionById(idCotizacion);
    } catch (error) {
      throw new Error(`Error al cambiar estado de cotización: ${error.message}`);
    }
  }

  // UPDATE - Marcar como enviada
  async marcarComoEnviada(idCotizacion) {
    return await this.cambiarEstadoCotizacion(idCotizacion, 'enviada');
  }

  // UPDATE - Marcar como aceptada
  async marcarComoAceptada(idCotizacion) {
    return await this.cambiarEstadoCotizacion(idCotizacion, 'aceptada');
  }

  // UPDATE - Marcar como rechazada
  async marcarComoRechazada(idCotizacion) {
    return await this.cambiarEstadoCotizacion(idCotizacion, 'rechazada');
  }

  // UPDATE - Marcar como expirada
  async marcarComoExpirada(idCotizacion) {
    return await this.cambiarEstadoCotizacion(idCotizacion, 'expirada');
  }

  // UPDATE - Actualizar montos de la cotización
  async actualizarMontos(idCotizacion, subtotal, impuestos, total) {
    try {
      const [updated] = await Cotizaciones.update(
        { 
          subtotal: subtotal,
          impuestos: impuestos,
          total: total
        },
        { where: { id_cotizacion: idCotizacion } }
      );

      if (updated === 0) {
        throw new Error('Cotización no encontrada');
      }

      return await this.getCotizacionById(idCotizacion);
    } catch (error) {
      throw new Error(`Error al actualizar montos: ${error.message}`);
    }
  }

  // UPDATE - Actualizar notas y términos
  async actualizarNotasTerminos(idCotizacion, notas, terminosCondiciones) {
    try {
      const [updated] = await Cotizaciones.update(
        { 
          notas: notas,
          terminos_condiciones: terminosCondiciones
        },
        { where: { id_cotizacion: idCotizacion } }
      );

      if (updated === 0) {
        throw new Error('Cotización no encontrada');
      }

      return await this.getCotizacionById(idCotizacion);
    } catch (error) {
      throw new Error(`Error al actualizar notas y términos: ${error.message}`);
    }
  }

  // DELETE - Eliminar cotización
  async deleteCotizacion(idCotizacion) {
    try {
      const deleted = await Cotizaciones.destroy({
        where: { id_cotizacion: idCotizacion }
      });

      if (deleted === 0) {
        throw new Error('Cotización no encontrada');
      }

      return { message: 'Cotización eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar cotización: ${error.message}`);
    }
  }

  // DELETE - Eliminar cotizaciones por cliente
  async deleteCotizacionesByCliente(idCliente) {
    try {
      const deleted = await Cotizaciones.destroy({
        where: { id_cliente: idCliente }
      });

      return {
        message: `${deleted} cotización(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar cotizaciones del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas generales
  async getEstadisticasGenerales() {
    try {
      const total = await Cotizaciones.count();
      
      const porEstado = await Cotizaciones.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id_cotizacion')), 'cantidad']
        ],
        group: ['estado']
      });

      const totalIngresos = await Cotizaciones.sum('total', {
        where: { estado: 'aceptada' }
      });

      const cotizacionesEsteMes = await Cotizaciones.count({
        where: {
          fecha_creacion: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      return {
        total,
        porEstado,
        totalIngresos: totalIngresos || 0,
        cotizacionesEsteMes,
        tasaAceptacion: total > 0 ? 
          ((porEstado.find(e => e.estado === 'aceptada')?.cantidad || 0) / total * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por cliente
  async getEstadisticasByCliente(idCliente) {
    try {
      const total = await Cotizaciones.count({
        where: { id_cliente: idCliente }
      });

      const aceptadas = await Cotizaciones.count({
        where: { 
          id_cliente: idCliente,
          estado: 'aceptada'
        }
      });

      const totalIngresos = await Cotizaciones.sum('total', {
        where: { 
          id_cliente: idCliente,
          estado: 'aceptada'
        }
      });

      const ultimaCotizacion = await Cotizaciones.findOne({
        where: { id_cliente: idCliente },
        order: [['fecha_creacion', 'DESC']]
      });

      return {
        total,
        aceptadas,
        rechazadas: await Cotizaciones.count({
          where: { 
            id_cliente: idCliente,
            estado: 'rechazada'
          }
        }),
        totalIngresos: totalIngresos || 0,
        tasaAceptacion: total > 0 ? (aceptadas / total * 100).toFixed(2) : 0,
        ultimaCotizacion: ultimaCotizacion || null
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas por usuario
  async getEstadisticasByUsuario(idUsuario) {
    try {
      const total = await Cotizaciones.count({
        where: { id_usuario_creador: idUsuario }
      });

      const aceptadas = await Cotizaciones.count({
        where: { 
          id_usuario_creador: idUsuario,
          estado: 'aceptada'
        }
      });

      const totalIngresos = await Cotizaciones.sum('total', {
        where: { 
          id_usuario_creador: idUsuario,
          estado: 'aceptada'
        }
      });

      return {
        total,
        aceptadas,
        tasaAceptacion: total > 0 ? (aceptadas / total * 100).toFixed(2) : 0,
        totalIngresos: totalIngresos || 0,
        ingresosPromedio: total > 0 ? (totalIngresos / total).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del usuario: ${error.message}`);
    }
  }

  // UTILIDAD - Generar número de cotización automático
  async generarNumeroCotizacion() {
    try {
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      
      // Buscar la última cotización del mes
      const ultimaCotizacion = await Cotizaciones.findOne({
        where: {
          numero_cotizacion: {
            [Op.like]: `COT-${año}${mes}-%`
          }
        },
        order: [['numero_cotizacion', 'DESC']]
      });

      let consecutivo = 1;
      if (ultimaCotizacion) {
        const partes = ultimaCotizacion.numero_cotizacion.split('-');
        consecutivo = parseInt(partes[2]) + 1;
      }

      return `COT-${año}${mes}-${String(consecutivo).padStart(4, '0')}`;
    } catch (error) {
      throw new Error(`Error al generar número de cotización: ${error.message}`);
    }
  }

  // UTILIDAD - Verificar si número de cotización existe
  async verificarNumeroCotizacion(numeroCotizacion) {
    try {
      const existe = await Cotizaciones.findOne({
        where: { numero_cotizacion: numeroCotizacion }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar número de cotización: ${error.message}`);
    }
  }

  // UTILIDAD - Actualizar automáticamente estado de cotizaciones expiradas
  async actualizarEstadosExpirados() {
    try {
      const [updated] = await Cotizaciones.update(
        { estado: 'expirada' },
        {
          where: {
            estado: 'enviada',
            fecha_expiracion: {
              [Op.lt]: new Date()
            }
          }
        }
      );

      return {
        message: `${updated} cotización(es) marcada(s) como expirada(s)`,
        actualizadas: updated
      };
    } catch (error) {
      throw new Error(`Error al actualizar estados expirados: ${error.message}`);
    }
  }
}

export default new CotizacionesService();