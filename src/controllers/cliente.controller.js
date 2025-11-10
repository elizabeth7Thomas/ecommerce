import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class ClienteController {
  async createCliente(req, res) {
    try {
      const { id_usuario } = req; // ← Del token JWT (middleware verifyToken)
      const clienteData = {
        ...req.body,
        id_usuario // ← Se asigna automáticamente
      };
      const cliente = await clienteService.createCliente(clienteData);
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

  // ✅ Obtener todos los clientes (con paginación/filtros)
  async getAllClientes(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const clientes = await clienteService.getAllClientes({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ✅ Actualizar perfil propio (sin necesidad de ID en params)
  async updateMyProfile(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.updateClienteByUsuarioId(id_usuario, req.body);
      res.status(200).json(response.success(cliente, 'Perfil actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // ✅ Eliminar perfil propio
  async deleteMyProfile(req, res) {
    try {
      const { id_usuario } = req;
      const result = await clienteService.deleteClienteByUsuarioId(id_usuario);
      res.status(200).json(response.noContent('Perfil eliminado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // ✅ Buscar clientes por criterios específicos
  async searchClientes(req, res) {
    try {
      const { nombre, email, telefono } = req.query;
      const clientes = await clienteService.searchClientes({
        nombre,
        email,
        telefono
      });
      res.status(200).json(response.success(clientes));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new ClienteController();
