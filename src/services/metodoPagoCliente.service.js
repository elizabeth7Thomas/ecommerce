import { MetodoPagoCliente, MetodoPago, Cliente } from '../models/index.js';
import { Op } from 'sequelize';

class MetodoPagoClienteService {
    /**
     * Crear nuevo método de pago para cliente
     * @param {Object} data - Datos del método de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<Object>}
     */
    async createMetodoPagoCliente(data, idCliente) {
        try {
            // Validar datos requeridos
            if (!idCliente || isNaN(idCliente)) {
                throw new Error('ID de cliente inválido');
            }

            if (!data.id_metodo_pago || isNaN(data.id_metodo_pago)) {
                throw new Error('ID de método de pago es requerido');
            }

            // Verificar que el cliente existe
            const clienteExists = await Cliente.findByPk(idCliente);
            if (!clienteExists) {
                throw new Error('Cliente no encontrado');
            }

            // Verificar que el método de pago existe y está activo
            const metodoPago = await MetodoPago.findOne({
                where: { 
                    id_metodo_pago: data.id_metodo_pago,
                    activo: true
                }
            });

            if (!metodoPago) {
                throw new Error('Método de pago no encontrado o inactivo');
            }

            // Si se marca como predeterminado, desactivar otros métodos predeterminados
            if (data.es_predeterminado) {
                await this.removeDefaultFromOthers(idCliente);
            }

            // Preparar datos limpios
            const datosLimpios = {
                id_cliente: idCliente,
                id_metodo_pago: data.id_metodo_pago,
                alias: data.alias?.trim() || null,
                numero_tarjeta_ultimos_4: data.numero_tarjeta_ultimos_4?.trim() || null,
                nombre_titular: data.nombre_titular?.trim() || null,
                fecha_expiracion: data.fecha_expiracion || null,
                tipo_tarjeta: data.tipo_tarjeta || null,
                banco: data.banco?.trim() || null,
                numero_cuenta: data.numero_cuenta?.trim() || null,
                email_billetera: data.email_billetera?.trim() || null,
                telefono_billetera: data.telefono_billetera?.trim() || null,
                identificador_externo: data.identificador_externo?.trim() || null,
                token_pago: data.token_pago?.trim() || null,
                proveedor_token: data.proveedor_token?.trim() || null,
                es_predeterminado: data.es_predeterminado || false,
                activo: data.activo !== undefined ? data.activo : true,
                verificado: data.verificado || false,
                fecha_verificacion: data.verificado ? new Date() : null
            };

            const metodoPagoCliente = await MetodoPagoCliente.create(datosLimpios);

            // Incluir información del método de pago en la respuesta
            return await this.getMetodoPagoClienteById(metodoPagoCliente.id_metodo_pago_cliente);
        } catch (error) {
            throw new Error(`Error al crear método de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Obtener todos los métodos de pago de un cliente
     * @param {number} idCliente - ID del cliente
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getMetodosPagoByCliente(idCliente, options = {}) {
        try {
            if (!idCliente || isNaN(idCliente)) {
                throw new Error('ID de cliente inválido');
            }

            const where = { id_cliente: idCliente };

            // Filtrar por estado activo
            if (options.activo !== undefined) {
                where.activo = options.activo;
            }

            // Filtrar por verificado
            if (options.verificado !== undefined) {
                where.verificado = options.verificado;
            }

            // Filtrar por predeterminado
            if (options.es_predeterminado !== undefined) {
                where.es_predeterminado = options.es_predeterminado;
            }

            return await MetodoPagoCliente.findAll({
                where,
                include: [{
                    model: MetodoPago,
                    as: 'metodoPago',
                    where: { activo: true },
                    attributes: ['nombre_metodo', 'tipo_metodo', 'descripcion', 'icono_url', 'requiere_verificacion']
                }],
                order: [['es_predeterminado', 'DESC'], ['fecha_creacion', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener métodos de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Obtener método de pago del cliente por ID
     * @param {number} id - ID del método de pago del cliente
     * @returns {Promise<Object>}
     */
    async getMetodoPagoClienteById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPagoCliente = await MetodoPagoCliente.findByPk(id, {
                include: [{
                    model: MetodoPago,
                    as: 'metodoPago',
                    attributes: ['nombre_metodo', 'tipo_metodo', 'descripcion', 'icono_url', 'requiere_verificacion']
                }]
            });

            if (!metodoPagoCliente) {
                throw new Error('Método de pago del cliente no encontrado');
            }

            return metodoPagoCliente;
        } catch (error) {
            throw new Error(`Error al obtener método de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Actualizar método de pago del cliente
     * @param {number} id - ID del método de pago del cliente
     * @param {Object} updates - Datos a actualizar
     * @param {number} idCliente - ID del cliente (para verificación de propiedad)
     * @returns {Promise<Object>}
     */
    async updateMetodoPagoCliente(id, updates, idCliente) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPagoCliente = await MetodoPagoCliente.findOne({
                where: { 
                    id_metodo_pago_cliente: id,
                    id_cliente: idCliente
                }
            });

            if (!metodoPagoCliente) {
                throw new Error('Método de pago del cliente no encontrado o no pertenece al cliente');
            }

            // Si se marca como predeterminado, desactivar otros métodos predeterminados
            if (updates.es_predeterminado && !metodoPagoCliente.es_predeterminado) {
                await this.removeDefaultFromOthers(idCliente, id);
            }

            // Limpiar campos de texto
            if (updates.alias !== undefined) {
                updates.alias = updates.alias?.trim() || null;
            }

            if (updates.nombre_titular !== undefined) {
                updates.nombre_titular = updates.nombre_titular?.trim() || null;
            }

            if (updates.banco !== undefined) {
                updates.banco = updates.banco?.trim() || null;
            }

            if (updates.numero_cuenta !== undefined) {
                updates.numero_cuenta = updates.numero_cuenta?.trim() || null;
            }

            if (updates.email_billetera !== undefined) {
                updates.email_billetera = updates.email_billetera?.trim() || null;
            }

            if (updates.telefono_billetera !== undefined) {
                updates.telefono_billetera = updates.telefono_billetera?.trim() || null;
            }

            // Actualizar fecha de verificación si se verifica
            if (updates.verificado && !metodoPagoCliente.verificado) {
                updates.fecha_verificacion = new Date();
            } else if (updates.verificado === false) {
                updates.fecha_verificacion = null;
            }

            await metodoPagoCliente.update(updates);
            return await this.getMetodoPagoClienteById(id);
        } catch (error) {
            throw new Error(`Error al actualizar método de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Eliminar método de pago del cliente (soft delete)
     * @param {number} id - ID del método de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<Object>}
     */
    async deleteMetodoPagoCliente(id, idCliente) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPagoCliente = await MetodoPagoCliente.findOne({
                where: { 
                    id_metodo_pago_cliente: id,
                    id_cliente: idCliente
                }
            });

            if (!metodoPagoCliente) {
                throw new Error('Método de pago del cliente no encontrado o no pertenece al cliente');
            }

            if (!metodoPagoCliente.activo) {
                throw new Error('El método de pago del cliente ya está desactivado');
            }

            await metodoPagoCliente.update({ 
                activo: false,
                es_predeterminado: false
            });

            return metodoPagoCliente;
        } catch (error) {
            throw new Error(`Error al eliminar método de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Obtener método de pago predeterminado del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<Object|null>}
     */
    async getDefaultMetodoPago(idCliente) {
        try {
            if (!idCliente || isNaN(idCliente)) {
                throw new Error('ID de cliente inválido');
            }

            return await MetodoPagoCliente.findOne({
                where: {
                    id_cliente: idCliente,
                    es_predeterminado: true,
                    activo: true
                },
                include: [{
                    model: MetodoPago,
                    as: 'metodoPago',
                    where: { activo: true },
                    attributes: ['nombre_metodo', 'tipo_metodo', 'descripcion', 'icono_url', 'requiere_verificacion']
                }]
            });
        } catch (error) {
            throw new Error(`Error al obtener método de pago predeterminado: ${error.message}`);
        }
    }

    /**
     * Establecer método de pago como predeterminado
     * @param {number} id - ID del método de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<Object>}
     */
    async setAsDefault(id, idCliente) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPagoCliente = await MetodoPagoCliente.findOne({
                where: { 
                    id_metodo_pago_cliente: id,
                    id_cliente: idCliente,
                    activo: true
                }
            });

            if (!metodoPagoCliente) {
                throw new Error('Método de pago del cliente no encontrado, inactivo o no pertenece al cliente');
            }

            if (metodoPagoCliente.es_predeterminado) {
                throw new Error('Este método de pago ya es el predeterminado');
            }

            // Remover predeterminado de otros métodos
            await this.removeDefaultFromOthers(idCliente);

            // Establecer como predeterminado
            await metodoPagoCliente.update({ es_predeterminado: true });

            return await this.getMetodoPagoClienteById(id);
        } catch (error) {
            throw new Error(`Error al establecer método de pago como predeterminado: ${error.message}`);
        }
    }

    /**
     * Verificar método de pago del cliente
     * @param {number} id - ID del método de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<Object>}
     */
    async verifyMetodoPago(id, idCliente) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const metodoPagoCliente = await MetodoPagoCliente.findOne({
                where: { 
                    id_metodo_pago_cliente: id,
                    id_cliente: idCliente,
                    activo: true
                }
            });

            if (!metodoPagoCliente) {
                throw new Error('Método de pago del cliente no encontrado, inactivo o no pertenece al cliente');
            }

            if (metodoPagoCliente.verificado) {
                throw new Error('Este método de pago ya está verificado');
            }

            await metodoPagoCliente.update({ 
                verificado: true,
                fecha_verificacion: new Date()
            });

            return await this.getMetodoPagoClienteById(id);
        } catch (error) {
            throw new Error(`Error al verificar método de pago: ${error.message}`);
        }
    }

    /**
     * Remover predeterminado de otros métodos del cliente
     * @param {number} idCliente - ID del cliente
     * @param {number} excludeId - ID a excluir (opcional)
     * @returns {Promise<void>}
     */
    async removeDefaultFromOthers(idCliente, excludeId = null) {
        try {
            const where = {
                id_cliente: idCliente,
                es_predeterminado: true
            };

            if (excludeId) {
                where.id_metodo_pago_cliente = { [Op.ne]: excludeId };
            }

            await MetodoPagoCliente.update(
                { es_predeterminado: false },
                { where }
            );
        } catch (error) {
            throw new Error(`Error al actualizar métodos predeterminados: ${error.message}`);
        }
    }

    /**
     * Contar métodos de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countMetodosPagoCliente(idCliente, filters = {}) {
        try {
            if (!idCliente || isNaN(idCliente)) {
                throw new Error('ID de cliente inválido');
            }

            const where = { id_cliente: idCliente };
            
            if (filters.activo !== undefined) {
                where.activo = filters.activo;
            }

            if (filters.verificado !== undefined) {
                where.verificado = filters.verificado;
            }

            return await MetodoPagoCliente.count({ where });
        } catch (error) {
            throw new Error(`Error al contar métodos de pago del cliente: ${error.message}`);
        }
    }

    /**
     * Verificar si un método de pago del cliente existe
     * @param {number} id - ID del método de pago del cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise<boolean>}
     */
    async exists(id, idCliente) {
        try {
            if (!id || isNaN(id) || !idCliente || isNaN(idCliente)) {
                return false;
            }

            const count = await MetodoPagoCliente.count({
                where: { 
                    id_metodo_pago_cliente: id,
                    id_cliente: idCliente
                }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia del método de pago del cliente: ${error.message}`);
        }
    }
}

export default new MetodoPagoClienteService();