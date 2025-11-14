import metodoPagoService from '../services/metodoPago.service.js';
import * as response from '../utils/response.js';

class MetodoPagoController {
  async createMetodoPago(req, res) {
    try {
      const metodoPago = await metodoPagoService.createMetodoPago(req.body);
      res.status(201).json(response.created(metodoPago, 'Método de pago creado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async getAllMetodosPago(req, res) {
    try {
      const { activo, disponible_online, disponible_tienda, tipo_metodo, nombre, order, sort } = req.query;
      
      const options = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        disponible_online: disponible_online !== undefined ? disponible_online === 'true' : undefined,
        disponible_tienda: disponible_tienda !== undefined ? disponible_tienda === 'true' : undefined,
        tipo_metodo,
        nombre,
        order,
        sort
      };

      const metodosPago = await metodoPagoService.getAllMetodosPago(options);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getMetodoPagoById(req, res) {
    try {
      const { id } = req.params;
      const metodoPago = await metodoPagoService.getMetodoPagoById(id);
      res.status(200).json(response.success(metodoPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  async updateMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const metodoPago = await metodoPagoService.updateMetodoPago(id, req.body);
      res.status(200).json(response.success(metodoPago, 'Método de pago actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async deleteMetodoPago(req, res) {
    try {
      const { id } = req.params;
      await metodoPagoService.deleteMetodoPago(id);
      res.status(200).json(response.success(null, 'Método de pago desactivado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getActiveMetodosPago(req, res) {
    try {
      const { disponible_online, disponible_tienda, tipo_metodo } = req.query;
      
      const options = {
        disponible_online: disponible_online !== undefined ? disponible_online === 'true' : undefined,
        disponible_tienda: disponible_tienda !== undefined ? disponible_tienda === 'true' : undefined,
        tipo_metodo
      };

      const metodosPago = await metodoPagoService.getActiveMetodosPago(options);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getOnlineMetodosPago(req, res) {
    try {
      const metodosPago = await metodoPagoService.getOnlineMetodosPago();
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getStoreMetodosPago(req, res) {
    try {
      const metodosPago = await metodoPagoService.getStoreMetodosPago();
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async getMetodosPagoByTipo(req, res) {
    try {
      const { tipo } = req.params;
      const metodosPago = await metodoPagoService.getMetodosPagoByTipo(tipo);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async activateMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const metodoPago = await metodoPagoService.activateMetodoPago(id);
      res.status(200).json(response.success(metodoPago, 'Método de pago activado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async updateConfiguracion(req, res) {
    try {
      const { id } = req.params;
      const { configuracion } = req.body;
      const metodoPago = await metodoPagoService.updateConfiguracion(id, configuracion);
      res.status(200).json(response.success(metodoPago, 'Configuración actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }
}

export default new MetodoPagoController();