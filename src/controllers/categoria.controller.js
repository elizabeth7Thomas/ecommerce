import categoriaService from '../services/categoria.service.js';

class CategoriaController {
  async createCategoria(req, res) {
    try {
      const categoria = await categoriaService.createCategoria(req.body);
      res.status(201).json({ message: 'Categoría creada exitosamente', categoria });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllCategorias(req, res) {
    try {
      const categorias = await categoriaService.getAllCategorias();
      res.status(200).json(categorias);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getCategoriaById(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.getCategoriaById(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json(categoria);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.updateCategoria(id, req.body);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json({ message: 'Categoría actualizada', categoria });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.deleteCategoria(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json({ message: 'Categoría desactivada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new CategoriaController();
