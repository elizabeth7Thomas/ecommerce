import carritoService from '../services/carrito.service.js';
import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class CarritoController {
  async getMyCart(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const carrito = await carritoService.getCartByCliente(cliente.id_cliente);
      res.status(200).json(response.success(carrito || { items: [], total: 0 }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  async addProductToCart(req, res) {
    try {
      const { id_usuario } = req;
      const { id_producto, cantidad = 1 } = req.body;

      if (!id_producto) {
        return res.status(400).json(response.badRequest('id_producto es requerido'));
      }

      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const carrito = await carritoService.addProductToCart(cliente.id_cliente, id_producto, cantidad);
      res.status(200).json(response.success(carrito, 'Producto agregado al carrito'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async removeProductFromCart(req, res) {
    try {
      const { id_usuario } = req;
      const { id_producto } = req.params;

      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const removed = await carritoService.removeProductFromCart(cliente.id_cliente, id_producto);
      if (!removed) {
        return res.status(404).json(response.notFound('Producto no encontrado en el carrito'));
      }

      res.status(200).json(response.noContent('Producto eliminado del carrito'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  async clearCart(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
      }

      const cleared = await carritoService.clearCart(cliente.id_cliente);
      if (!cleared) {
        return res.status(404).json(response.notFound('Carrito no encontrado'));
      }

      res.status(200).json(response.noContent('Carrito vaciado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CarritoController();
