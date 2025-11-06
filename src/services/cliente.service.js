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
}

export default new ClienteService();
