import { Cliente, Usuario } from '../models/index.js';
import { Op } from 'sequelize';

// Clase personalizada para errores de negocio
class ClienteServiceError extends Error {
  constructor(message, code = 'CLIENTE_ERROR') {
    super(message);
    this.name = 'ClienteServiceError';
    this.code = code;
  }
}

class ClienteService {
  async createCliente(data) {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new ClienteServiceError('Los datos del cliente no pueden estar vacíos', 'EMPTY_DATA');
      }
      return await Cliente.create(data);
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al crear cliente: ${error.message}`,
        'CREATE_FAILED'
      );
    }
  }

  async getClienteById(id) {
    try {
      if (!id) {
        throw new ClienteServiceError('El ID del cliente es requerido', 'MISSING_ID');
      }
      const cliente = await Cliente.findByPk(id, { 
        include: [{ model: Usuario, as: 'usuario' }] 
      });
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente con ID ${id} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      return cliente;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al obtener cliente: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  async getClienteByUsuarioId(id_usuario) {
    try {
      if (!id_usuario) {
        throw new ClienteServiceError('El ID de usuario es requerido', 'MISSING_USER_ID');
      }
      
      const cliente = await Cliente.findOne({ 
        where: { id_usuario },
        include: [{ model: Usuario, as: 'usuario' }]
      });
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente para usuario ${id_usuario} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      return cliente;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al obtener cliente por usuario: ${error.message}`,
        'GET_FAILED'
      );
    }
  }

  async updateCliente(id, updates) {
    try {
      if (!id) {
        throw new ClienteServiceError('El ID del cliente es requerido', 'MISSING_ID');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new ClienteServiceError('Los datos a actualizar no pueden estar vacíos', 'EMPTY_DATA');
      }
      
      const cliente = await Cliente.findByPk(id);
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente con ID ${id} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      await cliente.update(updates);
      return cliente;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al actualizar cliente: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  async deleteCliente(id) {
    try {
      if (!id) {
        throw new ClienteServiceError('El ID del cliente es requerido', 'MISSING_ID');
      }
      
      const cliente = await Cliente.findByPk(id);
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente con ID ${id} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      await cliente.destroy();
      return true;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al eliminar cliente: ${error.message}`,
        'DELETE_FAILED'
      );
    }
  }

  async getAllClientes({ page = 1, limit = 10, search }) {
    try {
      // Validación de parámetros
      if (page < 1 || limit < 1) {
        throw new ClienteServiceError(
          'Page y limit deben ser mayores a 0',
          'INVALID_PARAMS'
        );
      }

      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { '$usuario.correo_electronico$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Cliente.findAndCountAll({
        where,
        include: [{ model: Usuario, as: 'usuario' }],
        limit,
        offset,
        order: [['id_cliente', 'DESC']]
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al obtener clientes: ${error.message}`,
        'GET_ALL_FAILED'
      );
    }
  }

  async updateClienteByUsuarioId(id_usuario, updates) {
    try {
      if (!id_usuario) {
        throw new ClienteServiceError('El ID de usuario es requerido', 'MISSING_USER_ID');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new ClienteServiceError('Los datos a actualizar no pueden estar vacíos', 'EMPTY_DATA');
      }

      const cliente = await Cliente.findOne({ where: { id_usuario } });
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente para usuario ${id_usuario} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      await cliente.update(updates);
      return cliente;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al actualizar cliente por usuario: ${error.message}`,
        'UPDATE_FAILED'
      );
    }
  }

  async deleteClienteByUsuarioId(id_usuario) {
    try {
      if (!id_usuario) {
        throw new ClienteServiceError('El ID de usuario es requerido', 'MISSING_USER_ID');
      }

      const cliente = await Cliente.findOne({ where: { id_usuario } });
      
      if (!cliente) {
        throw new ClienteServiceError(
          `Cliente para usuario ${id_usuario} no encontrado`,
          'NOT_FOUND'
        );
      }
      
      await cliente.destroy();
      return true;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al eliminar cliente por usuario: ${error.message}`,
        'DELETE_FAILED'
      );
    }
  }

  async searchClientes({ nombre, email, telefono }) {
    try {
      if (!nombre && !email && !telefono) {
        throw new ClienteServiceError(
          'Al menos un criterio de búsqueda debe ser proporcionado',
          'EMPTY_SEARCH'
        );
      }

      const where = {};

      if (nombre) {
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${nombre}%` } },
          { apellido: { [Op.iLike]: `%${nombre}%` } }
        ];
      }

      if (email) {
        where['$usuario.correo_electronico$'] = { [Op.iLike]: `%${email}%` };
      }

      if (telefono) {
        where.telefono = { [Op.iLike]: `%${telefono}%` };
      }

      const clientes = await Cliente.findAll({
        where,
        include: [{ model: Usuario, as: 'usuario' }],
        order: [['id_cliente', 'DESC']]
      });

      if (clientes.length === 0) {
        throw new ClienteServiceError(
          'No se encontraron clientes con los criterios especificados',
          'NOT_FOUND'
        );
      }

      return clientes;
    } catch (error) {
      if (error instanceof ClienteServiceError) {
        throw error;
      }
      throw new ClienteServiceError(
        `Error al buscar clientes: ${error.message}`,
        'SEARCH_FAILED'
      );
    }
  }
}

export default new ClienteService();
