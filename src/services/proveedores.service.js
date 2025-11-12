import { Proveedores } from '../models/index.js';
import { Op } from 'sequelize';

class ProveedoresService {
    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar formato de NIT
     * @param {string} nit - NIT a validar
     * @returns {boolean}
     */
    isValidNIT(nit) {
        // Validación básica: solo números y guiones, longitud razonable
        if (!nit) return true; // El NIT es opcional
        const nitRegex = /^[0-9-]+$/;
        return nitRegex.test(nit) && nit.length >= 6 && nit.length <= 20;
    }

    /**
     * Crear nuevo proveedor
     * @param {Object} data - Datos del proveedor
     * @returns {Promise<Object>}
     */
    async createProveedor(data) {
        try {
            // Validar datos requeridos
            if (!data.nombre_proveedor?.trim()) {
                throw new Error('El nombre del proveedor es requerido');
            }

            // Validar email si se proporciona
            if (data.email && !this.isValidEmail(data.email.trim())) {
                throw new Error('El formato del email no es válido');
            }

            // Validar NIT si se proporciona
            if (data.nit && !this.isValidNIT(data.nit.trim())) {
                throw new Error('El formato del NIT no es válido');
            }

            // Verificar si ya existe un proveedor con el mismo nombre
            const existeNombre = await Proveedores.findOne({
                where: { nombre_proveedor: data.nombre_proveedor.trim() }
            });

            if (existeNombre) {
                throw new Error('Ya existe un proveedor con ese nombre');
            }

            // Verificar NIT duplicado si se proporciona
            if (data.nit?.trim()) {
                const existeNIT = await Proveedores.findOne({
                    where: { nit: data.nit.trim() }
                });

                if (existeNIT) {
                    throw new Error('Ya existe un proveedor con ese NIT');
                }
            }

            // Verificar email duplicado si se proporciona
            if (data.email?.trim()) {
                const existeEmail = await Proveedores.findOne({
                    where: { email: data.email.trim().toLowerCase() }
                });

                if (existeEmail) {
                    throw new Error('Ya existe un proveedor con ese email');
                }
            }

            // Limpiar y preparar datos
            const proveedorData = {
                ...data,
                nombre_proveedor: data.nombre_proveedor.trim(),
                contacto: data.contacto?.trim() || null,
                email: data.email?.trim().toLowerCase() || null,
                telefono: data.telefono?.trim() || null,
                direccion: data.direccion?.trim() || null,
                nit: data.nit?.trim() || null
            };

            return await Proveedores.create(proveedorData);
        } catch (error) {
            throw new Error(`Error al crear proveedor: ${error.message}`);
        }
    }

    /**
     * Obtener todos los proveedores
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllProveedores(options = {}) {
        try {
            const where = {};

            // Filtrar por estado activo
            if (options.activo !== undefined) {
                where.activo = options.activo;
            }

            // Búsqueda por nombre
            if (options.nombre?.trim()) {
                where.nombre_proveedor = {
                    [Op.like]: `%${options.nombre.trim()}%`
                };
            }

            // Búsqueda por NIT
            if (options.nit?.trim()) {
                where.nit = {
                    [Op.like]: `%${options.nit.trim()}%`
                };
            }

            // Búsqueda por email
            if (options.email?.trim()) {
                where.email = {
                    [Op.like]: `%${options.email.trim()}%`
                };
            }

            // Configurar ordenamiento
            const orderField = options.order || 'nombre_proveedor';
            const sortDirection = options.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            return await Proveedores.findAll({
                where,
                order: [[orderField, sortDirection]],
                limit: options.limit,
                offset: options.offset
            });
        } catch (error) {
            throw new Error(`Error al obtener proveedores: ${error.message}`);
        }
    }

    /**
     * Obtener proveedor por ID
     * @param {number} id - ID del proveedor
     * @returns {Promise<Object>}
     */
    async getProveedorById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const proveedor = await Proveedores.findByPk(id);

            if (!proveedor) {
                throw new Error('Proveedor no encontrado');
            }

            return proveedor;
        } catch (error) {
            throw new Error(`Error al obtener proveedor: ${error.message}`);
        }
    }

    /**
     * Buscar proveedor por NIT
     * @param {string} nit - NIT del proveedor
     * @returns {Promise<Object|null>}
     */
    async getProveedorByNIT(nit) {
        try {
            if (!nit?.trim()) {
                throw new Error('NIT requerido');
            }

            return await Proveedores.findOne({
                where: { nit: nit.trim() }
            });
        } catch (error) {
            throw new Error(`Error al buscar proveedor por NIT: ${error.message}`);
        }
    }

    /**
     * Buscar proveedor por email
     * @param {string} email - Email del proveedor
     * @returns {Promise<Object|null>}
     */
    async getProveedorByEmail(email) {
        try {
            if (!email?.trim()) {
                throw new Error('Email requerido');
            }

            return await Proveedores.findOne({
                where: { email: email.trim().toLowerCase() }
            });
        } catch (error) {
            throw new Error(`Error al buscar proveedor por email: ${error.message}`);
        }
    }

    /**
     * Actualizar proveedor
     * @param {number} id - ID del proveedor
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateProveedor(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const proveedor = await Proveedores.findByPk(id);

            if (!proveedor) {
                throw new Error('Proveedor no encontrado');
            }

            // Validar nombre si se actualiza
            if (updates.nombre_proveedor?.trim()) {
                const existeNombre = await Proveedores.findOne({
                    where: {
                        nombre_proveedor: updates.nombre_proveedor.trim(),
                        id_proveedor: { [Op.ne]: id }
                    }
                });

                if (existeNombre) {
                    throw new Error('Ya existe un proveedor con ese nombre');
                }

                updates.nombre_proveedor = updates.nombre_proveedor.trim();
            }

            // Validar NIT si se actualiza
            if (updates.nit !== undefined) {
                if (updates.nit && !this.isValidNIT(updates.nit.trim())) {
                    throw new Error('El formato del NIT no es válido');
                }

                if (updates.nit?.trim()) {
                    const existeNIT = await Proveedores.findOne({
                        where: {
                            nit: updates.nit.trim(),
                            id_proveedor: { [Op.ne]: id }
                        }
                    });

                    if (existeNIT) {
                        throw new Error('Ya existe un proveedor con ese NIT');
                    }

                    updates.nit = updates.nit.trim();
                } else {
                    updates.nit = null;
                }
            }

            // Validar email si se actualiza
            if (updates.email !== undefined) {
                if (updates.email && !this.isValidEmail(updates.email.trim())) {
                    throw new Error('El formato del email no es válido');
                }

                if (updates.email?.trim()) {
                    const existeEmail = await Proveedores.findOne({
                        where: {
                            email: updates.email.trim().toLowerCase(),
                            id_proveedor: { [Op.ne]: id }
                        }
                    });

                    if (existeEmail) {
                        throw new Error('Ya existe un proveedor con ese email');
                    }

                    updates.email = updates.email.trim().toLowerCase();
                } else {
                    updates.email = null;
                }
            }

            // Limpiar otros campos
            if (updates.contacto !== undefined) {
                updates.contacto = updates.contacto?.trim() || null;
            }
            if (updates.telefono !== undefined) {
                updates.telefono = updates.telefono?.trim() || null;
            }
            if (updates.direccion !== undefined) {
                updates.direccion = updates.direccion?.trim() || null;
            }

            await proveedor.update(updates);
            return proveedor;
        } catch (error) {
            throw new Error(`Error al actualizar proveedor: ${error.message}`);
        }
    }

    /**
     * Desactivar proveedor (soft delete)
     * @param {number} id - ID del proveedor
     * @returns {Promise<Object>}
     */
    async desactivarProveedor(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const proveedor = await Proveedores.findByPk(id);

            if (!proveedor) {
                throw new Error('Proveedor no encontrado');
            }

            if (!proveedor.activo) {
                throw new Error('El proveedor ya está desactivado');
            }

            await proveedor.update({ activo: false });
            return proveedor;
        } catch (error) {
            throw new Error(`Error al desactivar proveedor: ${error.message}`);
        }
    }

    /**
     * Activar proveedor
     * @param {number} id - ID del proveedor
     * @returns {Promise<Object>}
     */
    async activarProveedor(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const proveedor = await Proveedores.findByPk(id);

            if (!proveedor) {
                throw new Error('Proveedor no encontrado');
            }

            if (proveedor.activo) {
                throw new Error('El proveedor ya está activo');
            }

            await proveedor.update({ activo: true });
            return proveedor;
        } catch (error) {
            throw new Error(`Error al activar proveedor: ${error.message}`);
        }
    }

    /**
     * Eliminar proveedor permanentemente
     * @param {number} id - ID del proveedor
     * @returns {Promise<boolean>}
     */
    async deleteProveedor(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const proveedor = await Proveedores.findByPk(id);

            if (!proveedor) {
                throw new Error('Proveedor no encontrado');
            }

            await proveedor.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar proveedor: ${error.message}`);
        }
    }

    /**
     * Obtener proveedores activos
     * @returns {Promise<Array>}
     */
    async getProveedoresActivos() {
        try {
            return await this.getAllProveedores({ activo: true });
        } catch (error) {
            throw new Error(`Error al obtener proveedores activos: ${error.message}`);
        }
    }

    /**
     * Obtener proveedores inactivos
     * @returns {Promise<Array>}
     */
    async getProveedoresInactivos() {
        try {
            return await this.getAllProveedores({ activo: false });
        } catch (error) {
            throw new Error(`Error al obtener proveedores inactivos: ${error.message}`);
        }
    }

    /**
     * Buscar proveedores por nombre (búsqueda flexible)
     * @param {string} termino - Término de búsqueda
     * @returns {Promise<Array>}
     */
    async buscarProveedores(termino) {
        try {
            if (!termino?.trim()) {
                return await this.getAllProveedores();
            }

            const terminoLimpio = termino.trim();

            return await Proveedores.findAll({
                where: {
                    [Op.or]: [
                        { nombre_proveedor: { [Op.like]: `%${terminoLimpio}%` } },
                        { contacto: { [Op.like]: `%${terminoLimpio}%` } },
                        { email: { [Op.like]: `%${terminoLimpio}%` } },
                        { nit: { [Op.like]: `%${terminoLimpio}%` } },
                        { telefono: { [Op.like]: `%${terminoLimpio}%` } }
                    ]
                },
                order: [['nombre_proveedor', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al buscar proveedores: ${error.message}`);
        }
    }

    /**
     * Contar proveedores
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countProveedores(filters = {}) {
        try {
            const where = {};

            if (filters.activo !== undefined) {
                where.activo = filters.activo;
            }

            return await Proveedores.count({ where });
        } catch (error) {
            throw new Error(`Error al contar proveedores: ${error.message}`);
        }
    }

    /**
     * Verificar si un proveedor existe
     * @param {number} id - ID del proveedor
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await Proveedores.count({
                where: { id_proveedor: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de proveedor: ${error.message}`);
        }
    }

    /**
     * Obtener proveedores con paginación
     * @param {number} page - Número de página (inicia en 1)
     * @param {number} limit - Elementos por página
     * @param {Object} filters - Filtros adicionales
     * @returns {Promise<Object>}
     */
    async getProveedoresPaginados(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;

            const options = {
                ...filters,
                limit,
                offset
            };

            const proveedores = await this.getAllProveedores(options);
            const total = await this.countProveedores(filters);

            return {
                data: proveedores,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error al obtener proveedores paginados: ${error.message}`);
        }
    }

    /**
     * Validar datos completos de proveedor
     * @param {Object} data - Datos del proveedor
     * @returns {Object}
     */
    validarDatosCompletos(data) {
        const errores = [];

        if (!data.nombre_proveedor?.trim()) {
            errores.push('El nombre es requerido');
        }

        if (data.email && !this.isValidEmail(data.email)) {
            errores.push('Email inválido');
        }

        if (data.nit && !this.isValidNIT(data.nit)) {
            errores.push('NIT inválido');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }
}

export default new ProveedoresService();