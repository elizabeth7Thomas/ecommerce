import { Direccion } from '../models/index.js';

class DireccionService {
  async createDireccion(data) {
    return Direccion.create(data);
  }

  async getDireccionById(id) {
    return Direccion.findByPk(id);
  }

  async getDireccionesByCliente(id_cliente) {
    return Direccion.findAll({ where: { id_cliente } });
  }

  async updateDireccion(id, updates) {
    const d = await Direccion.findByPk(id);
    if (!d) throw new Error('Dirección no encontrada');
    await d.update(updates);
    return d;
  }

  async deleteDireccion(id) {
    const d = await Direccion.findByPk(id);
    if (!d) throw new Error('Dirección no encontrada');
    await d.destroy();
    return true;
  }
}

export default new DireccionService();
