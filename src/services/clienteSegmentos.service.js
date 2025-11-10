import ClienteSegmentos from '../models/clienteSegmentos.model.js';
import sequelize from '../config/database.js';

class ClienteSegmentosService {
  // CREATE - Asignar segmento a cliente
  async asignarSegmentoACliente(clienteSegmentoData) {
    try {
      // Verificar si ya existe la asignación
      const existe = await ClienteSegmentos.findOne({
        where: {
          id_cliente: clienteSegmentoData.id_cliente,
          id_segmento: clienteSegmentoData.id_segmento
        }
      });

      if (existe) {
        throw new Error('El cliente ya está asignado a este segmento');
      }

      const clienteSegmento = await ClienteSegmentos.create(clienteSegmentoData);
      return clienteSegmento;
    } catch (error) {
      throw new Error(`Error al asignar segmento a cliente: ${error.message}`);
    }
  }

  // CREATE - Asignar múltiples segmentos a un cliente
  async asignarMultiplesSegmentos(idCliente, segmentosIds) {
    try {
      const asignaciones = [];
      
      for (const idSegmento of segmentosIds) {
        // Verificar si ya existe la asignación
        const existe = await ClienteSegmentos.findOne({
          where: { id_cliente: idCliente, id_segmento: idSegmento }
        });

        if (!existe) {
          const asignacion = await ClienteSegmentos.create({
            id_cliente: idCliente,
            id_segmento: idSegmento
          });
          asignaciones.push(asignacion);
        }
      }

      return {
        message: `${asignaciones.length} segmento(s) asignado(s) exitosamente`,
        asignaciones,
        totalAsignados: asignaciones.length
      };
    } catch (error) {
      throw new Error(`Error al asignar múltiples segmentos: ${error.message}`);
    }
  }

  // CREATE - Asignar múltiples clientes a un segmento
  async asignarMultiplesClientes(idSegmento, clientesIds) {
    try {
      const asignaciones = [];
      
      for (const idCliente of clientesIds) {
        // Verificar si ya existe la asignación
        const existe = await ClienteSegmentos.findOne({
          where: { id_cliente: idCliente, id_segmento: idSegmento }
        });

        if (!existe) {
          const asignacion = await ClienteSegmentos.create({
            id_cliente: idCliente,
            id_segmento: idSegmento
          });
          asignaciones.push(asignacion);
        }
      }

      return {
        message: `${asignaciones.length} cliente(s) asignado(s) exitosamente`,
        asignaciones,
        totalAsignados: asignaciones.length
      };
    } catch (error) {
      throw new Error(`Error al asignar múltiples clientes: ${error.message}`);
    }
  }

  // READ - Obtener asignación específica
  async getAsignacion(idCliente, idSegmento) {
    try {
      const asignacion = await ClienteSegmentos.findOne({
        where: {
          id_cliente: idCliente,
          id_segmento: idSegmento
        }
      });

      if (!asignacion) {
        throw new Error('Asignación no encontrada');
      }

      return asignacion;
    } catch (error) {
      throw new Error(`Error al obtener asignación: ${error.message}`);
    }
  }

  // READ - Obtener todos los segmentos de un cliente
  async getSegmentosByCliente(idCliente, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await ClienteSegmentos.findAndCountAll({
        where: { id_cliente: idCliente },
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_asignacion', 'DESC']]
      });

      return {
        segmentos: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener segmentos del cliente: ${error.message}`);
    }
  }

  // READ - Obtener todos los clientes de un segmento
  async getClientesBySegmento(idSegmento, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await ClienteSegmentos.findAndCountAll({
        where: { id_segmento: idSegmento },
        limit: parseInt(limit),
        offset: offset,
        order: [['fecha_asignacion', 'DESC']]
      });

      return {
        clientes: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener clientes del segmento: ${error.message}`);
    }
  }

  // READ - Obtener clientes en múltiples segmentos
  async getClientesEnMultiplesSegmentos(segmentosIds) {
    try {
      const clientes = await ClienteSegmentos.findAll({
        attributes: [
          'id_cliente',
          [sequelize.fn('COUNT', sequelize.col('id_segmento')), 'total_segmentos']
        ],
        where: {
          id_segmento: segmentosIds
        },
        group: ['id_cliente'],
        having: sequelize.literal(`COUNT(id_segmento) = ${segmentosIds.length}`)
      });

      return clientes;
    } catch (error) {
      throw new Error(`Error al obtener clientes en múltiples segmentos: ${error.message}`);
    }
  }

  // UPDATE - Actualizar fecha de asignación
  async actualizarFechaAsignacion(idCliente, idSegmento, nuevaFecha) {
    try {
      const [updated] = await ClienteSegmentos.update(
        { fecha_asignacion: nuevaFecha },
        {
          where: {
            id_cliente: idCliente,
            id_segmento: idSegmento
          }
        }
      );

      if (updated === 0) {
        throw new Error('Asignación no encontrada');
      }

      return await this.getAsignacion(idCliente, idSegmento);
    } catch (error) {
      throw new Error(`Error al actualizar fecha de asignación: ${error.message}`);
    }
  }

  // DELETE - Eliminar asignación
  async eliminarAsignacion(idCliente, idSegmento) {
    try {
      const deleted = await ClienteSegmentos.destroy({
        where: {
          id_cliente: idCliente,
          id_segmento: idSegmento
        }
      });

      if (deleted === 0) {
        throw new Error('Asignación no encontrada');
      }

      return { message: 'Asignación eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar asignación: ${error.message}`);
    }
  }

  // DELETE - Eliminar todos los segmentos de un cliente
  async eliminarSegmentosDeCliente(idCliente) {
    try {
      const deleted = await ClienteSegmentos.destroy({
        where: { id_cliente: idCliente }
      });

      return {
        message: `${deleted} asignación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar segmentos del cliente: ${error.message}`);
    }
  }

  // DELETE - Eliminar todos los clientes de un segmento
  async eliminarClientesDeSegmento(idSegmento) {
    try {
      const deleted = await ClienteSegmentos.destroy({
        where: { id_segmento: idSegmento }
      });

      return {
        message: `${deleted} asignación(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      throw new Error(`Error al eliminar clientes del segmento: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de segmentos por cliente
  async getEstadisticasCliente(idCliente) {
    try {
      const totalSegmentos = await ClienteSegmentos.count({
        where: { id_cliente: idCliente }
      });

      const segmentoMasAntiguo = await ClienteSegmentos.findOne({
        where: { id_cliente: idCliente },
        order: [['fecha_asignacion', 'ASC']]
      });

      const segmentoMasReciente = await ClienteSegmentos.findOne({
        where: { id_cliente: idCliente },
        order: [['fecha_asignacion', 'DESC']]
      });

      return {
        totalSegmentos,
        segmentoMasAntiguo: segmentoMasAntiguo || null,
        segmentoMasReciente: segmentoMasReciente || null
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del cliente: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener estadísticas de clientes por segmento
  async getEstadisticasSegmento(idSegmento) {
    try {
      const totalClientes = await ClienteSegmentos.count({
        where: { id_segmento: idSegmento }
      });

      const clienteMasAntiguo = await ClienteSegmentos.findOne({
        where: { id_segmento: idSegmento },
        order: [['fecha_asignacion', 'ASC']]
      });

      const clienteMasReciente = await ClienteSegmentos.findOne({
        where: { id_segmento: idSegmento },
        order: [['fecha_asignacion', 'DESC']]
      });

      return {
        totalClientes,
        clienteMasAntiguo: clienteMasAntiguo || null,
        clienteMasReciente: clienteMasReciente || null
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del segmento: ${error.message}`);
    }
  }

  // ESTADÍSTICAS - Obtener distribución de clientes por segmentos
  async getDistribucionSegmentos() {
    try {
      const distribucion = await ClienteSegmentos.findAll({
        attributes: [
          'id_segmento',
          [sequelize.fn('COUNT', sequelize.col('id_cliente')), 'total_clientes']
        ],
        group: ['id_segmento'],
        order: [[sequelize.literal('total_clientes'), 'DESC']]
      });

      return distribucion;
    } catch (error) {
      throw new Error(`Error al obtener distribución de segmentos: ${error.message}`);
    }
  }

  // UTILIDAD - Verificar si existe asignación
  async verificarAsignacion(idCliente, idSegmento) {
    try {
      const existe = await ClienteSegmentos.findOne({
        where: {
          id_cliente: idCliente,
          id_segmento: idSegmento
        }
      });
      return !!existe;
    } catch (error) {
      throw new Error(`Error al verificar asignación: ${error.message}`);
    }
  }

  // UTILIDAD - Obtener clientes sin segmentos
  async getClientesSinSegmentos() {
    try {
      // Esta consulta necesitaría una subconsulta para encontrar clientes que no están en ClienteSegmentos
      // Depende de tu estructura de base de datos
      throw new Error('Método no implementado - requiere configuración de modelo Cliente');
    } catch (error) {
      throw new Error(`Error al obtener clientes sin segmentos: ${error.message}`);
    }
  }

  // UTILIDAD - Obtener segmentos sin clientes
  async getSegmentosSinClientes() {
    try {
      // Esta consulta necesitaría una subconsulta para encontrar segmentos que no están en ClienteSegmentos
      // Depende de tu estructura de base de datos
      throw new Error('Método no implementado - requiere configuración de modelo Segmento');
    } catch (error) {
      throw new Error(`Error al obtener segmentos sin clientes: ${error.message}`);
    }
  }
}

export default new ClienteSegmentosService();
