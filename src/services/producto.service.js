import { Producto, CategoriaProducto, ProductoImagen } from '../models/index.js';

class ProductoService {
    async createProducto(data) {
        // Validar que la categoría exista
        if (data.id_categoria) {
            const categoria = await CategoriaProducto.findByPk(data.id_categoria);
            if (!categoria) throw new Error('La categoría especificada no existe.');
        }
        return Producto.create(data);
    }

    async getAllProductos({ activoOnly = true } = {}) {
        const where = activoOnly ? { activo: true } : {};
        return Producto.findAll({ where, include: [CategoriaProducto, ProductoImagen] });
    }

    async getProductoById(id) {
        const producto = await Producto.findByPk(id, { include: [CategoriaProducto, ProductoImagen] });
        if (!producto) throw new Error('Producto no encontrado');
        return producto;
    }

    async updateProducto(id, updates) {
        const p = await Producto.findByPk(id);
        if (!p) throw new Error('Producto no encontrado');
        if (updates.id_categoria) {
            const cat = await CategoriaProducto.findByPk(updates.id_categoria);
            if (!cat) throw new Error('La nueva categoría especificada no existe');
        }
        await p.update(updates);
        return p;
    }

    async deleteProducto(id) {
        const p = await Producto.findByPk(id);
        if (!p) throw new Error('Producto no encontrado');
        p.activo = false;
        await p.save();
        return p;
    }

    async changeStock(id, delta) {
        const p = await Producto.findByPk(id);
        if (!p) throw new Error('Producto no encontrado');
        p.stock = Number(p.stock) + Number(delta);
        if (p.stock < 0) throw new Error('Stock cannot be negative');
        await p.save();
        return p;
    }
}

export default new ProductoService();