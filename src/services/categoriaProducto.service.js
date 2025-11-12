import CategoriaProducto from '../models/CategoriaProducto.js';
import { Op } from 'sequelize';

class CategoriaProductoService {
    /**
     * Obtener todas las categorías
     * @param {Object} filtros - Filtros opcionales (activo, nombre)
     * @returns {Promise<Array>}
     */
    async obtenerTodas(filtros = {}) {
        try {
            const where = {};
            
            if (filtros.activo !== undefined) {
                where.activo = filtros.activo;
            }
            
            if (filtros.nombre) {
                where.nombre_categoria = {
                    [Op.like]: `%${filtros.nombre}%`
                };
            }

            const categorias = await CategoriaProducto.findAll({
                where,
                order: [['nombre_categoria', 'ASC']]
            });

            return categorias;
        } catch (error) {
            throw new Error(`Error al obtener categorías: ${error.message}`);
        }
    }

    /**
     * Obtener categoría por ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object|null>}
     */
    async obtenerPorId(id) {
        try {
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
     * Crear nueva categoría
     * @param {Object} datos - Datos de la categoría
     * @returns {Promise<Object>}
     */
    async crear(datos) {
        try {
            // Validar datos requeridos
            if (!datos.nombre_categoria) {
                throw new Error('El nombre de la categoría es requerido');
            }

            // Verificar si ya existe una categoría con ese nombre
            const existe = await CategoriaProducto.findOne({
                where: { nombre_categoria: datos.nombre_categoria }
            });

            if (existe) {
                throw new Error('Ya existe una categoría con ese nombre');
            }

            const nuevaCategoria = await CategoriaProducto.create(datos);
            return nuevaCategoria;
        } catch (error) {
            throw new Error(`Error al crear categoría: ${error.message}`);
        }
    }

    /**
     * Actualizar categoría
     * @param {number} id - ID de la categoría
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async actualizar(id, datos) {
        try {
            const categoria = await CategoriaProducto.findByPk(id);

            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            // Si se está actualizando el nombre, verificar que no exista
            if (datos.nombre_categoria && datos.nombre_categoria !== categoria.nombre_categoria) {
                const existe = await CategoriaProducto.findOne({
                    where: { 
                        nombre_categoria: datos.nombre_categoria,
                        id_categoria: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('Ya existe una categoría con ese nombre');
                }
            }

            await categoria.update(datos);
            return categoria;
        } catch (error) {
            throw new Error(`Error al actualizar categoría: ${error.message}`);
        }
    }

    /**
     * Eliminar categoría (eliminación física)
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>}
     */
    async eliminar(id) {
        try {
            const categoria = await CategoriaProducto.findByPk(id);

            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            await categoria.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }

    /**
     * Desactivar categoría (eliminación lógica)
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    async desactivar(id) {
        try {
            const categoria = await CategoriaProducto.findByPk(id);

            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            await categoria.update({ activo: false });
            return categoria;
        } catch (error) {
            throw new Error(`Error al desactivar categoría: ${error.message}`);
        }
    }

    /**
     * Activar categoría
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    async activar(id) {
        try {
            const categoria = await CategoriaProducto.findByPk(id);

            if (!categoria) {
                throw new Error('Categoría no encontrada');
            }

            await categoria.update({ activo: true });
            return categoria;
        } catch (error) {
            throw new Error(`Error al activar categoría: ${error.message}`);
        }
    }

    /**
     * Buscar categorías activas
     * @returns {Promise<Array>}
     */
    async obtenerActivas() {
        try {
            return await this.obtenerTodas({ activo: true });
        } catch (error) {
            throw new Error(`Error al obtener categorías activas: ${error.message}`);
        }
    }

    /**
     * Contar categorías
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<number>}
     */
    async contar(filtros = {}) {
        try {
            const where = {};
            
            if (filtros.activo !== undefined) {
                where.activo = filtros.activo;
            }

            const total = await CategoriaProducto.count({ where });
            return total;
        } catch (error) {
            throw new Error(`Error al contar categorías: ${error.message}`);
        }
    }

    /**
     * Buscar categoría por nombre exacto
     * @param {string} nombre - Nombre de la categoría
     * @returns {Promise<Object|null>}
     */
    async buscarPorNombre(nombre) {
        try {
            const categoria = await CategoriaProducto.findOne({
                where: { nombre_categoria: nombre }
            });

            return categoria;
        } catch (error) {
            throw new Error(`Error al buscar categoría: ${error.message}`);
        }
    }

    /**
     * Verificar si una categoría existe
     * @param {number} id - ID de la categoría
     * @returns {Promise<boolean>}
     */
    async existe(id) {
        try {
            const categoria = await CategoriaProducto.findByPk(id);
            return categoria !== null;
        } catch (error) {
            throw new Error(`Error al verificar categoría: ${error.message}`);
        }
    }
}

export default new CategoriaProductoService();