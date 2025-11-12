import MovimientosInventario from '../models/movimientosInventario.model.js';
import Inventario from '../models/inventario.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Clase personalizada para errores de movimientos de inventario
class MovimientosInventarioServiceError extends Error {
  constructor(message, code = 'MOVIMIENTO_ERROR') {
    super(message);
    this.name = 'MovimientosInventarioServiceError';
    this.code = code;
  }
}

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

      // Validaciones de datos requeridos
      if (!id_inventario) {
        throw new MovimientosInventarioServiceError(
          'El ID del inventario es requerido',
          'MISSING_INVENTORY_ID'
        );
      }

      if (!tipo_movimiento) {
        throw new MovimientosInventarioServiceError(
          'El tipo de movimiento es requerido',
          'MISSING_MOVEMENT_TYPE'
        );
      }

      if (!cantidad) {
        throw new MovimientosInventarioServiceError(
          'La cantidad es requerida',
          'MISSING_QUANTITY'
        );
      }

      if (!id_usuario) {
        throw new MovimientosInventarioServiceError(
          'El ID del usuario es requerido',
          'MISSING_USER_ID'
        );
      }

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo_movimiento)) {
        throw new MovimientosInventarioServiceError(
          `Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`,
          'INVALID_MOVEMENT_TYPE'
        );
      }

      // Validar cantidad positiva
      if (cantidad <= 0) {
        throw new MovimientosInventarioServiceError(
          'La cantidad debe ser mayor a cero',
          'INVALID_QUANTITY'
        );
      }

      // Obtener el inventario
      const inventario = await Inventario.findByPk(id_inventario, { transaction });
      if (!inventario) {
        throw new MovimientosInventarioServiceError(
          `Inventario con ID ${id_inventario} no encontrado`,
          'INVENTORY_NOT_FOUND'
        );
      }

      // Calcular nueva cantidad según tipo de movimiento
      let cantidadNueva = inventario.cantidad_actual;
      
      if (tipo_movimiento === 'entrada' || tipo_movimiento === 'devolucion') {
        cantidadNueva += cantidad;
      } else if (tipo_movimiento === 'salida' || tipo_movimiento === 'transferencia') {
        cantidadNueva -= cantidad;
        
        // Validar que haya suficiente stock
        if (cantidadNueva < 0) {
          throw new MovimientosInventarioServiceError(
            `Stock insuficiente. Disponible: ${inventario.cantidad_actual}, Requerido: ${cantidad}`,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Para 'ajuste' se puede incrementar o decrementar según el contexto
      if (tipo_movimiento === 'ajuste') {
        if (!motivo) {
          throw new MovimientosInventarioServiceError(
            'Para ajustes, el motivo es requerido',
            'MISSING_REASON'
          );
        }
        cantidadNueva = cantidad; // El ajuste establece la cantidad directa
      }

      // Crear el movimiento
      const nuevoMovimiento = await MovimientosInventario.create({
        id_inventario,
        tipo_movimiento,
        cantidad,
        cantidad_anterior: inventario.cantidad_actual,
        cantidad_nueva: cantidadNueva,
        motivo: motivo || null,
        id_usuario,
        referencia: referencia || null,
        id_orden: id_orden || null,
        estado: 'activo', // Nuevo campo para auditoría
        id_movimiento_relacionado: null // Para vinculaciones (reversiones, etc.)
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
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al crear movimiento de inventario: ${error.message}`,
        'CREATE_FAILED'
      );
    }
  }

  // READ - Obtener todos los movimientos
  async getAll(filters = {}) {
    try {
      const { 
        id_inventario, 
        tipo_movimiento, 
        id_usuario,
        estado = 'activo', // Por defecto mostrar solo movimientos activos
        fecha_inicio,
        fecha_fin,
        limit = 100,
        offset = 0
      } = filters;

      // Validar parámetros
      if (limit < 1 || offset < 0) {
        throw new MovimientosInventarioServiceError(
          'Los parámetros limit y offset deben ser válidos',
          'INVALID_PARAMS'
        );
      }

      // Construir filtros opcionales
      const where = {};
      
      if (id_inventario) where.id_inventario = id_inventario;
      if (tipo_movimiento) where.tipo_movimiento = tipo_movimiento;
      if (id_usuario) where.id_usuario = id_usuario;
      if (estado) where.estado = estado;

      // Filtro por rango de fechas
      if (fecha_inicio || fecha_fin) {
        where.fecha_movimiento = {};
        
        if (fecha_inicio) {
          const fechaDesde = new Date(fecha_inicio);
          if (isNaN(fechaDesde.getTime())) {
            throw new MovimientosInventarioServiceError(
              'Formato de fecha_inicio inválido',
              'INVALID_DATE_FORMAT'
            );
          }
          where.fecha_movimiento[Op.gte] = fechaDesde;
        }
        
        if (fecha_fin) {
          const fechaHasta = new Date(fecha_fin);
          if (isNaN(fechaHasta.getTime())) {
            throw new MovimientosInventarioServiceError(
              'Formato de fecha_fin inválido',
              'INVALID_DATE_FORMAT'
            );
          }
          where.fecha_movimiento[Op.lte] = fechaHasta;
        }

        if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
          throw new MovimientosInventarioServiceError(
            'fecha_inicio no puede ser mayor que fecha_fin',
            'INVALID_DATE_RANGE'
          );
        }
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({ 
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (count === 0 && estado === 'activo') {
        throw new MovimientosInventarioServiceError(
          'No hay movimientos registrados con los filtros especificados',
          'NO_RESULTS'
        );
      }

      return {
        movimientos: rows,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1,
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimientos: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener movimiento por ID
  async getById(id) {
    try {
      if (!id) {
        throw new MovimientosInventarioServiceError(
          'El ID del movimiento es requerido',
          'MISSING_ID'
        );
      }

      const movimiento = await MovimientosInventario.findByPk(id);

      if (!movimiento) {
        throw new MovimientosInventarioServiceError(
          `Movimiento con ID ${id} no encontrado`,
          'NOT_FOUND'
        );
      }

      return movimiento;
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimiento: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener movimientos por inventario
  async getByInventario(idInventario, filters = {}) {
    try {
      if (!idInventario) {
        throw new MovimientosInventarioServiceError(
          'El ID del inventario es requerido',
          'MISSING_INVENTORY_ID'
        );
      }

      // Validar que el inventario exista
      const inventario = await Inventario.findByPk(idInventario);
      if (!inventario) {
        throw new MovimientosInventarioServiceError(
          `Inventario con ID ${idInventario} no encontrado`,
          'INVENTORY_NOT_FOUND'
        );
      }

      const { limit = 50, offset = 0, estado = 'activo' } = filters;

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where: { 
          id_inventario: idInventario,
          ...(estado && { estado })
        },
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (count === 0) {
        throw new MovimientosInventarioServiceError(
          `No hay movimientos para el inventario ${idInventario}`,
          'NO_RESULTS'
        );
      }

      return {
        movimientos: rows,
        total: count,
        id_inventario: idInventario,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimientos del inventario: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener movimientos por tipo
  async getByTipo(tipo, filters = {}) {
    try {
      if (!tipo) {
        throw new MovimientosInventarioServiceError(
          'El tipo de movimiento es requerido',
          'MISSING_TYPE'
        );
      }

      // Validar tipo de movimiento
      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipo)) {
        throw new MovimientosInventarioServiceError(
          `Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`,
          'INVALID_TYPE'
        );
      }

      const { fecha_inicio, fecha_fin, limit = 100, offset = 0, estado = 'activo' } = filters;

      const where = { 
        tipo_movimiento: tipo,
        ...(estado && { estado })
      };

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

      if (count === 0) {
        throw new MovimientosInventarioServiceError(
          `No hay movimientos de tipo '${tipo}'`,
          'NO_RESULTS'
        );
      }

      return {
        movimientos: rows,
        total: count,
        tipo: tipo,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimientos por tipo: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener movimientos por rango de fechas
  async getByFecha(fechaInicio, fechaFin, filters = {}) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new MovimientosInventarioServiceError(
          'Los parámetros fecha_inicio y fecha_fin son requeridos',
          'MISSING_DATES'
        );
      }

      const fechaDesde = new Date(fechaInicio);
      const fechaHasta = new Date(fechaFin);

      if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
        throw new MovimientosInventarioServiceError(
          'Formato de fechas inválido',
          'INVALID_DATE_FORMAT'
        );
      }

      if (fechaDesde > fechaHasta) {
        throw new MovimientosInventarioServiceError(
          'fecha_inicio no puede ser mayor que fecha_fin',
          'INVALID_DATE_RANGE'
        );
      }

      const { tipo_movimiento, id_inventario, limit = 100, offset = 0, estado = 'activo' } = filters;

      const where = {
        fecha_movimiento: {
          [Op.between]: [fechaDesde, fechaHasta]
        },
        ...(estado && { estado })
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
        group: ['tipo_movimiento'],
        raw: true
      });

      if (count === 0) {
        throw new MovimientosInventarioServiceError(
          'No hay movimientos en el período especificado',
          'NO_RESULTS'
        );
      }

      return {
        movimientos: rows,
        total: count,
        totalesPorTipo: totalesPorTipo.map(t => ({
          tipo_movimiento: t.tipo_movimiento,
          total_cantidad: parseInt(t.total_cantidad) || 0,
          total_movimientos: parseInt(t.total_movimientos) || 0
        })),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimientos por fecha: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener movimientos por usuario
  async getByUsuario(idUsuario, filters = {}) {
    try {
      if (!idUsuario) {
        throw new MovimientosInventarioServiceError(
          'El ID del usuario es requerido',
          'MISSING_USER_ID'
        );
      }

      const { limit = 50, offset = 0, fecha_inicio, fecha_fin, estado = 'activo' } = filters;

      const where = { 
        id_usuario: idUsuario,
        ...(estado && { estado })
      };

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

      if (count === 0) {
        throw new MovimientosInventarioServiceError(
          `No hay movimientos del usuario ${idUsuario}`,
          'NO_RESULTS'
        );
      }

      return {
        movimientos: rows,
        total: count,
        id_usuario: idUsuario,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener movimientos del usuario: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // READ - Obtener resumen de movimientos
  async getResumen(filtros = {}) {
    try {
      const { fecha_inicio, fecha_fin, estado = 'activo' } = filtros;

      const where = {};

      if (estado) {
        where.estado = estado;
      }

      if (fecha_inicio && fecha_fin) {
        const fechaDesde = new Date(fecha_inicio);
        const fechaHasta = new Date(fecha_fin);
        
        if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
          throw new MovimientosInventarioServiceError(
            'Formato de fechas inválido',
            'INVALID_DATE_FORMAT'
          );
        }
        
        where.fecha_movimiento = {
          [Op.between]: [fechaDesde, fechaHasta]
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
        group: ['tipo_movimiento'],
        raw: true
      });

      // Últimos 10 movimientos
      const ultimosMovimientos = await MovimientosInventario.findAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        limit: 10
      });

      // Movimientos anulados (reversiones)
      const anulados = await MovimientosInventario.count({
        where: { estado: 'anulado' }
      });

      if (totalMovimientos === 0) {
        throw new MovimientosInventarioServiceError(
          'No hay movimientos registrados',
          'NO_RESULTS'
        );
      }

      return {
        totalMovimientos,
        movimientosAnulados: anulados,
        porTipo: porTipo.map(p => ({
          tipo_movimiento: p.tipo_movimiento,
          cantidad_movimientos: parseInt(p.cantidad) || 0,
          total_unidades: parseInt(p.total_unidades) || 0
        })),
        ultimosMovimientos,
        periodo: fecha_inicio && fecha_fin ? {
          fecha_inicio,
          fecha_fin
        } : null
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener resumen de movimientos: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // DELETE - PROHIBIDA LA ELIMINACIÓN FÍSICA
  // En su lugar, usar revertirMovimiento() para mantener auditoría inmutable
  async delete(id) {
    throw new MovimientosInventarioServiceError(
      'Eliminación de movimientos prohibida. Use revertirMovimiento() para corregir errores manteniendo auditoría completa',
      'DELETE_NOT_ALLOWED'
    );
  }

  // REVERSIÓN - Revertir/anular un movimiento creando uno inverso
  async revertirMovimiento(idMovimientoOriginal, motivoReversion, idUsuarioReversion) {
    const transaction = await sequelize.transaction();

    try {
      if (!idMovimientoOriginal) {
        throw new MovimientosInventarioServiceError(
          'El ID del movimiento a revertir es requerido',
          'MISSING_MOVEMENT_ID'
        );
      }

      if (!motivoReversion || motivoReversion.trim() === '') {
        throw new MovimientosInventarioServiceError(
          'El motivo de la reversión es requerido',
          'MISSING_REASON'
        );
      }

      if (!idUsuarioReversion) {
        throw new MovimientosInventarioServiceError(
          'El ID del usuario que realiza la reversión es requerido',
          'MISSING_USER_ID'
        );
      }

      // Obtener el movimiento original
      const movimientoOriginal = await MovimientosInventario.findByPk(
        idMovimientoOriginal,
        { transaction }
      );

      if (!movimientoOriginal) {
        throw new MovimientosInventarioServiceError(
          `Movimiento con ID ${idMovimientoOriginal} no encontrado`,
          'NOT_FOUND'
        );
      }

      // Validar que no esté ya revertido
      if (movimientoOriginal.estado === 'anulado') {
        throw new MovimientosInventarioServiceError(
          'Este movimiento ya ha sido anulado anteriormente',
          'ALREADY_REVERSED'
        );
      }

      if (movimientoOriginal.estado !== 'activo') {
        throw new MovimientosInventarioServiceError(
          `No se puede revertir un movimiento en estado '${movimientoOriginal.estado}'`,
          'INVALID_STATE'
        );
      }

      // Obtener el inventario
      const inventario = await Inventario.findByPk(
        movimientoOriginal.id_inventario,
        { transaction }
      );

      if (!inventario) {
        throw new MovimientosInventarioServiceError(
          'Inventario no encontrado',
          'INVENTORY_NOT_FOUND'
        );
      }

      // Calcular el movimiento inverso según el tipo
      let tipoMovimientoInverso, cantidadInversa;

      const mapeoInverso = {
        'entrada': 'devolucion',      // Entrada inversa es devolución
        'salida': 'entrada',          // Salida inversa es entrada
        'devolucion': 'salida',       // Devolución inversa es salida
        'transferencia': 'transferencia', // Transferencia se crea en el almacén inverso
        'ajuste': 'ajuste'            // Ajuste se revierte con otro ajuste
      };

      tipoMovimientoInverso = mapeoInverso[movimientoOriginal.tipo_movimiento];
      cantidadInversa = movimientoOriginal.cantidad;

      // Calcular nueva cantidad después de la reversión
      let cantidadActualizadaInventario = inventario.cantidad_actual;

      if (tipoMovimientoInverso === 'entrada' || tipoMovimientoInverso === 'devolucion') {
        cantidadActualizadaInventario += cantidadInversa;
      } else if (tipoMovimientoInverso === 'salida') {
        cantidadActualizadaInventario -= cantidadInversa;
        
        if (cantidadActualizadaInventario < 0) {
          throw new MovimientosInventarioServiceError(
            `Stock insuficiente para revertir. Disponible: ${inventario.cantidad_actual}, Requerido: ${cantidadInversa}`,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Crear movimiento de reversión
      const movimientoReversion = await MovimientosInventario.create({
        id_inventario: movimientoOriginal.id_inventario,
        tipo_movimiento: tipoMovimientoInverso,
        cantidad: cantidadInversa,
        cantidad_anterior: inventario.cantidad_actual,
        cantidad_nueva: cantidadActualizadaInventario,
        motivo: `REVERSIÓN: ${motivoReversion}`,
        id_usuario: idUsuarioReversion,
        referencia: `REV-${movimientoOriginal.id_movimiento}`,
        id_orden: null,
        estado: 'activo',
        id_movimiento_relacionado: idMovimientoOriginal
      }, { transaction });

      // Marcar el movimiento original como anulado (no eliminado)
      await movimientoOriginal.update({
        estado: 'anulado',
        id_movimiento_relacionado: movimientoReversion.id_movimiento
      }, { transaction });

      // Actualizar el inventario
      await inventario.update({
        cantidad_actual: cantidadActualizadaInventario,
        fecha_actualizacion: new Date()
      }, { transaction });

      await transaction.commit();

      return {
        movimientoOriginal: {
          id: movimientoOriginal.id_movimiento,
          estado: 'anulado'
        },
        movimientoReversion: movimientoReversion,
        ajusteInventario: {
          cantidad_anterior: inventario.cantidad_actual,
          cantidad_nueva: cantidadActualizadaInventario,
          diferencia: cantidadActualizadaInventario - inventario.cantidad_actual
        },
        mensaje: 'Movimiento revertido exitosamente. Se creó movimiento inverso.'
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al revertir movimiento: ${error.message}`,
        'REVERSION_FAILED'
      );
    }
  }

  // VALIDACIÓN - Obtener historial completo incluyendo reversiones
  async obtenerHistorialConReversiones(idMovimientoOriginal) {
    try {
      if (!idMovimientoOriginal) {
        throw new MovimientosInventarioServiceError(
          'El ID del movimiento es requerido',
          'MISSING_MOVEMENT_ID'
        );
      }

      const movimiento = await MovimientosInventario.findByPk(idMovimientoOriginal);

      if (!movimiento) {
        throw new MovimientosInventarioServiceError(
          `Movimiento con ID ${idMovimientoOriginal} no encontrado`,
          'NOT_FOUND'
        );
      }

      // Obtener movimientos relacionados (original + reversiones)
      const historial = await MovimientosInventario.findAll({
        where: {
          [Op.or]: [
            { id_movimiento: idMovimientoOriginal },
            { id_movimiento_relacionado: idMovimientoOriginal }
          ]
        },
        order: [['fecha_movimiento', 'ASC']]
      });

      return {
        movimientoOriginal: historial[0],
        reversiones: historial.slice(1),
        total: historial.length,
        estado: movimiento.estado,
        auditoria: historial.map(m => ({
          id: m.id_movimiento,
          tipo: m.tipo_movimiento,
          cantidad: m.cantidad,
          estado: m.estado,
          usuario: m.id_usuario,
          fecha: m.fecha_movimiento,
          motivo: m.motivo
        }))
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener historial: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // VALIDACIÓN - Verificar stock antes de movimiento
  async verificarStockParaMovimiento(idInventario, tipoMovimiento, cantidad) {
    try {
      if (!idInventario) {
        throw new MovimientosInventarioServiceError(
          'El ID del inventario es requerido',
          'MISSING_INVENTORY_ID'
        );
      }

      if (!tipoMovimiento) {
        throw new MovimientosInventarioServiceError(
          'El tipo de movimiento es requerido',
          'MISSING_MOVEMENT_TYPE'
        );
      }

      if (!cantidad || cantidad <= 0) {
        throw new MovimientosInventarioServiceError(
          'La cantidad debe ser mayor a cero',
          'INVALID_QUANTITY'
        );
      }

      const inventario = await Inventario.findByPk(idInventario);

      if (!inventario) {
        throw new MovimientosInventarioServiceError(
          `Inventario con ID ${idInventario} no encontrado`,
          'INVENTORY_NOT_FOUND'
        );
      }

      const tiposValidos = ['entrada', 'salida', 'ajuste', 'transferencia', 'devolucion'];
      if (!tiposValidos.includes(tipoMovimiento)) {
        throw new MovimientosInventarioServiceError(
          `Tipo de movimiento inválido. Debe ser: ${tiposValidos.join(', ')}`,
          'INVALID_MOVEMENT_TYPE'
        );
      }

      let stockSuficiente = true;
      let mensajeValidacion = '';
      let cantidadResultante = inventario.cantidad_actual;

      if (tipoMovimiento === 'salida' || tipoMovimiento === 'transferencia') {
        cantidadResultante = inventario.cantidad_actual - cantidad;
        
        if (inventario.cantidad_actual < cantidad) {
          stockSuficiente = false;
          mensajeValidacion = `Stock insuficiente. Disponible: ${inventario.cantidad_actual}, Requerido: ${cantidad}`;
        } else {
          mensajeValidacion = `Movimiento permitido. Stock resultante: ${cantidadResultante}`;
        }
      } else if (tipoMovimiento === 'entrada' || tipoMovimiento === 'devolucion') {
        cantidadResultante = inventario.cantidad_actual + cantidad;
        mensajeValidacion = `Movimiento permitido. Stock resultante: ${cantidadResultante}`;
      } else if (tipoMovimiento === 'ajuste') {
        cantidadResultante = cantidad;
        mensajeValidacion = `Ajuste permitido. Nueva cantidad: ${cantidad}`;
      }

      return {
        valido: stockSuficiente,
        stockActual: inventario.cantidad_actual,
        cantidadSolicitada: cantidad,
        cantidadResultante,
        diferencia: cantidadResultante - inventario.cantidad_actual,
        mensaje: mensajeValidacion
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al verificar stock: ${error.message}`,
        'VALIDATION_FAILED'
      );
    }
  }

  // ESTADÍSTICAS - Obtener historial de movimientos para auditoría
  async getHistorialAuditoria(idInventario, filtros = {}) {
    try {
      if (!idInventario) {
        throw new MovimientosInventarioServiceError(
          'El ID del inventario es requerido',
          'MISSING_INVENTORY_ID'
        );
      }

      // Validar que el inventario exista
      const inventario = await Inventario.findByPk(idInventario);
      if (!inventario) {
        throw new MovimientosInventarioServiceError(
          `Inventario con ID ${idInventario} no encontrado`,
          'INVENTORY_NOT_FOUND'
        );
      }

      const { limit = 100, offset = 0, incluirAnulados = false } = filtros;

      const where = { id_inventario: idInventario };
      if (!incluirAnulados) {
        where.estado = 'activo';
      }

      const { count, rows } = await MovimientosInventario.findAndCountAll({
        where,
        order: [['fecha_movimiento', 'DESC']],
        attributes: [
          'id_movimiento',
          'tipo_movimiento',
          'cantidad_anterior',
          'cantidad_nueva',
          'cantidad',
          'fecha_movimiento',
          'motivo',
          'referencia',
          'estado',
          'id_movimiento_relacionado'
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (count === 0) {
        throw new MovimientosInventarioServiceError(
          `No hay movimientos registrados para el inventario ${idInventario}`,
          'NO_RESULTS'
        );
      }

      return {
        historial: rows,
        total: count,
        id_inventario: idInventario,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(offset / limit) + 1,
        incluirAnulados
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al obtener historial de auditoría: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  // ESTADÍSTICAS - Reporte de movimientos por período
  async getReportePorPeriodo(fechaInicio, fechaFin, filtros = {}) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new MovimientosInventarioServiceError(
          'Los parámetros fecha_inicio y fecha_fin son requeridos',
          'MISSING_DATES'
        );
      }

      const fechaDesde = new Date(fechaInicio);
      const fechaHasta = new Date(fechaFin);

      if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
        throw new MovimientosInventarioServiceError(
          'Formato de fechas inválido',
          'INVALID_DATE_FORMAT'
        );
      }

      if (fechaDesde > fechaHasta) {
        throw new MovimientosInventarioServiceError(
          'fecha_inicio no puede ser mayor que fecha_fin',
          'INVALID_DATE_RANGE'
        );
      }

      const { estado = 'activo' } = filtros;

      const where = {
        fecha_movimiento: {
          [Op.between]: [fechaDesde, fechaHasta]
        }
      };

      if (estado) {
        where.estado = estado;
      }

      // Total por tipo
      const porTipo = await MovimientosInventario.findAll({
        where,
        attributes: [
          'tipo_movimiento',
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'cantidad_movimientos'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades']
        ],
        group: ['tipo_movimiento'],
        raw: true
      });

      // Total por usuario
      const porUsuario = await MovimientosInventario.findAll({
        where,
        attributes: [
          'id_usuario',
          [sequelize.fn('COUNT', sequelize.col('id_movimiento')), 'cantidad_movimientos'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_unidades']
        ],
        group: ['id_usuario'],
        raw: true
      });

      // Total movimientos
      const totalMovimientos = await MovimientosInventario.count({ where });

      // Movimientos anulados en el período
      const anulados = await MovimientosInventario.count({
        where: {
          ...where,
          estado: 'anulado'
        }
      });

      if (totalMovimientos === 0) {
        throw new MovimientosInventarioServiceError(
          'No hay movimientos registrados en el período especificado',
          'NO_RESULTS'
        );
      }

      return {
        periodo: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          dias: Math.floor((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24)) + 1
        },
        totalMovimientos,
        movimientosAnulados: anulados,
        porTipo: porTipo.map(p => ({
          tipo_movimiento: p.tipo_movimiento,
          cantidad_movimientos: parseInt(p.cantidad_movimientos) || 0,
          total_unidades: parseInt(p.total_unidades) || 0
        })),
        porUsuario: porUsuario.map(p => ({
          id_usuario: p.id_usuario,
          cantidad_movimientos: parseInt(p.cantidad_movimientos) || 0,
          total_unidades: parseInt(p.total_unidades) || 0
        }))
      };
    } catch (error) {
      if (error instanceof MovimientosInventarioServiceError) {
        throw error;
      }
      throw new MovimientosInventarioServiceError(
        `Error al generar reporte por período: ${error.message}`,
        'REPORT_FAILED'
      );
    }
  }
}

export default new MovimientosInventarioService();
