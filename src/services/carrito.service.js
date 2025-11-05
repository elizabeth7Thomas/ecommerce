import sequelize from '../config/database.js';
import { CarritoCompras, CarritoProducto, Producto } from '../models/index.js';

class CarritoService {
  async getOrCreateActiveCart(id_cliente, t = null) {
    const [carrito] = await CarritoCompras.findOrCreate({
      where: { id_cliente, estado: 'activo' },
      defaults: { id_cliente, estado: 'activo' },
      transaction: t,
    });
    return carrito;
  }

  async getCartByCliente(id_cliente) {
    return CarritoCompras.findOne({ where: { id_cliente, estado: 'activo' }, include: [{ model: CarritoProducto, include: [Producto] }] });
  }

  async addProductToCart(id_cliente, id_producto, cantidad = 1) {
    const t = await sequelize.transaction();
    try {
      const carrito = await this.getOrCreateActiveCart(id_cliente, t);

      const producto = await Producto.findByPk(id_producto, { transaction: t });
      if (!producto) throw new Error('Producto no encontrado');
      if (Number(producto.stock) < Number(cantidad)) throw new Error('Stock insuficiente');

      const existing = await CarritoProducto.findOne({ where: { id_carrito: carrito.id_carrito, id_producto }, transaction: t });
      if (existing) {
        existing.cantidad = Number(existing.cantidad) + Number(cantidad);
        await existing.save({ transaction: t });
      } else {
        await CarritoProducto.create({ id_carrito: carrito.id_carrito, id_producto, cantidad, precio_unitario: producto.precio }, { transaction: t });
      }

      await t.commit();
      return await this.getCartByCliente(id_cliente);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async removeProductFromCart(id_cliente, id_producto) {
    const carrito = await CarritoCompras.findOne({ where: { id_cliente, estado: 'activo' } });
    if (!carrito) throw new Error('Carrito no encontrado');
    const removed = await CarritoProducto.destroy({ where: { id_carrito: carrito.id_carrito, id_producto } });
    return removed > 0;
  }

  async clearCart(id_cliente) {
    const carrito = await CarritoCompras.findOne({ where: { id_cliente, estado: 'activo' } });
    if (!carrito) return false;
    await CarritoProducto.destroy({ where: { id_carrito: carrito.id_carrito } });
    carrito.estado = 'abandonado';
    await carrito.save();
    return true;
  }

  async markCartConverted(id_cliente) {
    const carrito = await CarritoCompras.findOne({ where: { id_cliente, estado: 'activo' } });
    if (!carrito) throw new Error('Carrito no encontrado');
    carrito.estado = 'convertido';
    await carrito.save();
    return carrito;
  }
}

export default new CarritoService();
