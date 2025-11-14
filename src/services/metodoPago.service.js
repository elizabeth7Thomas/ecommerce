import { MetodoPago } from '../models/index.js';
import { Op } from 'sequelize';

class MetodoPagoService {
    /**
     * Crear nuevo método de pago
     * @param {Object} data - Datos del método de pago
     * @returns {Promise<Object>}
     */
    async createMetodoPago(data) {
        try {
            // Validar datos requeridos
            if (!data.nombre_metodo?.trim()) {
                throw new Error('El nombre del método de pago es requerido');
            }

            if (!data.tipo_metodo?.trim()) {
                throw new Error('El tipo de método de pago es requerido');
            }

            // Verificar si ya existe un método con ese nombre
            const existe = await MetodoPago.findOne({
                where: { 
                    nombre_metodo: data.nombre_metodo.trim()
                }
            });

            if (existe) {
                throw new Error('Ya existe un método de pago con ese nombre');
            }

            // Limpiar y preparar datos
            const datosLimpios = {
                ...data,
                nombre_metodo: data.nombre_metodo.trim(),
                tipo_metodo: data.tipo_metodo.trim().toLowerCase(),
                descripcion: data.descripcion?.trim() || null,
                icono_url: data.icono_url?.trim() || null,
                requiere_verificacion: data.requiere_verificacion || false,
                comision_porcentaje: data.comision_porcentaje || 0,
                comision_fija: data.comision_fija || 0,
                activo: data.activo !== undefined ? data.activo : true,
                disponible_online: data.disponible_online !== undefined ? data.disponible_online : true,
                disponible_tienda: data.disponible_tienda !== undefined ? data.disponible_tienda : true,
                orden_visualizacion: data.orden_visualizacion || 0,
                configuracion: data.configuracion || null
            };

            return await MetodoPago.create(datosLimpios);
        } catch (error) {
            throw new Error(`Error al crear método de pago: ${error.message}`);
        }
    }

    /**
     * Obtener todos los métodos de pago
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllMetodosPago(options = {}) {
        try {
            const where = {};
            
            // Filtrar por estado activo
            if (options.activo !== undefined) {
                where.activo = options.activo;
            }

            // Filtrar por disponibilidad online
            if (options.disponible_online !== undefined) {
                where.disponible_online = options.disponible_online;
            }

            // Filtrar por disponibilidad en tienda
            if (options.disponible_tienda !== undefined) {
                where.disponible_tienda = options.disponible_tienda;
            }

            // Filtrar por tipo de método
            if (options.tipo_metodo?.trim()) {
                where.tipo_metodo = options.tipo_metodo.trim().toLowerCase();
            }
            
            // Búsqueda por nombre
            if (options.nombre?.trim()) {
                where.nombre_metodo = {
                    [Op.like]: `%${options.nombre.trim()}%`
                };
            }

            // Configurar ordenamiento
            const orderField = options.order || 'orden_visualizacion';
            const sortDirection = options.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            return await MetodoPago.findAll({
                where,
                order: [[orderField, sortDirection], ['nombre_metodo', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago: ${error.message}`);
        }
    }

    /**
     * Obtener método de pago por ID
     * @param {number} id - ID del método de pago
     * @returns {Promise<Object>}
     */
    async getMetodoPagoById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPago = await MetodoPago.findByPk(id);
            
            if (!metodoPago) {
                throw new Error('Método de pago no encontrado');
            }

            return metodoPago;
        } catch (error) {
            throw new Error(`Error al obtener método de pago: ${error.message}`);
        }
    }

    /**
     * Actualizar método de pago
     * @param {number} id - ID del método de pago
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateMetodoPago(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPago = await MetodoPago.findByPk(id);
            
            if (!metodoPago) {
                throw new Error('Método de pago no encontrado');
            }

            // Validar nombre si se está actualizando
            if (updates.nombre_metodo?.trim()) {
                // Verificar que no exista otro método con ese nombre
                const existe = await MetodoPago.findOne({
                    where: { 
                        nombre_metodo: updates.nombre_metodo.trim(),
                        id_metodo_pago: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('Ya existe un método de pago con ese nombre');
                }

                updates.nombre_metodo = updates.nombre_metodo.trim();
            }

            // Limpiar campos de texto
            if (updates.descripcion !== undefined) {
                updates.descripcion = updates.descripcion?.trim() || null;
            }

            if (updates.icono_url !== undefined) {
                updates.icono_url = updates.icono_url?.trim() || null;
            }

            if (updates.tipo_metodo?.trim()) {
                updates.tipo_metodo = updates.tipo_metodo.trim().toLowerCase();
            }

            await metodoPago.update(updates);
            return metodoPago;
        } catch (error) {
            throw new Error(`Error al actualizar método de pago: ${error.message}`);
        }
    }

    /**
     * Eliminar método de pago (soft delete)
     * @param {number} id - ID del método de pago
     * @returns {Promise<Object>}
     */
    async deleteMetodoPago(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPago = await MetodoPago.findByPk(id);
            
            if (!metodoPago) {
                throw new Error('Método de pago no encontrado');
            }

            if (!metodoPago.activo) {
                throw new Error('El método de pago ya está desactivado');
            }

            await metodoPago.update({ activo: false });
            return metodoPago;
        } catch (error) {
            throw new Error(`Error al eliminar método de pago: ${error.message}`);
        }
    }

    /**
     * Obtener solo métodos de pago activos
     * @param {Object} options - Opciones de filtrado adicionales
     * @returns {Promise<Array>}
     */
    async getActiveMetodosPago(options = {}) {
        try {
            return await this.getAllMetodosPago({ ...options, activo: true });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago activos: ${error.message}`);
        }
    }

    /**
     * Obtener métodos de pago disponibles online
     * @returns {Promise<Array>}
     */
    async getOnlineMetodosPago() {
        try {
            return await this.getAllMetodosPago({ 
                activo: true, 
                disponible_online: true 
            });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago online: ${error.message}`);
        }
    }

    /**
     * Obtener métodos de pago disponibles en tienda
     * @returns {Promise<Array>}
     */
    async getStoreMetodosPago() {
        try {
            return await this.getAllMetodosPago({ 
                activo: true, 
                disponible_tienda: true 
            });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago en tienda: ${error.message}`);
        }
    }

    /**
     * Obtener métodos de pago por tipo
     * @param {string} tipo - Tipo de método de pago
     * @returns {Promise<Array>}
     */
    async getMetodosPagoByTipo(tipo) {
        try {
            if (!tipo?.trim()) {
                throw new Error('El tipo de método de pago es requerido');
            }

            return await this.getAllMetodosPago({ 
                activo: true,
                tipo_metodo: tipo.trim().toLowerCase()
            });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago por tipo: ${error.message}`);
        }
    }

    /**
     * Activar método de pago
     * @param {number} id - ID del método de pago
     * @returns {Promise<Object>}
     */
    async activateMetodoPago(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPago = await MetodoPago.findByPk(id);
            
            if (!metodoPago) {
                throw new Error('Método de pago no encontrado');
            }

            if (metodoPago.activo) {
                throw new Error('El método de pago ya está activo');
            }

            await metodoPago.update({ activo: true });
            return metodoPago;
        } catch (error) {
            throw new Error(`Error al activar método de pago: ${error.message}`);
        }
    }

    /**
     * Actualizar configuración específica de un método de pago
     * @param {number} id - ID del método de pago
     * @param {Object} configuracion - Nueva configuración
     * @returns {Promise<Object>}
     */
    async updateConfiguracion(id, configuracion) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPago = await MetodoPago.findByPk(id);
            
            if (!metodoPago) {
                throw new Error('Método de pago no encontrado');
            }

            await metodoPago.update({ configuracion });
            return metodoPago;
        } catch (error) {
            throw new Error(`Error al actualizar configuración: ${error.message}`);
        }
    }

    /**
     * Verificar si un método de pago existe
     * @param {number} id - ID del método de pago
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await MetodoPago.count({
                where: { id_metodo_pago: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia del método de pago: ${error.message}`);
        }
    }

    /**
     * Contar métodos de pago
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countMetodosPago(filters = {}) {
        try {
            const where = {};
            
            if (filters.activo !== undefined) {
                where.activo = filters.activo;
            }

            if (filters.tipo_metodo?.trim()) {
                where.tipo_metodo = filters.tipo_metodo.trim().toLowerCase();
            }

            return await MetodoPago.count({ where });
        } catch (error) {
            throw new Error(`Error al contar métodos de pago: ${error.message}`);
        }
    }
}

export default new MetodoPagoService();