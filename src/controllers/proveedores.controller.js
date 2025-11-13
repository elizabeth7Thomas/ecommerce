import proveedoresService from '../services/proveedores.service.js';
import response from '../utils/response.js';

class ProveedoresController {
  async create(req, res) {
    try {
      const data = req.body;
      if (!data.nombre_proveedor)
        return res.status(400).json(response.badRequest('El nombre del proveedor es requerido'));

      const proveedor = await proveedoresService.create(data);
      return res.status(201).json(response.created(proveedor, 'Proveedor creado exitosamente'));
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      return res
        .status(500)
        .json(response.handleError(error));
    }
  }

  async getAll(req, res) {
    try {
      const proveedores = await proveedoresService.getAll(req.query);
      return res.status(200).json(response.success(proveedores, 'Proveedores obtenidos exitosamente'));
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return res.status(500).json(response.handleError(error));
    }
  }

  async getById(req, res) {
    try {
      const proveedor = await proveedoresService.getById(req.params.id);
      return res.status(200).json(response.success(proveedor, 'Proveedor obtenido exitosamente'));
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      return res.status(500).json(response.handleError(error));
    }
  }

  async update(req, res) {
    try {
      const proveedor = await proveedoresService.update(req.params.id, req.body);
      return res.status(200).json(response.success(proveedor, 'Proveedor actualizado exitosamente'));
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      return res.status(500).json(response.handleError(error));
    }
  }

  async toggleActive(req, res) {
    try {
      const proveedor = await proveedoresService.toggleActive(req.params.id);
      return res.status(200).json(response.success(
        proveedor,
        `Proveedor ${proveedor.activo ? 'activado' : 'desactivado'} exitosamente`
      ));
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
      return res.status(500).json(response.handleError(error));
    }
  }

  async delete(req, res) {
    try {
      const hard = req.query.hard === 'true';
      const proveedor = await proveedoresService.delete(req.params.id, hard);
      const msg = hard
        ? 'Proveedor eliminado permanentemente'
        : 'Proveedor desactivado exitosamente';
      return res.status(200).json(response.success(proveedor, msg));
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return res.status(500).json(response.handleError(error));
    }
  }

  async getStats(req, res) {
    try {
      const stats = await proveedoresService.getStats();
      return res.status(200).json(response.success(stats, 'Estadísticas obtenidas exitosamente'));
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json(response.handleError(error));
    }
  }
}

export default new ProveedoresController();
