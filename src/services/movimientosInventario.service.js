import MovimientosInventario from '../models/movimientosInventario.model.js';
import Inventario from '../models/inventario.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

class MovimientosInventarioService {
  // CREATE - Registrar nuevo movimiento de inventario
  async create(data) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        id_inventario, 
        tipo_movimiento, 
        cantidad, 
        motivo, 
        id_usuario,
        referencia,
        id_orden
      } = data;

      // Validar campos requeridos
      if (!id_inventario || !tipo_movimiento || !cantidad || !id_usuario) {
        throw new Error('El inventario, tipo de movimiento, cantidad e id_usuario son requeridos');
      }

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo_movimiento)) {
        throw new Error(`Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`);
      }

      // Validar cantidad positiva
      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero');
      }

      // Obtener el inventario
      const inventario = await Inventario.findByPk(id_inventario, { transaction });

      if (!inventario) {
        throw new Error('Inventario no encontrado');
      }

      // Calcular nueva cantidad según tipo de movimiento
      let cantidadNueva = inventario.cantidad_actual;
      
      if (tipo_movimiento === 'entrada' || tipo_movimiento === 'devolucion') {
        cantidadNueva += cantidad;
      } else if (tipo_movimiento === 'salida' || tipo_movimiento === 'transferencia') {
        cantidadNueva -= cantidad;
        
        // Validar que haya suficiente stock
        if (cantidadNueva < 0) {
          throw new Error('Stock insuficiente para realizar el movimiento');
        }
      }
      // Para 'ajuste' se puede incrementar o decrementar según el contexto

      // Crear el movimiento
      const nuevoMovimiento = await MovimientosInventario.create({
        id_inventario,
        tipo_movimiento,
        cantidad,
        cantidad_anterior: inventario.cantidad_actual,
        cantidad_nueva: cantidadNueva,
        motivo,
        id_usuario,
        referencia,
        id_orden
      }, { transaction });

      // Actualizar el inventario
      await inventario.update({
        cantidad_actual: cantidadNueva,
        fecha_actualizacion: new Date()
      }, { transaction });

      await transaction.commit();

      return nuevoMovimiento;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al crear movimiento de inventario: ${error.message}`);
    }
  }

  // READ - Obtener todos los movimientos
  async getAll(filters = {}) {
    try {
      const { 
        id_inventario, 
        tipo_movimiento, 
        id_usuario,
        fecha_inicio,
        fecha_fin,
        limit = 100,
        offset = 0
      } = filters;

      // Construir filtros opcionales
      const where = {};
      
      if (id_inventario) {
        where.id_inventario = id_inventario;
      }
      
      if (tipo_movimiento) {
        where.tipo_movimiento = tipo_movimiento;
      }

      if (id_usuario) {
        where.id_usuario = id_usuario;
      }

      // Filtro por rango de fechas
      if (fecha_inicio || fecha_fin) {
        where.fecha_movimiento = {};
        
        if (fecha_inicio) {
          where.fecha_movimiento[Op.gte] = new Date(fecha_inicio);
        }
        
        if (fecha_fin) {
          where.fecha_movimiento[Op.lte] = new Date(fecha_fin);
        }
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({ 
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        movimientos: rows,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener movimientos: ${error.message}`);
    }
  }

  // READ - Obtener movimiento por ID
  async getById(id) {
    try {
      const movimiento = await MovimientosInventario.findByPk(id);

      if (!movimiento) {
        throw new Error('Movimiento no encontrado');
      }

      return movimiento;
    } catch (error) {
      throw new Error(`Error al obtener movimiento: ${error.message}`);
    }
  }

  // READ - Obtener movimientos por inventario
  async getByInventario(idInventario, filters = {}) {
    try {
      const { limit = 50, offset = 0 } = filters;

      // Validar que el inventario exista
      const inventario = await Inventario.findByPk(idInventario);
      if (!inventario) {
        throw new Error('Inventario no encontrado');
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where: { id_inventario: idInventario },
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        movimientos: rows,
        total: count,
        id_inventario: idInventario,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener movimientos del inventario: ${error.message}`);
    }
  }

  // READ - Obtener movimientos por tipo
  async getByTipo(tipo, filters = {}) {
    try {
      const { fecha_inicio, fecha_fin, limit = 100, offset = 0 } = filters;

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo)) {
        throw new Error(`Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`);
      }

      const where = { tipo_movimiento: tipo };

      // Filtro por rango de fechas
      if (fecha_inicio || fecha_fin) {
        where.fecha_movimiento = {};
        
        if (fecha_inicio) {
          where.fecha_movimiento[Op.gte] = new Date(fecha_inicio);
        }
        
        if (fecha_fin) {
          where.fecha_movimiento[Op.lte] = new Date(fecha_fin);
        }
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        movimientos: rows,
        total: count,
        tipo: tipo,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener movimientos por tipo: ${error.message}`);
    }
  }

  // READ - Obtener movimientos por rango de fechas
  async getByFecha(fechaInicio, fechaFin, filters = {}) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error('Debe proporcionar fecha_inicio y fecha_fin');
      }

      const { tipo_movimiento, id_inventario, limit = 100, offset = 0 } = filters;

      const where = {
        fecha_movimiento: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        }
      };

      if (tipo_movimiento) {
        where.tipo_movimiento = tipo_movimiento;
      }

      if (id_inventario) {
        where.id_inventario = id_inventario;
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calcular totales por tipo
      const totalesPorTipo = await MovimientosInventario.findAll({
        where,
        attributes: [
          'tipo_movimiento',
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad'],
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'total_movimientos']
        ],
        group: ['tipo_movimiento']
      });

      return {
        movimientos: rows,
        total: count,
        totalesPorTipo: totalesPorTipo.map(t => ({
          tipo_movimiento: t.dataValues.tipo_movimiento,
          total_cantidad: parseInt(t.dataValues.total_cantidad) || 0,
          total_movimientos: parseInt(t.dataValues.total_movimientos) || 0
        })),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener movimientos por fecha: ${error.message}`);
    }
  }

  // READ - Obtener movimientos por usuario
  async getByUsuario(idUsuario, filters = {}) {
    try {
      const { limit = 50, offset = 0, fecha_inicio, fecha_fin } = filters;

      const where = { id_usuario: idUsuario };

      if (fecha_inicio || fecha_fin) {
        where.fecha_movimiento = {};
        
        if (fecha_inicio) {
          where.fecha_movimiento[Op.gte] = new Date(fecha_inicio);
        }
        
        if (fecha_fin) {
          where.fecha_movimiento[Op.lte] = new Date(fecha_fin);
        }
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        movimientos: rows,
        total: count,
        id_usuario: idUsuario,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener movimientos del usuario: ${error.message}`);
    }
  }

  // READ - Obtener resumen de movimientos
  async getResumen(filtros = {}) {
    try {
      const { fecha_inicio, fecha_fin } = filtros;

      const where = {};

      if (fecha_inicio && fecha_fin) {
        where.fecha_movimiento = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      // Total general
      const totalMovimientos = await MovimientosInventario.count({ where });

      // Por tipo
      const porTipo = await MovimientosInventario.findAll({
        where,
        attributes: [
          'tipo_movimiento',
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades']
        ],
        group: ['tipo_movimiento']
      });

      // Últimos 10 movimientos
      const ultimosMovimientos = await MovimientosInventario.findAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: 10
      });

      return {
        totalMovimientos,
        porTipo: porTipo.map(p => ({
          tipo_movimiento: p.dataValues.tipo_movimiento,
          cantidad_movimientos: parseInt(p.dataValues.cantidad) || 0,
          total_unidades: parseInt(p.dataValues.total_unidades) || 0
        })),
        ultimosMovimientos
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen de movimientos: ${error.message}`);
    }
  }

  // DELETE - Eliminar movimiento
  async delete(id) {
    try {
      const movimiento = await MovimientosInventario.findByPk(id);

      if (!movimiento) {
        throw new Error('Movimiento no encontrado');
      }

      // ADVERTENCIA: Eliminar un movimiento puede descuadrar el inventario
      await movimiento.destroy();
      
      return { 
        message: 'Movimiento eliminado exitosamente',
        advertencia: 'Verifique que el inventario esté correcto'
      };
    } catch (error) {
      throw new Error(`Error al eliminar movimiento: ${error.message}`);
    }
  }

  // VALIDACIÓN - Verificar stock antes de movimiento
  async verificarStockParaMovimiento(idInventario, tipoMovimiento, cantidad) {
    try {
      const inventario = await Inventario.findByPk(idInventario);

      if (!inventario) {
        throw new Error('Inventario no encontrado');
      }

      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipoMovimiento)) {
        throw new Error(`Tipo de movimiento inválido`);
      }

      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero');
      }

      let stockSuficiente = true;
      let mensajeValidacion = '';

      if (tipoMovimiento === 'salida' || tipoMovimiento === 'transferencia') {
        if (inventario.cantidad_actual < cantidad) {
          stockSuficiente = false;
          mensajeValidacion = `Stock insuficiente. Disponible: ${inventario.cantidad_actual}, Requerido: ${cantidad}`;
        }
      }

      return {
        valido: stockSuficiente,
        stockActual: inventario.cantidad_actual,
        cantidadSolicitada: cantidad,
        mensaje: mensajeValidacion || 'Movimiento permitido'
      };
    } catch (error) {
      throw new Error(`Error al verificar stock: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener historial de movimientos para auditoría
  async getHistorialAuditoria(idInventario, filtros = {}) {
    try {
      const { limit = 100, offset = 0 } = filtros;

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where: { id_inventario: idInventario },
        order: [['fecha_movimiento', 'DESC']],
        attributes: [
          'id_movimiento',
          'tipo_movimiento',
          'cantidad_anterior',
          'cantidad_nueva',
          'cantidad',
          'fecha_movimiento',
          'motivo',
          'referencia'
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        historial: rows,
        total: count,
        id_inventario: idInventario,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      throw new Error(`Error al obtener historial de auditoría: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Reporte de movimientos por período
  async getReportePorPeriodo(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error('Debe proporcionar fecha_inicio y fecha_fin');
      }

      const where = {
        fecha_movimiento: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        }
      };

      // Total por tipo
      const porTipo = await MovimientosInventario.findAll({
        where,
        attributes: [
          'tipo_movimiento',
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'cantidad_movimientos'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades']
        ],
        group: ['tipo_movimiento']
      });

      // Total por usuario
      const porUsuario = await MovimientosInventario.findAll({
        where,
        attributes: [
          'id_usuario',
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'cantidad_movimientos'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades']
        ],
        group: ['id_usuario']
      });

      // Total movimientos
      const totalMovimientos = await MovimientosInventario.count({ where });

      return {
        periodo: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        },
        totalMovimientos,
        porTipo: porTipo.map(p => ({
          tipo_movimiento: p.dataValues.tipo_movimiento,
          cantidad_movimientos: parseInt(p.dataValues.cantidad_movimientos) || 0,
          total_unidades: parseInt(p.dataValues.total_unidades) || 0
        })),
        porUsuario: porUsuario.map(p => ({
          id_usuario: p.dataValues.id_usuario,
          cantidad_movimientos: parseInt(p.dataValues.cantidad_movimientos) || 0,
          total_unidades: parseInt(p.dataValues.total_unidades) || 0
        }))
      };
    } catch (error) {
      throw new Error(`Error al generar reporte por período: ${error.message}`);
    }
  }
}

export default new MovimientosInventarioService();
