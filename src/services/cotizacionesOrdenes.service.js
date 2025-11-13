import Cotizaciones_Ordenes from '../models/cotizacionesOrdenes.model.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

class CotizacionesOrdenesService {
  // CREATE - Crear relación cotización-orden
  async createCotizacionOrden(cotizacionOrdenData) {
    try {
      // Verificar si ya existe la relación
      const existe = await Cotizaciones_Ordenes.findOne({
        where: {
          id_cotizacion: cotizacionOrdenData.id_cotizacion,
          id_orden: cotizacionOrdenData.id_orden
        }
      });

      if (existe) {
        throw new Error('La cotización ya está relacionada con esta orden');
      }

      const cotizacionOrden = await Cotizaciones_Ordenes.create(cotizacionOrdenData);
      return cotizacionOrden;
    } catch (error) {
      throw new Error(`Error al crear relación cotización-orden: ${error.message}`);
    }
  }

  // CREATE - Convertir cotización en orden
  async convertirCotizacionEnOrden(idCotizacion, idOrden) {
    try {
      const relacion = await this.createCotizacionOrden({
        id_cotizacion: idCotizacion,
        id_orden: idOrden,
        fecha_conversion: new Date()
      });

      return {
        relacion,
        message: 'Cotización convertida en orden exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al convertir cotización en orden: ${error.message}`);
    }
  }

  // READ - Obtener relación por IDs
  async getRelacionByIds(idCotizacion, idOrden) {
    try {
      const relacion = await Cotizaciones_Ordenes.findOne({
        where: {
          id_cotizacion: idCotizacion,
          id_orden: idOrden
        }
      });

      if (!relacion) {
        throw new Error('Relación no encontrada');
      }

      return relacion;
    } catch (error) {
      throw new Error(`Error al obtener relación: ${error.message}`);
    }
  }

  // READ - Obtener orden por cotización
  async getOrdenByCotizacion(idCotizacion) {
    try {
      const relacion = await Cotizaciones_Ordenes.findOne({
        where: { id_cotizacion: idCotizacion }
      });

      if (!relacion) {
        throw new Error('No se encontró orden para esta cotización');
      }

      return relacion;
    } catch (error) {
      throw new Error(`Error al obtener orden por cotización: ${error.message}`);
    }
  }

  // READ - Obtener cotización por orden
  async getCotizacionByOrden(idOrden) {
    try {
      const relacion = await Cotizaciones_Ordenes.findOne({
        where: { id_orden: idOrden }
      });

      if (!relacion) {
        throw new Error('No se encontró cotización para esta orden');
      }

      return relacion;
    } catch (error) {
      throw new Error(`Error al obtener cotización por orden: ${error.message}`);
    }
  }

  // READ - Obtener todas las relaciones (con filtros)
  async getAllRelaciones(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 50,
        fecha_desde,
        fecha_hasta,
        orderBy = 'fecha_conversion',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_conversion = {};
        if (fecha_desde) {
          whereClause.fecha_conversion[Op.gte] = new Date(fecha_desde);
        }
        if (fecha_hasta) {
          whereClause.fecha_conversion[Op.lte] = new Date(fecha_hasta);
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Cotizaciones_Ordenes.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        relaciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener relaciones: ${error.message}`);
    }
  }

  // READ - Obtener conversiones por rango de fechas
  async getConversionesByFecha(fechaInicio, fechaFin) {
    try {
      const conversiones = await Cotizaciones_Ordenes.findAll({
        where: {
          fecha_conversion: {
            [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
          }
        },
        order: [['fecha_conversion', 'ASC']]
      });

      return conversiones;
    } catch (error) {
      throw new Error(`Error al obtener conversiones por fecha: ${error.message}`);
    }
  }

  // READ - Obtener conversiones recientes
  async getConversionesRecientes(dias = 30) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);

      const conversiones = await Cotizaciones_Ordenes.findAll({
        where: {
          fecha_conversion: {
            [Op.gte]: fechaLimite
          }
        },
        order: [['fecha_conversion', 'DESC']]
      });

      return conversiones;
    } catch (error) {
      throw new Error(`Error al obtener conversiones recientes: ${error.message}`);
    }
  }

  // UPDATE - Actualizar fecha de conversión
  async actualizarFechaConversion(idCotizacion, idOrden, nuevaFecha) {
    try {
      const [updated] = await Cotizaciones_Ordenes.update(
        { fecha_conversion: nuevaFecha },
        {
          where: {
            id_cotizacion: idCotizacion,
            id_orden: idOrden
          }
        }
      );

      if (updated === 0) {
        throw new Error('Relación no encontrada');
      }

      return await this.getRelacionByIds(idCotizacion, idOrden);
    } catch (error) {
      throw new Error(`Error al actualizar fecha de conversión: ${error.message}`);
    }
  }

  // DELETE - Eliminar relación
  async deleteRelacion(idCotizacion, idOrden) {
    try {
      const deleted = await Cotizaciones_Ordenes.destroy({
        where: {
          id_cotizacion: idCotizacion,
          id_orden: idOrden
        }
      });

      if (deleted === 0) {
        throw new Error('Relación no encontrada');
      }

      return { message: 'Relación eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar relación: ${error.message}`);
    }
  }

  // DELETE - Eliminar relaciones por cotización
  async deleteRelacionesByCotizacion(idCotizacion) {
    try {
      const deleted = await Cotizaciones_Ordenes.destroy({
        where: { id_cotizacion: idCotizacion }
      });

      return {
        message: `${deleted} relación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar relaciones de la cotización: ${error.message}`);
    }
  }

  // DELETE - Eliminar relaciones por orden
  async deleteRelacionesByOrden(idOrden) {
    try {
      const deleted = await Cotizaciones_Ordenes.destroy({
        where: { id_orden: idOrden }
      });

      return {
        message: `${deleted} relación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar relaciones de la orden: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de conversiones
  async getEstadisticasConversiones() {
    try {
      const totalConversiones = await Cotizaciones_Ordenes.count();

      const conversionesEsteMes = await Cotizaciones_Ordenes.count({
        where: {
          fecha_conversion: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const conversionesMesAnterior = await Cotizaciones_Ordenes.count({
        where: {
          fecha_conversion: {
            [Op.between]: [
              new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
              new Date(new Date().getFullYear(), new Date().getMonth(), 0)
            ]
          }
        }
      });

      return {
        totalConversiones,
        conversionesEsteMes,
        conversionesMesAnterior,
        crecimiento: conversionesMesAnterior > 0 ? 
          ((conversionesEsteMes - conversionesMesAnterior) / conversionesMesAnterior * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas de conversiones: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener tasa de conversión por período
  async getTasaConversion(fechaInicio, fechaFin) {
    try {
      const conversiones = await this.getConversionesByFecha(fechaInicio, fechaFin);
      
      return {
        periodo: {
          fechaInicio,
          fechaFin
        },
        totalConversiones: conversiones.length,
        conversiones
      };
    } catch (error) {
      throw new Error(`Error al obtener tasa de conversión: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar si cotización ya fue convertida
  async verificarCotizacionConvertida(idCotizacion) {
    try {
      const relacion = await Cotizaciones_Ordenes.findOne({
        where: { id_cotizacion: idCotizacion }
      });
      return {
        convertida: !!relacion,
        relacion: relacion || null
      };
    } catch (error) {
      throw new Error(`Error al verificar cotización convertida: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar si orden proviene de cotización
  async verificarOrdenDeCotizacion(idOrden) {
    try {
      const relacion = await Cotizaciones_Ordenes.findOne({
        where: { id_orden: idOrden }
      });
      return {
        desdeCotizacion: !!relacion,
        relacion: relacion || null
      };
    } catch (error) {
      throw new Error(`Error al verificar orden de cotización: ${error.message}`);
    }
  }

  // REPORTES - Obtener historial de conversiones
  async getHistorialConversiones(limit = 100) {
    try {
      const conversiones = await Cotizaciones_Ordenes.findAll({
        order: [['fecha_conversion', 'DESC']],
        limit: parseInt(limit)
      });

      return conversiones;
    } catch (error) {
      throw new Error(`Error al obtener historial de conversiones: ${error.message}`);
    }
  }

  // MIGRACIÓN - Reasignar orden a cotización
  async reasignarOrdenACotizacion(idCotizacionActual, idCotizacionNueva, idOrden) {
    try {
      // Eliminar relación actual si existe
      await Cotizaciones_Ordenes.destroy({
        where: {
          id_orden: idOrden
        }
      });

      // Crear nueva relación
      const nuevaRelacion = await this.createCotizacionOrden({
        id_cotizacion: idCotizacionNueva,
        id_orden: idOrden,
        fecha_conversion: new Date()
      });

      return {
        nuevaRelacion,
        message: 'Orden reasignada a nueva cotización exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al reasignar orden: ${error.message}`);
    }
  }

  // UTILIDAD - Actualizar automáticamente estado de cotizaciones expiradas
  async actualizarEstadosExpirados() {
    try {
      // Este método sería para actualizar estados en el modelo Cotizaciones
      // Por ahora retornamos un mensaje informativo
      return {
        message: 'Función de actualización de estados expirados - requiere implementación en modelo Cotizaciones',
        actualizadas: 0
      };
    } catch (error) {
      throw new Error(`Error al actualizar estados expirados: ${error.message}`);
    }
  }
}

export default new CotizacionesOrdenesService();