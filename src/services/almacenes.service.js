
import Almacenes from '../models/Almacenes.js';import { Op } from 'sequelize';

class AlmacenesService {
    /**
     * Obtener todos los almacenes
     * @param {Object} filtros - Filtros opcionales (activo, nombre)
     * @returns {Promise<Array>}
     */
    async obtenerTodos(filtros = {}) {
        try {
            const where = {};
            
            if (filtros.activo !== undefined) {
                where.activo = filtros.activo;
            }
            
            if (filtros.nombre) {
                where.nombre_almacen = {
                    [Op.like]: `%${filtros.nombre}%`
                };
            }

            const almacenes = await Almacenes.findAll({
                where,
                order: [['nombre_almacen', 'ASC']]
            });

            return almacenes;
        } catch (error) {
            throw new Error(`Error al obtener almacenes: ${error.message}`);
        }
    }

    /**
     * Obtener almacén por ID
     * @param {number} id - ID del almacén
     * @returns {Promise<Object|null>}
     */
    async obtenerPorId(id) {
        try {
            const almacen = await Almacenes.findByPk(id);
            
            if (!almacen) {
                throw new Error('Almacén no encontrado');
            }

            return almacen;
        } catch (error) {
            throw new Error(`Error al obtener almacén: ${error.message}`);
        }
    }

    /**
     * Crear nuevo almacén
     * @param {Object} datos - Datos del almacén
     * @returns {Promise<Object>}
     */
    async crear(datos) {
        try {
            // Validar datos requeridos
            if (!datos.nombre_almacen) {
                throw new Error('El nombre del almacén es requerido');
            }

            // Verificar si ya existe un almacén con ese nombre
            const existe = await Almacenes.findOne({
                where: { nombre_almacen: datos.nombre_almacen }
            });

            if (existe) {
                throw new Error('Ya existe un almacén con ese nombre');
            }

            const nuevoAlmacen = await Almacenes.create(datos);
            return nuevoAlmacen;
        } catch (error) {
            throw new Error(`Error al crear almacén: ${error.message}`);
        }
    }

    /**
     * Actualizar almacén
     * @param {number} id - ID del almacén
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async actualizar(id, datos) {
        try {
            const almacen = await Almacenes.findByPk(id);

            if (!almacen) {
                throw new Error('Almacén no encontrado');
            }

            // Si se está actualizando el nombre, verificar que no exista
            if (datos.nombre_almacen && datos.nombre_almacen !== almacen.nombre_almacen) {
                const existe = await Almacenes.findOne({
                    where: { 
                        nombre_almacen: datos.nombre_almacen,
                        id_almacen: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('Ya existe un almacén con ese nombre');
                }
            }

            await almacen.update(datos);
            return almacen;
        } catch (error) {
            throw new Error(`Error al actualizar almacén: ${error.message}`);
        }
    }

    /**
     * Eliminar almacén (eliminación física)
     * @param {number} id - ID del almacén
     * @returns {Promise<boolean>}
     */
    async eliminar(id) {
        try {
            const almacen = await Almacenes.findByPk(id);

            if (!almacen) {
                throw new Error('Almacén no encontrado');
            }

            await almacen.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar almacén: ${error.message}`);
        }
    }

    /**
     * Desactivar almacén (eliminación lógica)
     * @param {number} id - ID del almacén
     * @returns {Promise<Object>}
     */
    async desactivar(id) {
        try {
            const almacen = await Almacenes.findByPk(id);

            if (!almacen) {
                throw new Error('Almacén no encontrado');
            }

            await almacen.update({ activo: false });
            return almacen;
        } catch (error) {
            throw new Error(`Error al desactivar almacén: ${error.message}`);
        }
    }

    /**
     * Activar almacén
     * @param {number} id - ID del almacén
     * @returns {Promise<Object>}
     */
    async activar(id) {
        try {
            const almacen = await Almacenes.findByPk(id);

            if (!almacen) {
                throw new Error('Almacén no encontrado');
            }

            await almacen.update({ activo: true });
            return almacen;
        } catch (error) {
            throw new Error(`Error al activar almacén: ${error.message}`);
        }
    }

    /**
     * Buscar almacenes activos
     * @returns {Promise<Array>}
     */
    async obtenerActivos() {
        try {
            return await this.obtenerTodos({ activo: true });
        } catch (error) {
            throw new Error(`Error al obtener almacenes activos: ${error.message}`);
        }
    }

    /**
     * Contar almacenes
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<number>}
     */
    async contar(filtros = {}) {
        try {
            const where = {};
            
            if (filtros.activo !== undefined) {
                where.activo = filtros.activo;
            }

            const total = await Almacenes.count({ where });
            return total;
        } catch (error) {
            throw new Error(`Error al contar almacenes: ${error.message}`);
        }
    }
}

export default new AlmacenesService();