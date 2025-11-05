import direccionService from '../services/direccion.service.js';
import clienteService from '../services/cliente.service.js';

class DireccionController {
  async createDireccion(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const direccionData = { ...req.body, id_cliente: cliente.id_cliente };
      const direccion = await direccionService.createDireccion(direccionData);
      res.status(201).json({ message: 'Dirección creada exitosamente', direccion });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getMyDirecciones(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const direcciones = await direccionService.getDireccionesByCliente(cliente.id_cliente);
      res.status(200).json(direcciones);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getDireccionById(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      // Verificar que la dirección pertenezca al usuario (o sea admin)
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json({ message: 'Acceso denegado' });
        }
      }

      res.status(200).json(direccion);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateDireccion(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      // Verificar propiedad
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json({ message: 'Acceso denegado' });
        }
      }

      const updated = await direccionService.updateDireccion(id, req.body);
      res.status(200).json({ message: 'Dirección actualizada', direccion: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteDireccion(req, res) {
    try {
      const { id } = req.params;
      const { id_usuario, rol } = req;

      const direccion = await direccionService.getDireccionById(id);
      if (!direccion) {
        return res.status(404).json({ message: 'Dirección no encontrada' });
      }

      // Verificar propiedad
      if (rol !== 'administrador') {
        const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
        if (!cliente || direccion.id_cliente !== cliente.id_cliente) {
          return res.status(403).json({ message: 'Acceso denegado' });
        }
      }

      await direccionService.deleteDireccion(id);
      res.status(200).json({ message: 'Dirección eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new DireccionController();
