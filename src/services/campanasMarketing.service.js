import CampanasMarketing from '../models/CampanasMarketing.js';

class CampanasMarketingService {
  // CREATE - Crear nueva campaña
  async createCampana(campanaData) {
    try {
      // Validar fechas
      if (campanaData.fecha_fin && new Date(campanaData.fecha_fin) <= new Date(campanaData.fecha_inicio)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      const campana = await CampanasMarketing.create(campanaData);
      return campana;
    } catch (error) {
      throw new Error(`Error al crear campaña: ${error.message}`);
    }
  }

  // READ - Obtener campaña por ID
  async getCampanaById(idCampana) {
    try {
      const campana = await CampanasMarketing.findByPk(idCampana);
      if (!campana) {
        throw new Error('Campaña no encontrada');
      }
      return campana;
    } catch (error) {
      throw new Error(`Error al obtener campaña: ${error.message}`);
    }
  }

  // READ - Obtener todas las campañas (con filtros)
  async getAllCampanas(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        tipo_campana,
        search,
        orderBy = 'fecha_creacion',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (estado) {
        whereClause.estado = estado;
      }
      
      if (tipo_campana) {
        whereClause.tipo_campana = tipo_campana;
      }
      
      if (search) {
        whereClause.nombre_campana = {
          [Op.like]: `%${search}%`
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await CampanasMarketing.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        campanas: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener campañas: ${error.message}`);
    }
  }

  // READ - Obtener campañas activas
  async getCampanasActivas() {
    try {
      const campanas = await CampanasMarketing.findAll({
        where: { estado: 'activa' },
        order: [['fecha_inicio', 'ASC']]
      });
      return campanas;
    } catch (error) {
      throw new Error(`Error al obtener campañas activas: ${error.message}`);
    }
  }

  // READ - Obtener campañas por rango de fechas
  async getCampanasByFecha(inicio, fin) {
    try {
      const campanas = await CampanasMarketing.findAll({
        where: {
          fecha_inicio: {
            [Op.gte]: new Date(inicio)
          },
          fecha_fin: {
            [Op.lte]: new Date(fin)
          }
        },
        order: [['fecha_inicio', 'ASC']]
      });
      return campanas;
    } catch (error) {
      throw new Error(`Error al obtener campañas por fecha: ${error.message}`);
    }
  }

  // UPDATE - Actualizar campaña
  async updateCampana(idCampana, updateData) {
    try {
      // Validar fechas si se están actualizando
      if (updateData.fecha_fin && updateData.fecha_inicio) {
        if (new Date(updateData.fecha_fin) <= new Date(updateData.fecha_inicio)) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }

      const [updated] = await CampanasMarketing.update(updateData, {
        where: { id_campana: idCampana }
      });

      if (updated === 0) {
        throw new Error('Campaña no encontrada');
      }

      return await this.getCampanaById(idCampana);
    } catch (error) {
      throw new Error(`Error al actualizar campaña: ${error.message}`);
    }
  }

  // UPDATE - Cambiar estado de campaña
  async cambiarEstadoCampana(idCampana, nuevoEstado) {
    try {
      const estadosValidos = ['planificada', 'activa', 'pausada', 'completada', 'cancelada'];
      if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('Estado no válido');
      }

      const [updated] = await CampanasMarketing.update(
        { estado: nuevoEstado },
        { where: { id_campana: idCampana } }
      );

      if (updated === 0) {
        throw new Error('Campaña no encontrada');
      }

      return await this.getCampanaById(idCampana);
    } catch (error) {
      throw new Error(`Error al cambiar estado de campaña: ${error.message}`);
    }
  }

  // UPDATE - Activar campaña
  async activarCampana(idCampana) {
    return await this.cambiarEstadoCampana(idCampana, 'activa');
  }

  // UPDATE - Pausar campaña
  async pausarCampana(idCampana) {
    return await this.cambiarEstadoCampana(idCampana, 'pausada');
  }

  // UPDATE - Completar campaña
  async completarCampana(idCampana) {
    return await this.cambiarEstadoCampana(idCampana, 'completada');
  }

  // DELETE - Eliminar campaña
  async deleteCampana(idCampana) {
    try {
      const deleted = await CampanasMarketing.destroy({
        where: { id_campana: idCampana }
      });

      if (deleted === 0) {
        throw new Error('Campaña no encontrada');
      }

      return { message: 'Campaña eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar campaña: ${error.message}`);
    }
  }

  // Métodos de análisis y reportes
  async getEstadisticasCampanas() {
    try {
      const total = await CampanasMarketing.count();
      const porEstado = await CampanasMarketing.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id_campana')), 'cantidad']
        ],
        group: ['estado']
      });

      const porTipo = await CampanasMarketing.findAll({
        attributes: [
          'tipo_campana',
          [sequelize.fn('COUNT', sequelize.col('id_campana')), 'cantidad']
        ],
        group: ['tipo_campana']
      });

      const presupuestoTotal = await CampanasMarketing.sum('presupuesto');

      return {
        total,
        porEstado,
        porTipo,
        presupuestoTotal: presupuestoTotal || 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Obtener campañas próximas a iniciar
  async getCampanasProximas(dias = 7) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const campanas = await CampanasMarketing.findAll({
        where: {
          estado: 'planificada',
          fecha_inicio: {
            [Op.between]: [new Date(), fechaLimite]
          }
        },
        order: [['fecha_inicio', 'ASC']]
      });

      return campanas;
    } catch (error) {
      throw new Error(`Error al obtener campañas próximas: ${error.message}`);
    }
  }

  // Obtener campañas que necesitan atención (vencidas o por vencer)
  async getCampanasNecesitanAtencion() {
    try {
      const hoy = new Date();
      
      const campanasVencidas = await CampanasMarketing.findAll({
        where: {
          estado: 'activa',
          fecha_fin: {
            [Op.lt]: hoy
          }
        }
      });

      const campanasPorVencer = await CampanasMarketing.findAll({
        where: {
          estado: 'activa',
          fecha_fin: {
            [Op.between]: [hoy, new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000)] // Próximos 3 días
          }
        }
      });

      return {
        vencidas: campanasVencidas,
        porVencer: campanasPorVencer
      };
    } catch (error) {
      throw new Error(`Error al obtener campañas que necesitan atención: ${error.message}`);
    }
  }
}

export default new CampanasMarketingService();