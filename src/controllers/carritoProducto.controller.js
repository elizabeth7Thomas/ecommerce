import carritoProductoService from '../services/carritoProducto.service.js';
import * as response from '../utils/response.js';

class CarritoProductoController {
  // CREATE - Agregar producto al carrito
  async agregarProducto(req, res) {
    try {
      const carritoProducto = await carritoProductoService.agregarProducto(req.body);
      res.status(201).json(response.created(carritoProducto, 'Producto agregado al carrito exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener producto del carrito por ID
  async getProductoCarritoById(req, res) {
    try {
      const { id } = req.params;
      const carritoProducto = await carritoProductoService.getProductoCarritoById(id);
      res.status(200).json(response.success(carritoProducto));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todos los productos de un carrito
  async getProductosByCarrito(req, res) {
    try {
      const { idCarrito } = req.params;
      const productos = await carritoProductoService.getProductosByCarrito(idCarrito);
      res.status(200).json(response.success(productos));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener producto específico en carrito
  async getProductoEnCarrito(req, res) {
    try {
      const { idCarrito, idProducto } = req.params;
      const carritoProducto = await carritoProductoService.getProductoEnCarrito(idCarrito, idProducto);
      res.status(200).json(response.success(carritoProducto));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener resumen del carrito
  async getResumenCarrito(req, res) {
    try {
      const { idCarrito } = req.params;
      const resumen = await carritoProductoService.getResumenCarrito(idCarrito);
      res.status(200).json(response.success(resumen));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar cantidad de producto
  async actualizarCantidad(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;
      
      if (!cantidad || cantidad < 0) {
        return res.status(400).json(response.badRequest('La cantidad debe ser un número positivo'));
      }

      const carritoProducto = await carritoProductoService.actualizarCantidad(id, cantidad);
      res.status(200).json(response.success(carritoProducto, 'Cantidad actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar precio unitario
  async actualizarPrecio(req, res) {
    try {
      const { id } = req.params;
      const { precio_unitario } = req.body;
      
      if (!precio_unitario || precio_unitario < 0) {
        return res.status(400).json(response.badRequest('El precio debe ser un número positivo'));
      }

      const carritoProducto = await carritoProductoService.actualizarPrecio(id, precio_unitario);
      res.status(200).json(response.success(carritoProducto, 'Precio actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Actualizar producto completo
  async updateCarritoProducto(req, res) {
    try {
      const { id } = req.params;
      const carritoProducto = await carritoProductoService.updateCarritoProducto(id, req.body);
      res.status(200).json(response.success(carritoProducto, 'Producto actualizado exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar producto del carrito por ID
  async eliminarProducto(req, res) {
    try {
      const { id } = req.params;
      const result = await carritoProductoService.eliminarProducto(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Eliminar producto específico por carrito y producto
  async eliminarProductoEspecifico(req, res) {
    try {
      const { idCarrito, idProducto } = req.params;
      const result = await carritoProductoService.eliminarProductoEspecifico(idCarrito, idProducto);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // DELETE - Vaciar carrito completo
  async vaciarCarrito(req, res) {
    try {
      const { idCarrito } = req.params;
      const result = await carritoProductoService.vaciarCarrito(idCarrito);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UTILIDAD - Verificar si producto está en carrito
  async verificarProductoEnCarrito(req, res) {
    try {
      const { idCarrito, idProducto } = req.params;
      const existe = await carritoProductoService.verificarProductoEnCarrito(idCarrito, idProducto);
      res.status(200).json(response.success({ existe }));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Estadísticas del carrito
  async getEstadisticasCarrito(req, res) {
    try {
      const { idCarrito } = req.params;
      const estadisticas = await carritoProductoService.getEstadisticasCarrito(idCarrito);
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CarritoProductoController();