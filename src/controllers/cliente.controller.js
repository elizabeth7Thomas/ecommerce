import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class ClienteController {
  async createCliente(req, res) {
    try {
      const cliente = await clienteService.createCliente(req.body);
      res.status(201).json(response.created(cliente, 'Cliente creado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async getClienteById(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.getClienteById(id);
      if (!cliente) {
        return res.status(404).json(response.notFound('Cliente no encontrado'));
      }
      res.status(200).json(response.success(cliente));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getMyProfile(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }
      res.status(200).json(response.success(cliente));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async updateCliente(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.updateCliente(id, req.body);
      res.status(200).json(response.success(cliente, 'Cliente actualizado'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async deleteCliente(req, res) {
    try {
      const { id } = req.params;
      const result = await clienteService.deleteCliente(id);
      res.status(200).json(response.noContent('Cliente eliminado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new ClienteController();
