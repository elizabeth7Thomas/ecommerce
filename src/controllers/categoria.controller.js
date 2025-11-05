import categoriaService from '../services/categoria.service.js';
import * as response from '../utils/response.js';

class CategoriaController {
  async createCategoria(req, res) {
    try {
      const categoria = await categoriaService.createCategoria(req.body);
      res.status(201).json(response.created(categoria, 'Categoría creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async getAllCategorias(req, res) {
    try {
      const categorias = await categoriaService.getAllCategorias();
      res.status(200).json(response.success(categorias));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getCategoriaById(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.getCategoriaById(id);
      if (!categoria) {
        return res.status(404).json(response.notFound('Categoría no encontrada'));
      }
      res.status(200).json(response.success(categoria));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async updateCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.updateCategoria(id, req.body);
      res.status(200).json(response.success(categoria, 'Categoría actualizada'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async deleteCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.deleteCategoria(id);
      res.status(200).json(response.noContent('Categoría desactivada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CategoriaController();
