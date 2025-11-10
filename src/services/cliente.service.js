import { Cliente, Usuario } from '../models/index.js';

class ClienteService {
  async createCliente(data) {
    return Cliente.create(data);
  }

  async getClienteById(id) {
    return Cliente.findByPk(id, { 
      include: [{ model: Usuario, as: 'usuario' }] 
    });
  }

  async getClienteByUsuarioId(id_usuario) {
    return Cliente.findOne({ where: { id_usuario } });
  }

  async updateCliente(id, updates) {
    const c = await Cliente.findByPk(id);
    if (!c) throw new Error('Cliente no encontrado');
    await c.update(updates);
    return c;
  }

  async deleteCliente(id) {
    const c = await Cliente.findByPk(id);
    if (!c) throw new Error('Cliente no encontrado');
    await c.destroy();
    return true;
  }

  // ✅ Obtener todos los clientes con paginación y búsqueda
  async getAllClientes({ page = 1, limit = 10, search }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      const { Op } = require('sequelize');
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
  }

  // ✅ Actualizar cliente por ID de usuario
  async updateClienteByUsuarioId(id_usuario, updates) {
    const c = await Cliente.findOne({ where: { id_usuario } });
    if (!c) throw new Error('Cliente no encontrado');
    await c.update(updates);
    return c;
  }

  // ✅ Eliminar cliente por ID de usuario
  async deleteClienteByUsuarioId(id_usuario) {
    const c = await Cliente.findOne({ where: { id_usuario } });
    if (!c) throw new Error('Cliente no encontrado');
    await c.destroy();
    return true;
  }

  // ✅ Buscar clientes por criterios específicos
  async searchClientes({ nombre, email, telefono }) {
    const { Op } = require('sequelize');
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

    return Cliente.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario' }],
      order: [['id_cliente', 'DESC']]
    });
  }
}

export default new ClienteService();
