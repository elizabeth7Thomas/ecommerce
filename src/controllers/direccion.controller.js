import direccionService from '../services/direccion.service.js';
import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class DireccionController {
  async createDireccion(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const direccionData = { ...req.body, id_cliente: cliente.id_cliente };
      const direccion = await direccionService.createDireccion(direccionData);
      res.status(201).json(response.created(direccion, 'Dirección creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async getMyDirecciones(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const direcciones = await direccionService.getDireccionesByCliente(cliente.id_cliente);
      res.status(200).json(response.success(direcciones));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getDireccionById(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json(response.notFound('Dirección no encontrada'));
      }

      // Verificar que la dirección pertenezca al usuario (o sea admin)
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json(response.forbidden());
        }
      }

      res.status(200).json(response.success(direccion));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async updateDireccion(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json(response.notFound('Dirección no encontrada'));
      }

      // Verificar propiedad
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json(response.forbidden());
        }
      }

      const updated = await direccionService.updateDireccion(id, req.body);
      res.status(200).json(response.success(updated, 'Dirección actualizada'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async deleteDireccion(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json(response.notFound('Dirección no encontrada'));
      }

      // Verificar propiedad
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json(response.forbidden());
        }
      }

      await direccionService.deleteDireccion(id);
      res.status(200).json(response.noContent('Dirección eliminada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new DireccionController();
