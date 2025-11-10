import OportunidadesVenta from '../models/oportunidadesVenta.model.js';
import Cliente from '../models/cliente.model.js';
import Usuario from '../models/user.model.js';
import TareasCRM from '../models/tareasCRM.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

class OportunidadesVentaService {
  // Estados válidos: prospecto, calificado, negociación, propuesta, ganada, perdida
  // Etapas: prospecto, calificado, negociación, propuesta, cierre

  // CREATE - Crear nueva oportunidad
  async createOportunidad(data) {
    try {
      const {
        id_cliente,
        id_usuario_asignado,
        titulo,
        descripcion,
        valor_estimado,
        probabilidad_cierre,
        etapa,
        fecha_cierre_estimada
      } = data;

      // Validar cliente
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      // Validar usuario asignado si se proporciona
      if (id_usuario_asignado) {
        const usuario = await Usuario.findByPk(id_usuario_asignado);
        if (!usuario) {
          throw new Error('Usuario asignado no encontrado');
        }
      }

      // Validar probabilidad (0-100)
      if (probabilidad_cierre !== undefined && (probabilidad_cierre < 0 || probabilidad_cierre > 100)) {
        throw new Error('La probabilidad de cierre debe estar entre 0 y 100');
      }

      // Validar etapa
      const etapasValidas = ['prospecto', 'calificado', 'negociación', 'propuesta', 'cierre'];
      if (etapa && !etapasValidas.includes(etapa)) {
        throw new Error(`Etapa inválida. Debe ser: ${etapasValidas.join(', ')}`);
      }

      const oportunidad = await OportunidadesVenta.create({
        id_cliente,
        id_usuario_asignado: id_usuario_asignado || null,
        titulo,
        descripcion,
        valor_estimado: parseFloat(valor_estimado) || 0,
        probabilidad_cierre: probabilidad_cierre || 0,
        etapa: etapa || 'prospecto',
        estado: 'activo',
        fecha_cierre_estimada
      });

      return oportunidad;
    } catch (error) {
      throw new Error(`Error al crear oportunidad: ${error.message}`);
    }
  }

  // READ - Obtener todas las oportunidades
  async getAllOportunidades(filters = {}) {
    try {
      const {
        id_cliente,
        id_usuario_asignado,
        etapa,
        estado,
        page = 1,
        limit = 20
      } = filters;

      const where = {};

      if (id_cliente) where.id_cliente = id_cliente;
      if (id_usuario_asignado) where.id_usuario_asignado = id_usuario_asignado;
      if (etapa) where.etapa = etapa;
      if (estado) where.estado = estado;

      const offset = (page - 1) * limit;

      const { count, rows } = await OportunidadesVenta.findAndCountAll({
        where,
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido', 'email'] },
          { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario', 'email'] }
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        oportunidades: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener oportunidades: ${error.message}`);
    }
  }

  // READ - Obtener oportunidad por ID
  async getOportunidadById(id) {
    try {
      const oportunidad = await OportunidadesVenta.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Usuario, as: 'usuarioAsignado' },
          { model: TareasCRM, as: 'tareas', separate: true }
        ]
      });

      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      return oportunidad;
    } catch (error) {
      throw new Error(`Error al obtener oportunidad: ${error.message}`);
    }
  }

  // READ - Obtener oportunidades por cliente
  async getOportunidadesByCliente(idCliente, filters = {}) {
    try {
      const { page = 1, limit = 20, estado, etapa } = filters;

      const where = { id_cliente: idCliente };
      if (estado) where.estado = estado;
      if (etapa) where.etapa = etapa;

      const offset = (page - 1) * limit;

      const { count, rows } = await OportunidadesVenta.findAndCountAll({
        where,
        include: [
          { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        oportunidades: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener oportunidades del cliente: ${error.message}`);
    }
  }

  // READ - Obtener oportunidades por usuario asignado
  async getOportunidadesByUsuario(idUsuario, filters = {}) {
    try {
      const { page = 1, limit = 20, estado, etapa } = filters;

      const where = { id_usuario_asignado: idUsuario };
      if (estado) where.estado = estado;
      if (etapa) where.etapa = etapa;

      const offset = (page - 1) * limit;

      const { count, rows } = await OportunidadesVenta.findAndCountAll({
        where,
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] }
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        oportunidades: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener oportunidades del usuario: ${error.message}`);
    }
  }

  // READ - Obtener oportunidades por estado
  async getOportunidadesByEstado(estado, filters = {}) {
    try {
      const estadosValidos = ['activo', 'pausado', 'completado', 'archivado'];
      if (!estadosValidos.includes(estado)) {
        throw new Error(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`);
      }

      const { page = 1, limit = 20, etapa } = filters;

      const where = { estado };
      if (etapa) where.etapa = etapa;

      const offset = (page - 1) * limit;

      const { count, rows } = await OportunidadesVenta.findAndCountAll({
        where,
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
          { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        oportunidades: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener oportunidades por estado: ${error.message}`);
    }
  }

  // READ - Obtener oportunidades por etapa
  async getOportunidadesByEtapa(etapa, filters = {}) {
    try {
      const etapasValidas = ['prospecto', 'calificado', 'negociación', 'propuesta', 'cierre'];
      if (!etapasValidas.includes(etapa)) {
        throw new Error(`Etapa inválida. Debe ser: ${etapasValidas.join(', ')}`);
      }

      const { page = 1, limit = 20, estado } = filters;

      const where = { etapa };
      if (estado) where.estado = estado;

      const offset = (page - 1) * limit;

      const { count, rows } = await OportunidadesVenta.findAndCountAll({
        where,
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
          { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      return {
        oportunidades: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener oportunidades por etapa: ${error.message}`);
    }
  }

  // UPDATE - Actualizar oportunidad completa
  async updateOportunidad(id, data) {
    try {
      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      // Validar usuario si se cambia
      if (data.id_usuario_asignado && data.id_usuario_asignado !== oportunidad.id_usuario_asignado) {
        const usuario = await Usuario.findByPk(data.id_usuario_asignado);
        if (!usuario) {
          throw new Error('Usuario asignado no encontrado');
        }
      }

      // Validar probabilidad
      if (data.probabilidad_cierre !== undefined && (data.probabilidad_cierre < 0 || data.probabilidad_cierre > 100)) {
        throw new Error('La probabilidad de cierre debe estar entre 0 y 100');
      }

      // Validar etapa
      if (data.etapa) {
        const etapasValidas = ['prospecto', 'calificado', 'negociación', 'propuesta', 'cierre'];
        if (!etapasValidas.includes(data.etapa)) {
          throw new Error(`Etapa inválida. Debe ser: ${etapasValidas.join(', ')}`);
        }
      }

      // Validar estado
      if (data.estado) {
        const estadosValidos = ['activo', 'pausado', 'completado', 'archivado'];
        if (!estadosValidos.includes(data.estado)) {
          throw new Error(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`);
        }
      }

      await oportunidad.update(data);
      return oportunidad;
    } catch (error) {
      throw new Error(`Error al actualizar oportunidad: ${error.message}`);
    }
  }

  // UPDATE - Cambiar etapa
  async cambiarEtapa(id, etapa) {
    try {
      const etapasValidas = ['prospecto', 'calificado', 'negociación', 'propuesta', 'cierre'];
      if (!etapasValidas.includes(etapa)) {
        throw new Error(`Etapa inválida. Debe ser: ${etapasValidas.join(', ')}`);
      }

      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      await oportunidad.update({ etapa });
      return oportunidad;
    } catch (error) {
      throw new Error(`Error al cambiar etapa: ${error.message}`);
    }
  }

  // UPDATE - Cambiar estado
  async cambiarEstado(id, estado) {
    try {
      const estadosValidos = ['activo', 'pausado', 'completado', 'archivado'];
      if (!estadosValidos.includes(estado)) {
        throw new Error(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`);
      }

      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      await oportunidad.update({ estado });
      return oportunidad;
    } catch (error) {
      throw new Error(`Error al cambiar estado: ${error.message}`);
    }
  }

  // UPDATE - Marcar como ganada
  async marcarComoGanada(id, fechaCierre) {
    try {
      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      await oportunidad.update({
        estado: 'completado',
        etapa: 'cierre',
        fecha_cierre_real: fechaCierre || new Date(),
        resultado_final: 'ganada'
      });

      return oportunidad;
    } catch (error) {
      throw new Error(`Error al marcar como ganada: ${error.message}`);
    }
  }

  // UPDATE - Marcar como perdida
  async marcarComoPerdida(id, motivoPerdida, fechaCierre) {
    try {
      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      await oportunidad.update({
        estado: 'completado',
        etapa: 'cierre',
        fecha_cierre_real: fechaCierre || new Date(),
        resultado_final: 'perdida',
        motivo_perdida: motivoPerdida
      });

      return oportunidad;
    } catch (error) {
      throw new Error(`Error al marcar como perdida: ${error.message}`);
    }
  }

  // DELETE - Eliminar oportunidad
  async deleteOportunidad(id) {
    try {
      const oportunidad = await OportunidadesVenta.findByPk(id);
      if (!oportunidad) {
        throw new Error('Oportunidad no encontrada');
      }

      await oportunidad.destroy();
      return { message: 'Oportunidad eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar oportunidad: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Pipeline de ventas
  async getPipelineVentas(filtros = {}) {
    try {
      const { id_usuario_asignado, estado = 'activo' } = filtros;

      const where = { estado };
      if (id_usuario_asignado) {
        where.id_usuario_asignado = id_usuario_asignado;
      }

      const oportunidades = await OportunidadesVenta.findAll({
        where,
        attributes: ['etapa', 'valor_estimado', 'probabilidad_cierre', 'id_oportunidad']
      });

      // Agrupar por etapa
      const pipeline = {};
      const etapasValidas = ['prospecto', 'calificado', 'negociación', 'propuesta', 'cierre'];
      
      etapasValidas.forEach(etapa => {
        pipeline[etapa] = {
          cantidad: 0,
          valor_total: 0,
          valor_esperado: 0,
          probabilidad_promedio: 0
        };
      });

      oportunidades.forEach(opp => {
        if (!pipeline[opp.etapa]) {
          pipeline[opp.etapa] = {
            cantidad: 0,
            valor_total: 0,
            valor_esperado: 0,
            probabilidad_promedio: 0
          };
        }
        pipeline[opp.etapa].cantidad++;
        pipeline[opp.etapa].valor_total += parseFloat(opp.valor_estimado || 0);
        const probabilidad = (opp.probabilidad_cierre || 0) / 100;
        pipeline[opp.etapa].valor_esperado += parseFloat(opp.valor_estimado || 0) * probabilidad;
        pipeline[opp.etapa].probabilidad_promedio += opp.probabilidad_cierre || 0;
      });

      // Calcular promedios
      Object.keys(pipeline).forEach(etapa => {
        if (pipeline[etapa].cantidad > 0) {
          pipeline[etapa].probabilidad_promedio = Math.round(
            pipeline[etapa].probabilidad_promedio / pipeline[etapa].cantidad
          );
        }
      });

      return pipeline;
    } catch (error) {
      throw new Error(`Error al obtener pipeline de ventas: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Resumen general
  async getResumenOportunidades(filtros = {}) {
    try {
      const { id_usuario_asignado } = filtros;

      const where = {};
      if (id_usuario_asignado) {
        where.id_usuario_asignado = id_usuario_asignado;
      }

      // Total de oportunidades
      const total = await OportunidadesVenta.count({ where });

      // Por estado
      const porEstado = await OportunidadesVenta.findAll({
        where,
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id_oportunidad')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('valor_estimado')), 'valor_total']
        ],
        group: ['estado']
      });

      // Por etapa
      const porEtapa = await OportunidadesVenta.findAll({
        where,
        attributes: [
          'etapa',
          [sequelize.fn('COUNT', sequelize.col('id_oportunidad')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('valor_estimado')), 'valor_total']
        ],
        group: ['etapa']
      });

      // Valor total de oportunidades activas
      const valorTotalActivas = await OportunidadesVenta.sum('valor_estimado', {
        where: { ...where, estado: 'activo' }
      });

      return {
        total,
        porEstado: porEstado.map(p => ({
          estado: p.dataValues.estado,
          cantidad: parseInt(p.dataValues.cantidad) || 0,
          valor_total: parseFloat(p.dataValues.valor_total) || 0
        })),
        porEtapa: porEtapa.map(p => ({
          etapa: p.dataValues.etapa,
          cantidad: parseInt(p.dataValues.cantidad) || 0,
          valor_total: parseFloat(p.dataValues.valor_total) || 0
        })),
        valorTotalActivas: parseFloat(valorTotalActivas) || 0
      };
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Oportunidades próximas a vencer
  async getOportunidadesProximasAVencer(diasAntelacion = 7) {
    try {
      const fechaHoy = new Date();
      const fechaFuturo = new Date(fechaHoy.getTime() + diasAntelacion * 24 * 60 * 60 * 1000);

      const oportunidades = await OportunidadesVenta.findAll({
        where: {
          estado: 'activo',
          fecha_cierre_estimada: {
            [Op.between]: [fechaHoy, fechaFuturo]
          }
        },
        include: [
          { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
          { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
        ],
        order: [['fecha_cierre_estimada', 'ASC']]
      });

      return oportunidades;
    } catch (error) {
      throw new Error(`Error al obtener oportunidades próximas a vencer: ${error.message}`);
    }
  }
}

export default new OportunidadesVentaService();
