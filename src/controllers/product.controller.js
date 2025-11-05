import productoService from '../services/producto.service.js';
import * as response from '../utils/response.js';

class ProductoController {
    async getAllProductos(req, res) {
        try {
            const productos = await productoService.getAllProductos();
            res.status(200).json(response.success(productos));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async getProductoById(req, res) {
        try {
            const { id } = req.params;
            const producto = await productoService.getProductoById(id);
            res.status(200).json(response.success(producto));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async createProducto(req, res) {
        try {
            const nuevoProducto = await productoService.createProducto(req.body);
            res.status(201).json(response.created(nuevoProducto, 'Producto creado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async updateProducto(req, res) {
        try {
            const { id } = req.params;
            const productoActualizado = await productoService.updateProducto(id, req.body);
            res.status(200).json(response.success(productoActualizado, 'Producto actualizado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async deleteProducto(req, res) {
        try {
            const { id } = req.params;
            await productoService.deleteProducto(id);
            res.status(200).json(response.noContent('Producto desactivado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
}

export default new ProductoController();