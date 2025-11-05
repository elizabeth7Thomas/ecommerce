import { Cliente, Usuario } from '../models/index.js';

class ClienteService {
  async createCliente(data) {
    return Cliente.create(data);
  }

  async getClienteById(id) {
    return Cliente.findByPk(id, { include: [Usuario] });
  }

  async getClienteByUsuarioId(id_usuario) {
    return Cliente.findOne({ where: { id_usuario } });
  }

  async updateCliente(id, updates) {
    const c = await Cliente.findByPk(id);
    if (!c) return null;
    await c.update(updates);
    return c;
  }

  async deleteCliente(id) {
    const c = await Cliente.findByPk(id);
    if (!c) return null;
    await c.destroy();
    return true;
  }
}

export default new ClienteService();
