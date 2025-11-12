import { CategoriaProducto } from '../models/index.js';
import { Op } from 'sequelize';

class CategoriaService {
    /**
     * Crear nueva categoría
     * @param {Object} data - Datos de la categoría
     * @returns {Promise<Object>}
     */
    async createCategoria(data) {
        try {
            // Validar datos requeridos
            if (!data.nombre_categoria?.trim()) {
                throw new Error('El nombre de la categoría es requerido');
            }

            // Verificar si ya existe una categoría con ese nombre
            const existe = await CategoriaProducto.findOne({
                where: { 
                    nombre_categoria: data.nombre_categoria.trim()
                }
            });

            if (existe) {
                throw new Error('Ya existe una categoría con ese nombre');
            }

            // Limpiar espacios en blanco
            const datosLimpios = {
                ...data,
                nombre_categoria: data.nombre_categoria.trim(),
                descripcion: data.descripcion?.trim() || null
            };

            return await CategoriaProducto.create(datosLimpios);
        } catch (error) {
            throw new Error(`Error al crear categoría: ${error.message}`);
        }
    }

    /**
     * Obtener todas las categorías
     * @param {Object} options - Opciones de filtrado
     * @param {boolean} options.activo - Filtrar por estado activo
     * @param {string} options.nombre - Buscar por nombre (búsqueda parcial)
     * @param {string} options.order - Campo para ordenar (default: nombre_categoria)
     * @param {string} options.sort - Dirección del orden (ASC|DESC, default: ASC)
     * @returns {Promise<Array>}
     */
    async getAllCategorias(options = {}) {
        try {
            const where = {};
            
            // Filtrar por estado activo
            if (options.activo !== undefined) {
                where.activo = options.activo;
            }
            
            // Búsqueda por nombre
            if (options.nombre?.trim()) {
                where.nombre_categoria = {
                    [Op.like]: `%${options.nombre.trim()}%`
                };
            }

            // Configurar ordenamiento
            const orderField = options.order || 'nombre_categoria';
            const sortDirection = options.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            return await CategoriaProducto.findAll({
                where,
                order: [[orderField, sortDirection]]
            });
        } catch (error) {
            throw new Error(`Error al obtener categorías: ${error.message}`);
        }
    }

    /**
     * Obtener categoría por ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    async getCategoriaById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const categoria = await CategoriaProducto.findByPk(id);
            
            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            return categoria;
        } catch (error) {
            throw new Error(`Error al obtener categoría: ${error.message}`);
        }
    }

    /**
     * Actualizar categoría
     * @param {number} id - ID de la categoría
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateCategoria(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const categoria = await CategoriaProducto.findByPk(id);
            
            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            // Validar nombre si se está actualizando
            if (updates.nombre_categoria?.trim()) {
                // Verificar que no exista otra categoría con ese nombre
                const existe = await CategoriaProducto.findOne({
                    where: { 
                        nombre_categoria: updates.nombre_categoria.trim(),
                        id_categoria: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('Ya existe una categoría con ese nombre');
                }

                updates.nombre_categoria = updates.nombre_categoria.trim();
            }

            // Limpiar descripción si se envía
            if (updates.descripcion !== undefined) {
                updates.descripcion = updates.descripcion?.trim() || null;
            }

            await categoria.update(updates);
            return categoria;
        } catch (error) {
            throw new Error(`Error al actualizar categoría: ${error.message}`);
        }
    }

    /**
     * Eliminar categoría (soft delete)
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    async deleteCategoria(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const categoria = await CategoriaProducto.findByPk(id);
            
            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            if (!categoria.activo) {
                throw new Error('La categoría ya está desactivada');
            }

            await categoria.update({ activo: false });
            return categoria;
        } catch (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }

    /**
     * Activar categoría
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    async activateCategoria(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const categoria = await CategoriaProducto.findByPk(id);
            
            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            if (categoria.activo) {
                throw new Error('La categoría ya está activa');
            }

            await categoria.update({ activo: true });
            return categoria;
        } catch (error) {
            throw new Error(`Error al activar categoría: ${error.message}`);
        }
    }

    /**
     * Eliminar permanentemente una categoría
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>}
     */
    async hardDeleteCategoria(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const categoria = await CategoriaProducto.findByPk(id);
            
            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            await categoria.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar categoría permanentemente: ${error.message}`);
        }
    }

    /**
     * Obtener solo categorías activas
     * @returns {Promise<Array>}
     */
    async getActiveCategories() {
        try {
            return await this.getAllCategorias({ activo: true });
        } catch (error) {
            throw new Error(`Error al obtener categorías activas: ${error.message}`);
        }
    }

    /**
     * Contar categorías
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countCategorias(filters = {}) {
        try {
            const where = {};
            
            if (filters.activo !== undefined) {
                where.activo = filters.activo;
            }

            return await CategoriaProducto.count({ where });
        } catch (error) {
            throw new Error(`Error al contar categorías: ${error.message}`);
        }
    }

    /**
     * Buscar categoría por nombre exacto
     * @param {string} nombre - Nombre de la categoría
     * @returns {Promise<Object|null>}
     */
    async findByName(nombre) {
        try {
            if (!nombre?.trim()) {
                throw new Error('El nombre es requerido');
            }

            return await CategoriaProducto.findOne({
                where: { nombre_categoria: nombre.trim() }
            });
        } catch (error) {
            throw new Error(`Error al buscar categoría por nombre: ${error.message}`);
        }
    }

    /**
     * Verificar si una categoría existe
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await CategoriaProducto.count({
                where: { id_categoria: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de categoría: ${error.message}`);
        }
    }
}

export default new CategoriaService();