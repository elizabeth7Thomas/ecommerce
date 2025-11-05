import { CategoriaProducto } from '../models/index.js';

class CategoriaService {
  async createCategoria(data) {
    return CategoriaProducto.create(data);
  }

  async getAllCategorias() {
    return CategoriaProducto.findAll();
  }

  async getCategoriaById(id) {
    return CategoriaProducto.findByPk(id);
  }

  async updateCategoria(id, updates) {
    const c = await CategoriaProducto.findByPk(id);
    if (!c) return null;
    await c.update(updates);
    return c;
  }

  async deleteCategoria(id) {
    const c = await CategoriaProducto.findByPk(id);
    if (!c) return null;
    c.activo = false;
    await c.save();
    return c;
  }
}

export default new CategoriaService();
