import { ProductoImagen } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

class ProductoImagenService {
    /**
     * Crear nueva imagen de producto
     * @param {Object} data - Datos de la imagen
     * @returns {Promise<Object>}
     */
    async createImagen(data) {
        const transaction = await sequelize.transaction();
        try {
            // Validar datos requeridos
            if (!data.id_producto) {
                throw new Error('El ID del producto es requerido');
            }
            if (!data.url_imagen?.trim()) {
                throw new Error('La URL de la imagen es requerida');
            }

            // Si se marca como principal, desmarcar las demás
            if (data.es_principal) {
                await ProductoImagen.update(
                    { es_principal: false },
                    { 
                        where: { id_producto: data.id_producto },
                        transaction 
                    }
                );
            } else {
                // Si no hay imagen principal, hacer esta la principal
                const tienePrincipal = await ProductoImagen.count({
                    where: { 
                        id_producto: data.id_producto,
                        es_principal: true
                    },
                    transaction
                });

                if (tienePrincipal === 0) {
                    data.es_principal = true;
                }
            }

            const imagen = await ProductoImagen.create({
                ...data,
                url_imagen: data.url_imagen.trim()
            }, { transaction });

            await transaction.commit();
            return imagen;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al crear imagen: ${error.message}`);
        }
    }

    /**
     * Crear múltiples imágenes para un producto
     * @param {number} idProducto - ID del producto
     * @param {Array} urls - Array de URLs de imágenes
     * @param {number} indexPrincipal - Índice de la imagen principal (opcional)
     * @returns {Promise<Array>}
     */
    async createMultipleImagenes(idProducto, urls, indexPrincipal = 0) {
        const transaction = await sequelize.transaction();
        try {
            if (!idProducto) {
                throw new Error('El ID del producto es requerido');
            }
            if (!Array.isArray(urls) || urls.length === 0) {
                throw new Error('Debe proporcionar al menos una URL de imagen');
            }

            // Desmarcar todas las imágenes principales existentes
            await ProductoImagen.update(
                { es_principal: false },
                { 
                    where: { id_producto: idProducto },
                    transaction 
                }
            );

            const imagenesCreadas = [];

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i]?.trim();
                if (!url) continue;

                const imagen = await ProductoImagen.create({
                    id_producto: idProducto,
                    url_imagen: url,
                    es_principal: i === indexPrincipal
                }, { transaction });

                imagenesCreadas.push(imagen);
            }

            if (imagenesCreadas.length === 0) {
                throw new Error('No se pudo crear ninguna imagen válida');
            }

            await transaction.commit();
            return imagenesCreadas;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al crear múltiples imágenes: ${error.message}`);
        }
    }

    /**
     * Obtener todas las imágenes
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllImagenes(options = {}) {
        try {
            const where = {};

            if (options.id_producto) {
                where.id_producto = options.id_producto;
            }

            if (options.es_principal !== undefined) {
                where.es_principal = options.es_principal;
            }

            const orderField = options.order || 'id_imagen';
            const sortDirection = options.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            return await ProductoImagen.findAll({
                where,
                order: [[orderField, sortDirection]]
            });
        } catch (error) {
            throw new Error(`Error al obtener imágenes: ${error.message}`);
        }
    }

    /**
     * Obtener imagen por ID
     * @param {number} id - ID de la imagen
     * @returns {Promise<Object>}
     */
    async getImagenById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const imagen = await ProductoImagen.findByPk(id);

            if (!imagen) {
                throw new Error('Imagen no encontrada');
            }

            return imagen;
        } catch (error) {
            throw new Error(`Error al obtener imagen: ${error.message}`);
        }
    }

    /**
     * Obtener todas las imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<Array>}
     */
    async getImagenesByProducto(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            return await ProductoImagen.findAll({
                where: { id_producto: idProducto },
                order: [
                    ['es_principal', 'DESC'], // Principal primero
                    ['id_imagen', 'ASC']
                ]
            });
        } catch (error) {
            throw new Error(`Error al obtener imágenes del producto: ${error.message}`);
        }
    }

    /**
     * Obtener imagen principal de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<Object|null>}
     */
    async getImagenPrincipal(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            return await ProductoImagen.findOne({
                where: { 
                    id_producto: idProducto,
                    es_principal: true
                }
            });
        } catch (error) {
            throw new Error(`Error al obtener imagen principal: ${error.message}`);
        }
    }

    /**
     * Obtener imágenes secundarias de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<Array>}
     */
    async getImagenesSecundarias(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            return await ProductoImagen.findAll({
                where: { 
                    id_producto: idProducto,
                    es_principal: false
                },
                order: [['id_imagen', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener imágenes secundarias: ${error.message}`);
        }
    }

    /**
     * Actualizar imagen
     * @param {number} id - ID de la imagen
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateImagen(id, updates) {
        const transaction = await sequelize.transaction();
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const imagen = await ProductoImagen.findByPk(id, { transaction });

            if (!imagen) {
                throw new Error('Imagen no encontrada');
            }

            // Si se actualiza la URL, validar que no esté vacía
            if (updates.url_imagen !== undefined && !updates.url_imagen?.trim()) {
                throw new Error('La URL de la imagen no puede estar vacía');
            }

            // Si se marca como principal, desmarcar las demás del mismo producto
            if (updates.es_principal === true && !imagen.es_principal) {
                await ProductoImagen.update(
                    { es_principal: false },
                    { 
                        where: { 
                            id_producto: imagen.id_producto,
                            id_imagen: { [Op.ne]: id }
                        },
                        transaction 
                    }
                );
            }

            // Si se desmarca como principal, asignar otra como principal
            if (updates.es_principal === false && imagen.es_principal) {
                const otraImagen = await ProductoImagen.findOne({
                    where: { 
                        id_producto: imagen.id_producto,
                        id_imagen: { [Op.ne]: id }
                    },
                    transaction
                });

                if (otraImagen) {
                    await otraImagen.update({ es_principal: true }, { transaction });
                }
            }

            if (updates.url_imagen) {
                updates.url_imagen = updates.url_imagen.trim();
            }

            await imagen.update(updates, { transaction });
            await transaction.commit();
            return imagen;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al actualizar imagen: ${error.message}`);
        }
    }

    /**
     * Establecer imagen como principal
     * @param {number} id - ID de la imagen
     * @returns {Promise<Object>}
     */
    async setImagenPrincipal(id) {
        const transaction = await sequelize.transaction();
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const imagen = await ProductoImagen.findByPk(id, { transaction });

            if (!imagen) {
                throw new Error('Imagen no encontrada');
            }

            if (imagen.es_principal) {
                await transaction.commit();
                return imagen;
            }

            // Desmarcar todas las imágenes principales del producto
            await ProductoImagen.update(
                { es_principal: false },
                { 
                    where: { id_producto: imagen.id_producto },
                    transaction 
                }
            );

            // Marcar esta como principal
            await imagen.update({ es_principal: true }, { transaction });

            await transaction.commit();
            return imagen;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al establecer imagen principal: ${error.message}`);
        }
    }

    /**
     * Reordenar imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @param {Array} ordenImagenes - Array de IDs en el nuevo orden
     * @returns {Promise<Array>}
     */
    async reordenarImagenes(idProducto, ordenImagenes) {
        try {
            if (!Array.isArray(ordenImagenes) || ordenImagenes.length === 0) {
                throw new Error('Debe proporcionar un array de IDs válido');
            }

            const imagenes = await this.getImagenesByProducto(idProducto);
            
            // Verificar que todos los IDs pertenezcan al producto
            const idsProducto = imagenes.map(img => img.id_imagen);
            const idsValidos = ordenImagenes.every(id => idsProducto.includes(id));

            if (!idsValidos) {
                throw new Error('Algunos IDs no pertenecen al producto especificado');
            }

            // Retornar las imágenes en el nuevo orden
            return ordenImagenes.map(id => 
                imagenes.find(img => img.id_imagen === id)
            ).filter(Boolean);
        } catch (error) {
            throw new Error(`Error al reordenar imágenes: ${error.message}`);
        }
    }

    /**
     * Eliminar imagen
     * @param {number} id - ID de la imagen
     * @returns {Promise<boolean>}
     */
    async deleteImagen(id) {
        const transaction = await sequelize.transaction();
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const imagen = await ProductoImagen.findByPk(id, { transaction });

            if (!imagen) {
                throw new Error('Imagen no encontrada');
            }

            const eraPrincipal = imagen.es_principal;
            const idProducto = imagen.id_producto;

            await imagen.destroy({ transaction });

            // Si era la imagen principal, asignar otra como principal
            if (eraPrincipal) {
                const otraImagen = await ProductoImagen.findOne({
                    where: { id_producto: idProducto },
                    transaction
                });

                if (otraImagen) {
                    await otraImagen.update({ es_principal: true }, { transaction });
                }
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al eliminar imagen: ${error.message}`);
        }
    }

    /**
     * Eliminar todas las imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<number>}
     */
    async deleteImagenesByProducto(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            const count = await ProductoImagen.destroy({
                where: { id_producto: idProducto }
            });

            return count;
        } catch (error) {
            throw new Error(`Error al eliminar imágenes del producto: ${error.message}`);
        }
    }

    /**
     * Contar imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<number>}
     */
    async countImagenesByProducto(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            return await ProductoImagen.count({
                where: { id_producto: idProducto }
            });
        } catch (error) {
            throw new Error(`Error al contar imágenes: ${error.message}`);
        }
    }

    /**
     * Verificar si un producto tiene imágenes
     * @param {number} idProducto - ID del producto
     * @returns {Promise<boolean>}
     */
    async productoTieneImagenes(idProducto) {
        try {
            const count = await this.countImagenesByProducto(idProducto);
            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar imágenes del producto: ${error.message}`);
        }
    }

    /**
     * Verificar si un producto tiene imagen principal
     * @param {number} idProducto - ID del producto
     * @returns {Promise<boolean>}
     */
    async productoTieneImagenPrincipal(idProducto) {
        try {
            const count = await ProductoImagen.count({
                where: { 
                    id_producto: idProducto,
                    es_principal: true
                }
            });
            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar imagen principal: ${error.message}`);
        }
    }

    /**
     * Obtener URLs de imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<Array>}
     */
    async getURLsByProducto(idProducto) {
        try {
            const imagenes = await this.getImagenesByProducto(idProducto);
            return imagenes.map(img => ({
                id: img.id_imagen,
                url: img.url_imagen,
                es_principal: img.es_principal
            }));
        } catch (error) {
            throw new Error(`Error al obtener URLs de imágenes: ${error.message}`);
        }
    }

    /**
     * Reemplazar todas las imágenes de un producto
     * @param {number} idProducto - ID del producto
     * @param {Array} urls - Array de URLs nuevas
     * @param {number} indexPrincipal - Índice de la imagen principal
     * @returns {Promise<Array>}
     */
    async reemplazarImagenes(idProducto, urls, indexPrincipal = 0) {
        const transaction = await sequelize.transaction();
        try {
            // Eliminar todas las imágenes existentes
            await ProductoImagen.destroy({
                where: { id_producto: idProducto },
                transaction
            });

            // Crear las nuevas imágenes
            const imagenesCreadas = [];

            for (let i = 0; i < urls.length; i++) {
                const url = urls[i]?.trim();
                if (!url) continue;

                const imagen = await ProductoImagen.create({
                    id_producto: idProducto,
                    url_imagen: url,
                    es_principal: i === indexPrincipal
                }, { transaction });

                imagenesCreadas.push(imagen);
            }

            if (imagenesCreadas.length === 0) {
                throw new Error('No se pudo crear ninguna imagen válida');
            }

            await transaction.commit();
            return imagenesCreadas;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al reemplazar imágenes: ${error.message}`);
        }
    }

    /**
     * Contar total de imágenes
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countImagenes(filters = {}) {
        try {
            const where = {};

            if (filters.id_producto) {
                where.id_producto = filters.id_producto;
            }
            if (filters.es_principal !== undefined) {
                where.es_principal = filters.es_principal;
            }

            return await ProductoImagen.count({ where });
        } catch (error) {
            throw new Error(`Error al contar imágenes: ${error.message}`);
        }
    }

    /**
     * Verificar si una imagen existe
     * @param {number} id - ID de la imagen
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await ProductoImagen.count({
                where: { id_imagen: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de imagen: ${error.message}`);
        }
    }
}

export default new ProductoImagenService();