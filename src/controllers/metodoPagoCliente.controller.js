import metodoPagoClienteService from '../services/metodoPagoCliente.service.js';
import * as response from '../utils/response.js';

class MetodoPagoClienteController {
  async createMetodoPagoCliente(req, res) {
    try {
      const idCliente = req.user.id_cliente; // Obtenido del middleware de autenticación
      const metodoPagoCliente = await metodoPagoClienteService.createMetodoPagoCliente(req.body, idCliente);
      res.status(201).json(response.created(metodoPagoCliente, 'Método de pago agregado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async getMetodosPagoByCliente(req, res) {
    try {
      const idCliente = req.user.id_cliente; // Obtenido del middleware de autenticación
      const { activo, verificado, es_predeterminado } = req.query;
      
      const options = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        verificado: verificado !== undefined ? verificado === 'true' : undefined,
        es_predeterminado: es_predeterminado !== undefined ? es_predeterminado === 'true' : undefined
      };

      const metodosPago = await metodoPagoClienteService.getMetodosPagoByCliente(idCliente, options);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getMetodoPagoClienteById(req, res) {
    try {
      const { id } = req.params;
      const idCliente = req.user.id_cliente;
      
      const metodoPagoCliente = await metodoPagoClienteService.getMetodoPagoClienteById(id);
      
      // Verificar que el método de pago pertenece al cliente autenticado
      if (metodoPagoCliente.id_cliente !== idCliente) {
        return res.status(403).json(response.forbidden('No tienes acceso a este método de pago'));
      }

      res.status(200).json(response.success(metodoPagoCliente));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  async updateMetodoPagoCliente(req, res) {
    try {
      const { id } = req.params;
      const idCliente = req.user.id_cliente;
      const metodoPagoCliente = await metodoPagoClienteService.updateMetodoPagoCliente(id, req.body, idCliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async deleteMetodoPagoCliente(req, res) {
    try {
      const { id } = req.params;
      const idCliente = req.user.id_cliente;
      await metodoPagoClienteService.deleteMetodoPagoCliente(id, idCliente);
      res.status(200).json(response.success(null, 'Método de pago eliminado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getDefaultMetodoPago(req, res) {
    try {
      const idCliente = req.user.id_cliente;
      const metodoPago = await metodoPagoClienteService.getDefaultMetodoPago(idCliente);
      
      if (!metodoPago) {
        return res.status(404).json(response.notFound('No tienes un método de pago predeterminado configurado'));
      }

      res.status(200).json(response.success(metodoPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async setAsDefault(req, res) {
    try {
      const { id } = req.params;
      const idCliente = req.user.id_cliente;
      const metodoPagoCliente = await metodoPagoClienteService.setAsDefault(id, idCliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago establecido como predeterminado'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async verifyMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const idCliente = req.user.id_cliente;
      const metodoPagoCliente = await metodoPagoClienteService.verifyMetodoPago(id, idCliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago verificado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // Endpoint para administradores - obtener métodos de pago de cualquier cliente
  async getMetodosPagoByClienteAdmin(req, res) {
    try {
      const { idCliente } = req.params;
      const { activo, verificado, es_predeterminado } = req.query;
      
      const options = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        verificado: verificado !== undefined ? verificado === 'true' : undefined,
        es_predeterminado: es_predeterminado !== undefined ? es_predeterminado === 'true' : undefined
      };

      const metodosPago = await metodoPagoClienteService.getMetodosPagoByCliente(idCliente, options);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // Endpoint para administradores - verificar método de pago de cualquier cliente
  async verifyMetodoPagoAdmin(req, res) {
    try {
      const { id } = req.params;
      const { idCliente } = req.body;
      const metodoPagoCliente = await metodoPagoClienteService.verifyMetodoPago(id, idCliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago verificado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }
}

export default new MetodoPagoClienteController();