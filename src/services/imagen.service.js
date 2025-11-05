import { Producto, ProductoImagen } from '../models/index.js';
import sequelize from '../config/database.js';

class ImagenService {
  async getImagesByProduct(id_producto) {
    // Verificar que exista el producto
    const producto = await Producto.findByPk(id_producto);
    if (!producto) throw new Error('Producto no encontrado');
    return ProductoImagen.findAll({ where: { id_producto } });
  }

  async addImageToProduct(id_producto, { url_imagen, es_principal = false }) {
    // Verificar producto
    const producto = await Producto.findByPk(id_producto);
    if (!producto) throw new Error('Producto no encontrado');

    if (es_principal) {
      const t = await sequelize.transaction();
      try {
        await ProductoImagen.update({ es_principal: false }, { where: { id_producto }, transaction: t });
        const nueva = await ProductoImagen.create({ id_producto, url_imagen, es_principal }, { transaction: t });
        await t.commit();
        return nueva;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    return ProductoImagen.create({ id_producto, url_imagen, es_principal });
  }

  async deleteImage(id_imagen) {
    const img = await ProductoImagen.findByPk(id_imagen);
    if (!img) throw new Error('Imagen no encontrada');
    await img.destroy();
    return true;
  }

  async setPrincipal(id_imagen) {
    const img = await ProductoImagen.findByPk(id_imagen);
    if (!img) throw new Error('Imagen no encontrada');
    const t = await sequelize.transaction();
    try {
      await ProductoImagen.update({ es_principal: false }, { where: { id_producto: img.id_producto }, transaction: t });
      img.es_principal = true;
      await img.save({ transaction: t });
      await t.commit();
      return img;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

export default new ImagenService();