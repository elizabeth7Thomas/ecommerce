import { Direccion, Cliente } from '../models/index.js';
import { Op } from 'sequelize';

// Clase personalizada para errores de negocio
class DireccionServiceError extends Error {
  constructor(message, code = 'DIRECCION_ERROR') {
    super(message);
    this.name = 'DireccionServiceError';
    this.code = code;
  }
}

class DireccionService {
  async createDireccion(data) {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new DireccionServiceError('Los datos de la dirección no pueden estar vacíos', 'EMPTY_DATA');
      }

      if (!data.id_cliente) {
        throw new DireccionServiceError('El ID del cliente es requerido', 'MISSING_CLIENT_ID');
      }

      // Validar que el cliente exista
      const clienteExiste = await Cliente.findByPk(data.id_cliente);
      if (!clienteExiste) {
        throw new DireccionServiceError(
          `Cliente con ID ${data.id_cliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const direccion = await Direccion.create(data);
      return direccion;
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al crear dirección: ${error.message}`,
        'CREATE_FAILED'
      );
    }
  }

  async getDireccionById(id) {
    try {
      if (!id) {
        throw new DireccionServiceError('El ID de la dirección es requerido', 'MISSING_ID');
      }

      const direccion = await Direccion.findByPk(id, {
        include: [{ model: Cliente, as: 'cliente' }]
      });

      if (!direccion) {
        throw new DireccionServiceError(
          `Dirección con ID ${id} no encontrada`,
          'NOT_FOUND'
        );
      }

      return direccion;
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al obtener dirección: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  async getDireccionesByCliente(id_cliente, options = {}) {
    try {
      if (!id_cliente) {
        throw new DireccionServiceError('El ID del cliente es requerido', 'MISSING_CLIENT_ID');
      }

      // Validar que el cliente exista
      const clienteExiste = await Cliente.findByPk(id_cliente);
      if (!clienteExiste) {
        throw new DireccionServiceError(
          `Cliente con ID ${id_cliente} no encontrado`,
          'CLIENT_NOT_FOUND'
        );
      }

      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      const { count, rows } = await Direccion.findAndCountAll({
        where: { id_cliente: id_cliente },
        limit: parseInt(limit),
        offset: offset,
        order: [['es_principal', 'DESC'], ['id_direccion', 'DESC']]
      });

      if (count === 0) {
        throw new DireccionServiceError(
          `No hay direcciones registradas para el cliente ${id_cliente}`,
          'NO_ADDRESSES'
        );
      }

      return {
        direcciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al obtener direcciones del cliente: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  async updateDireccion(id, updates) {
    try {
      if (!id) {
        throw new DireccionServiceError('El ID de la dirección es requerido', 'MISSING_ID');
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new DireccionServiceError('Los datos a actualizar no pueden estar vacíos', 'EMPTY_DATA');
      }

      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        throw new DireccionServiceError(
          `Dirección con ID ${id} no encontrada`,
          'NOT_FOUND'
        );
      }

      // Si cambia el cliente, validar que exista
      if (updates.id_cliente && updates.id_cliente !== direccion.id_cliente) {
        const clienteExiste = await Cliente.findByPk(updates.id_cliente);
        if (!clienteExiste) {
          throw new DireccionServiceError(
            `Cliente con ID ${updates.id_cliente} no encontrado`,
            'CLIENT_NOT_FOUND'
          );
        }
      }

      // Si se marca como principal, desmarcar otras del mismo cliente
      if (updates.es_principal === true) {
        await Direccion.update(
          { es_principal: false },
          {
            where: {
              id_cliente: direccion.id_cliente,
              id_direccion: { [Op.ne]: id }
            }
          }
        );
      }

      await direccion.update(updates);
      return direccion;
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al actualizar dirección: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  async deleteDireccion(id) {
    try {
      if (!id) {
        throw new DireccionServiceError('El ID de la dirección es requerido', 'MISSING_ID');
      }

      const direccion = await Direccion.findByPk(id);

      if (!direccion) {
        throw new DireccionServiceError(
          `Dirección con ID ${id} no encontrada`,
          'NOT_FOUND'
        );
      }

      await direccion.destroy();
      return { message: 'Dirección eliminada exitosamente', id };
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al eliminar dirección: ${error.message}`,
        'DELETE_FAILED'
      );
    }
  }

  // MÉTODOS ADICIONALES

  async getDireccionPrincipal(id_cliente) {
    try {
      if (!id_cliente) {
        throw new DireccionServiceError('El ID del cliente es requerido', 'MISSING_CLIENT_ID');
      }

      const direccion = await Direccion.findOne({
        where: {
          id_cliente: id_cliente,
          es_principal: true
        }
      });

      if (!direccion) {
        throw new DireccionServiceError(
          `No hay dirección principal para el cliente ${id_cliente}`,
          'NO_PRIMARY_ADDRESS'
        );
      }

      return direccion;
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al obtener dirección principal: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  async setDireccionPrincipal(id_cliente, id_direccion) {
    try {
      if (!id_cliente) {
        throw new DireccionServiceError('El ID del cliente es requerido', 'MISSING_CLIENT_ID');
      }

      if (!id_direccion) {
        throw new DireccionServiceError('El ID de la dirección es requerido', 'MISSING_ID');
      }

      // Validar que la dirección pertenece al cliente
      const direccion = await Direccion.findOne({
        where: {
          id_direccion: id_direccion,
          id_cliente: id_cliente
        }
      });

      if (!direccion) {
        throw new DireccionServiceError(
          `Dirección con ID ${id_direccion} no encontrada para el cliente ${id_cliente}`,
          'NOT_FOUND'
        );
      }

      // Desmarcar todas las direcciones principales del cliente
      await Direccion.update(
        { es_principal: false },
        { where: { id_cliente: id_cliente } }
      );

      // Marcar como principal
      await direccion.update({ es_principal: true });

      return direccion;
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al establecer dirección principal: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  async searchDirecciones(criterios, options = {}) {
    try {
      const { ciudad, estado, pais, page = 1, limit = 50 } = { ...criterios, ...options };

      if (!ciudad && !estado && !pais) {
        throw new DireccionServiceError(
          'Al menos un criterio de búsqueda debe ser proporcionado (ciudad, estado, pais)',
          'EMPTY_SEARCH'
        );
      }

      const where = {};

      if (ciudad) where.ciudad = { [Op.iLike]: `%${ciudad}%` };
      if (estado) where.estado = { [Op.iLike]: `%${estado}%` };
      if (pais) where.pais = { [Op.iLike]: `%${pais}%` };

      const offset = (page - 1) * limit;

      const { count, rows } = await Direccion.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: offset,
        order: [['id_direccion', 'DESC']]
      });

      if (count === 0) {
        throw new DireccionServiceError(
          'No se encontraron direcciones con los criterios especificados',
          'NOT_FOUND'
        );
      }

      return {
        direcciones: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al buscar direcciones: ${error.message}`,
        'SEARCH_FAILED'
      );
    }
  }

  async deleteDireccionesByCliente(id_cliente) {
    try {
      if (!id_cliente) {
        throw new DireccionServiceError('El ID del cliente es requerido', 'MISSING_CLIENT_ID');
      }

      const deleted = await Direccion.destroy({
        where: { id_cliente: id_cliente }
      });

      if (deleted === 0) {
        throw new DireccionServiceError(
          `No hay direcciones para eliminar del cliente ${id_cliente}`,
          'NOT_FOUND'
        );
      }

      return {
        message: `${deleted} dirección(es) eliminada(s) exitosamente`,
        totalEliminadas: deleted
      };
    } catch (error) {
      if (error instanceof DireccionServiceError) {
        throw error;
      }
      throw new DireccionServiceError(
        `Error al eliminar direcciones del cliente: ${error.message}`,
        'DELETE_FAILED'
      );
    }
  }
}

export default new DireccionService();
