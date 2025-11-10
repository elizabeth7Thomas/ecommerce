import AlertasInventario from '../models/alertasInventario.model.js';
import { sequelize } from '../config/database.js';

class AlertasInventarioService {
  // CREATE - Crear nueva alerta
  async createAlerta(alertaData) {
    try {
      const alerta = await AlertasInventario.create(alertaData);
      return alerta;
    } catch (error) {
      throw new Error(`Error al crear alerta: ${error.message}`);
    }
  }

  // READ - Obtener alerta por ID
  async getAlertaById(idAlerta) {
    try {
      const alerta = await AlertasInventario.findByPk(idAlerta);
      if (!alerta) {
        throw new Error('Alerta no encontrada');
      }
      return alerta;
    } catch (error) {
      throw new Error(`Error al obtener alerta: ${error.message}`);
    }
  }

  // READ - Obtener todas las alertas (con filtros opcionales)
  async getAllAlertas(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        resuelta, 
        tipo_alerta,
        id_inventario,
        orderBy = 'fecha_alerta',
        order = 'DESC'
      } = options;

      const whereClause = {};
      
      if (resuelta !== undefined) {
        whereClause.resuelta = resuelta;
      }
      
      if (tipo_alerta) {
        whereClause.tipo_alerta = tipo_alerta;
      }
      
      if (id_inventario) {
        whereClause.id_inventario = id_inventario;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await AlertasInventario.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, order.toUpperCase()]]
      });

      return {
        alertas: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener alertas: ${error.message}`);
    }
  }

  // READ - Obtener alertas por inventario
  async getAlertasByInventario(idInventario) {
    try {
      const alertas = await AlertasInventario.findAll({
        where: { id_inventario: idInventario },
        order: [['fecha_alerta', 'DESC']]
      });
      return alertas;
    } catch (error) {
      throw new Error(`Error al obtener alertas del inventario: ${error.message}`);
    }
  }

  // READ - Obtener alertas no resueltas
  async getAlertasPendientes() {
    try {
      const alertas = await AlertasInventario.findAll({
        where: { resuelta: false },
        order: [['fecha_alerta', 'DESC']]
      });
      return alertas;
    } catch (error) {
      throw new Error(`Error al obtener alertas pendientes: ${error.message}`);
    }
  }

  // UPDATE - Actualizar alerta
  async updateAlerta(idAlerta, updateData) {
    try {
      // Si se marca como resuelta, agregar fecha de resolución
      if (updateData.resuelta === true && !updateData.fecha_resolucion) {
        updateData.fecha_resolucion = new Date();
      }
      
      // Si se desmarca como resuelta, limpiar fecha de resolución
      if (updateData.resuelta === false) {
        updateData.fecha_resolucion = null;
      }

      const [updated] = await AlertasInventario.update(updateData, {
        where: { id_alerta: idAlerta }
      });

      if (updated === 0) {
        throw new Error('Alerta no encontrada');
      }

      return await this.getAlertaById(idAlerta);
    } catch (error) {
      throw new Error(`Error al actualizar alerta: ${error.message}`);
    }
  }

  // UPDATE - Marcar alerta como resuelta
  async markAsResuelta(idAlerta) {
    try {
      const updateData = {
        resuelta: true,
        fecha_resolucion: new Date()
      };

      const [updated] = await AlertasInventario.update(updateData, {
        where: { id_alerta: idAlerta }
      });

      if (updated === 0) {
        throw new Error('Alerta no encontrada');
      }

      return await this.getAlertaById(idAlerta);
    } catch (error) {
      throw new Error(`Error al marcar alerta como resuelta: ${error.message}`);
    }
  }

  // DELETE - Eliminar alerta
  async deleteAlerta(idAlerta) {
    try {
      const deleted = await AlertasInventario.destroy({
        where: { id_alerta: idAlerta }
      });

      if (deleted === 0) {
        throw new Error('Alerta no encontrada');
      }

      return { message: 'Alerta eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar alerta: ${error.message}`);
    }
  }

  // DELETE - Eliminar alertas por inventario
  async deleteAlertasByInventario(idInventario) {
    try {
      const deleted = await AlertasInventario.destroy({
        where: { id_inventario: idInventario }
      });

      return { 
        message: `${deleted} alerta(s) eliminada(s) exitosamente`,
        count: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar alertas del inventario: ${error.message}`);
    }
  }

  // Métodos específicos de negocio
  async crearAlertaStockBajo(idInventario, mensaje) {
    return await this.createAlerta({
      id_inventario: idInventario,
      tipo_alerta: 'stock_bajo',
      mensaje: mensaje
    });
  }

  async crearAlertaStockAgotado(idInventario, mensaje) {
    return await this.createAlerta({
      id_inventario: idInventario,
      tipo_alerta: 'stock_agotado',
      mensaje: mensaje
    });
  }

  async crearAlertaStockExcedido(idInventario, mensaje) {
    return await this.createAlerta({
      id_inventario: idInventario,
      tipo_alerta: 'stock_excedido',
      mensaje: mensaje
    });
  }

  async crearAlertaProductoVencido(idInventario, mensaje) {
    return await this.createAlerta({
      id_inventario: idInventario,
      tipo_alerta: 'producto_vencido',
      mensaje: mensaje
    });
  }

  // Estadísticas
  async getEstadisticasAlertas() {
    try {
      const total = await AlertasInventario.count();
      const pendientes = await AlertasInventario.count({ where: { resuelta: false } });
      const resueltas = await AlertasInventario.count({ where: { resuelta: true } });
      
      const porTipo = await AlertasInventario.findAll({
        attributes: [
          'tipo_alerta',
          [sequelize.fn('COUNT', sequelize.col('id_alerta')), 'cantidad']
        ],
        group: ['tipo_alerta']
      });

      return {
        total,
        pendientes,
        resueltas,
        porTipo
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

export default new AlertasInventarioService();
