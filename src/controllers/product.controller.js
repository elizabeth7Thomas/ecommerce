import productoService from '../services/producto.service.js';

class ProductoController {
    async getAllProductos(req, res) {
        try {
            const productos = await productoService.getAllProductos();
            res.status(200).json(productos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getProductoById(req, res) {
        try {
            const { id } = req.params;
            const producto = await productoService.getProductoById(id);
            res.status(200).json(producto);
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async createProducto(req, res) {
        try {
            const nuevoProducto = await productoService.createProducto(req.body);
            res.status(201).json({ message: 'Producto creado exitosamente', producto: nuevoProducto });
        } catch (error) {
            if (error.message.includes('no existe')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async updateProducto(req, res) {
        try {
            const { id } = req.params;
            const productoActualizado = await productoService.updateProducto(id, req.body);
            res.status(200).json({ message: 'Producto actualizado exitosamente', producto: productoActualizado });
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('no existe')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async deleteProducto(req, res) {
        try {
            const { id } = req.params;
            await productoService.deleteProducto(id);
            res.status(200).json({ message: 'Producto desactivado exitosamente' });
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }
}

export default new ProductoController();