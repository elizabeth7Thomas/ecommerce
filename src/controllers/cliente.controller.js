import clienteService from '../services/cliente.service.js';

class ClienteController {
  async createCliente(req, res) {
    try {
      const cliente = await clienteService.createCliente(req.body);
      res.status(201).json({ message: 'Cliente creado exitosamente', cliente });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getClienteById(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.getClienteById(id);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.status(200).json(cliente);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getMyProfile(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }
      res.status(200).json(cliente);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateCliente(req, res) {
    try {
      const { id } = req.params;
      const cliente = await clienteService.updateCliente(id, req.body);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.status(200).json({ message: 'Cliente actualizado', cliente });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteCliente(req, res) {
    try {
      const { id } = req.params;
      const result = await clienteService.deleteCliente(id);
      if (!result) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.status(200).json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new ClienteController();
