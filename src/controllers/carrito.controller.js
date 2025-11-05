import carritoService from '../services/carrito.service.js';
import clienteService from '../services/cliente.service.js';

class CarritoController {
  async getMyCart(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const carrito = await carritoService.getCartByCliente(cliente.id_cliente);
      res.status(200).json(carrito || { message: 'Carrito vacío' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async addProductToCart(req, res) {
    try {
      const { id_usuario } = req;
      const { id_producto, cantidad = 1 } = req.body;

      if (!id_producto) {
        return res.status(400).json({ message: 'id_producto es requerido' });
      }

      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const carrito = await carritoService.addProductToCart(cliente.id_cliente, id_producto, cantidad);
      res.status(200).json({ message: 'Producto agregado al carrito', carrito });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async removeProductFromCart(req, res) {
    try {
      const { id_usuario } = req;
      const { id_producto } = req.params;

      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const removed = await carritoService.removeProductFromCart(cliente.id_cliente, id_producto);
      if (!removed) {
        return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
      }

      res.status(200).json({ message: 'Producto eliminado del carrito' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async clearCart(req, res) {
    try {
      const { id_usuario } = req;
      const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
      if (!cliente) {
        return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
      }

      const cleared = await carritoService.clearCart(cliente.id_cliente);
      if (!cleared) {
        return res.status(404).json({ message: 'Carrito no encontrado' });
      }

      res.status(200).json({ message: 'Carrito vaciado exitosamente' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new CarritoController();
