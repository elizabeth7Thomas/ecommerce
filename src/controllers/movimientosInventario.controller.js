import MovimientosInventario from '../models/movimientosInventario.model.js';
import Inventario from '../models/inventario.model.js';
import * as response from '../utils/response.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

class MovimientosInventarioController {
  // Crear un nuevo movimiento de inventario
  async create(req, res) {
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
      } = req.body;

      // Validación básica
      if (!id_inventario || !tipo_movimiento || !cantidad) {
        await transaction.rollback();
        return response.error(
          req, 
          res, 
          'El inventario, tipo de movimiento y cantidad son requeridos', 
          400
        );
      }

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo_movimiento)) {
        await transaction.rollback();
        return response.error(
          req, 
          res, 
          `Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`, 
          400
        );
      }

      // Validar cantidad positiva
      if (cantidad <= 0) {
        await transaction.rollback();
        return response.error(req, res, 'La cantidad debe ser mayor a cero', 400);
      }

      // Obtener el inventario
      const inventario = await Inventario.findByPk(id_inventario, { transaction });

      if (!inventario) {
        await transaction.rollback();
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      // Calcular nueva cantidad según tipo de movimiento
      let cantidadNueva = inventario.cantidad_actual;
      
      if (tipo_movimiento === 'entrada' || tipo_movimiento === 'devolucion') {
        cantidadNueva += cantidad;
      } else if (tipo_movimiento === 'salida' || tipo_movimiento === 'transferencia') {
        cantidadNueva -= cantidad;
        
        // Validar que haya suficiente stock
        if (cantidadNueva < 0) {
          await transaction.rollback();
          return response.error(
            req, 
            res, 
            'Stock insuficiente para realizar el movimiento', 
            400
          );
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
        cantidad_actual: cantidadNueva
      }, { transaction });

      await transaction.commit();

      return response.success(
        req, 
        res, 
        nuevoMovimiento, 
        'Movimiento de inventario registrado exitosamente', 
        201
      );
    } catch (error) {
      await transaction.rollback();
      console.error('Error al crear movimiento de inventario:', error);
      return response.error(req, res, 'Error al crear el movimiento de inventario', 500);
    }
  }

  // Obtener todos los movimientos de inventario
  async getAll(req, res) {
    try {
      const { 
        id_inventario, 
        tipo_movimiento, 
        id_usuario,
        fecha_inicio,
        fecha_fin,
        limit = 100,
        offset = 0
      } = req.query;

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

      const movimientos = await MovimientosInventario.findAndCountAll({ 
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return response.success(
        req, 
        res, 
        {
          movimientos: movimientos.rows,
          total: movimientos.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }, 
        'Movimientos obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      return response.error(req, res, 'Error al obtener los movimientos', 500);
    }
  }

  // Obtener un movimiento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const movimiento = await MovimientosInventario.findByPk(id);

      if (!movimiento) {
        return response.error(req, res, 'Movimiento no encontrado', 404);
      }

      return response.success(
        req, 
        res, 
        movimiento, 
        'Movimiento obtenido exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener movimiento:', error);
      return response.error(req, res, 'Error al obtener el movimiento', 500);
    }
  }

  // Obtener movimientos por inventario específico
  async getByInventario(req, res) {
    try {
      const { id_inventario } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const movimientos = await MovimientosInventario.findAndCountAll({
        where: { id_inventario },
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return response.success(
        req, 
        res, 
        {
          movimientos: movimientos.rows,
          total: movimientos.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }, 
        'Movimientos del inventario obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener movimientos por inventario:', error);
      return response.error(req, res, 'Error al obtener los movimientos', 500);
    }
  }

  // Obtener movimientos por tipo
  async getByTipo(req, res) {
    try {
      const { tipo } = req.params;
      const { fecha_inicio, fecha_fin, limit = 100, offset = 0 } = req.query;

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo)) {
        return response.error(
          req, 
          res, 
          `Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`, 
          400
        );
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

      const movimientos = await MovimientosInventario.findAndCountAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return response.success(
        req, 
        res, 
        {
          movimientos: movimientos.rows,
          total: movimientos.count,
          tipo: tipo,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }, 
        `Movimientos de tipo '${tipo}' obtenidos exitosamente`, 
        200
      );
    } catch (error) {
      console.error('Error al obtener movimientos por tipo:', error);
      return response.error(req, res, 'Error al obtener los movimientos', 500);
    }
  }

  // Obtener movimientos por rango de fechas
  async getByFecha(req, res) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const { tipo_movimiento, id_inventario, limit = 100, offset = 0 } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return response.error(
          req, 
          res, 
          'Debe proporcionar fecha_inicio y fecha_fin', 
          400
        );
      }

      const where = {
        fecha_movimiento: {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        }
      };

      if (tipo_movimiento) {
        where.tipo_movimiento = tipo_movimiento;
      }

      if (id_inventario) {
        where.id_inventario = id_inventario;
      }

      const movimientos = await MovimientosInventario.findAndCountAll({
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

      return response.success(
        req, 
        res, 
        {
          movimientos: movimientos.rows,
          total: movimientos.count,
          totalesPorTipo,
          fecha_inicio,
          fecha_fin,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }, 
        'Movimientos por fecha obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener movimientos por fecha:', error);
      return response.error(req, res, 'Error al obtener los movimientos', 500);
    }
  }

  // Eliminar un movimiento (CUIDADO: esto puede descuadrar el inventario)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { forzar } = req.query; // Parámetro de seguridad

      const movimiento = await MovimientosInventario.findByPk(id);

      if (!movimiento) {
        return response.error(req, res, 'Movimiento no encontrado', 404);
      }

      // Advertencia de seguridad
      if (forzar !== 'true') {
        return response.error(
          req, 
          res, 
          'Eliminar movimientos puede descuadrar el inventario. Use el parámetro ?forzar=true si está seguro', 
          403
        );
      }

      await movimiento.destroy();
      
      return response.success(
        req, 
        res, 
        null, 
        'Movimiento eliminado exitosamente. ADVERTENCIA: Verifique el inventario', 
        200
      );
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      return response.error(req, res, 'Error al eliminar el movimiento', 500);
    }
  }
}

export default new MovimientosInventarioController();
