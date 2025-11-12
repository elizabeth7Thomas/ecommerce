import { OrdenesCompra } from '../models/index.js';
import { Op } from 'sequelize';

class OrdenesCompraService {
    /**
     * Crear nueva orden de compra
     * @param {Object} data - Datos de la orden
     * @returns {Promise<Object>}
     */
    async createOrden(data) {
        try {
            // Validar datos requeridos
            if (!data.id_proveedor) {
                throw new Error('El proveedor es requerido');
            }
            if (!data.id_almacen) {
                throw new Error('El almacén es requerido');
            }
            if (!data.id_usuario) {
                throw new Error('El usuario es requerido');
            }
            if (!data.total_orden || data.total_orden <= 0) {
                throw new Error('El total de la orden debe ser mayor a 0');
            }

            // Verificar si el número de orden ya existe (si se proporciona)
            if (data.numero_orden) {
                const existe = await OrdenesCompra.findOne({
                    where: { numero_orden: data.numero_orden }
                });

                if (existe) {
                    throw new Error('El número de orden ya existe');
                }
            }

            // Validar fechas
            if (data.fecha_entrega_esperada) {
                const fechaOrden = data.fecha_orden || new Date();
                if (new Date(data.fecha_entrega_esperada) < new Date(fechaOrden)) {
                    throw new Error('La fecha de entrega esperada no puede ser anterior a la fecha de orden');
                }
            }

            return await OrdenesCompra.create(data);
        } catch (error) {
            throw new Error(`Error al crear orden de compra: ${error.message}`);
        }
    }

    /**
     * Obtener todas las órdenes de compra
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllOrdenes(options = {}) {
        try {
            const where = {};

            // Filtrar por estado
            if (options.estado) {
                where.estado = options.estado;
            }

            // Filtrar por proveedor
            if (options.id_proveedor) {
                where.id_proveedor = options.id_proveedor;
            }

            // Filtrar por almacén
            if (options.id_almacen) {
                where.id_almacen = options.id_almacen;
            }

            // Filtrar por usuario
            if (options.id_usuario) {
                where.id_usuario = options.id_usuario;
            }

            // Filtrar por rango de fechas
            if (options.fecha_inicio && options.fecha_fin) {
                where.fecha_orden = {
                    [Op.between]: [options.fecha_inicio, options.fecha_fin]
                };
            } else if (options.fecha_inicio) {
                where.fecha_orden = {
                    [Op.gte]: options.fecha_inicio
                };
            } else if (options.fecha_fin) {
                where.fecha_orden = {
                    [Op.lte]: options.fecha_fin
                };
            }

            // Buscar por número de orden
            if (options.numero_orden) {
                where.numero_orden = {
                    [Op.like]: `%${options.numero_orden}%`
                };
            }

            // Configurar ordenamiento
            const orderField = options.order || 'fecha_orden';
            const sortDirection = options.sort?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            return await OrdenesCompra.findAll({
                where,
                order: [[orderField, sortDirection]],
                limit: options.limit,
                offset: options.offset
            });
        } catch (error) {
            throw new Error(`Error al obtener órdenes de compra: ${error.message}`);
        }
    }

    /**
     * Obtener orden de compra por ID
     * @param {number} id - ID de la orden
     * @returns {Promise<Object>}
     */
    async getOrdenById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const orden = await OrdenesCompra.findByPk(id);

            if (!orden) {
                throw new Error('Orden de compra no encontrada');
            }

            return orden;
        } catch (error) {
            throw new Error(`Error al obtener orden de compra: ${error.message}`);
        }
    }

    /**
     * Obtener orden por número de orden
     * @param {string} numeroOrden - Número de orden
     * @returns {Promise<Object|null>}
     */
    async getOrdenByNumero(numeroOrden) {
        try {
            if (!numeroOrden?.trim()) {
                throw new Error('Número de orden requerido');
            }

            return await OrdenesCompra.findOne({
                where: { numero_orden: numeroOrden.trim() }
            });
        } catch (error) {
            throw new Error(`Error al buscar orden por número: ${error.message}`);
        }
    }

    /**
     * Actualizar orden de compra
     * @param {number} id - ID de la orden
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateOrden(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const orden = await OrdenesCompra.findByPk(id);

            if (!orden) {
                throw new Error('Orden de compra no encontrada');
            }

            // Validar que no se intente cambiar a un número de orden existente
            if (updates.numero_orden && updates.numero_orden !== orden.numero_orden) {
                const existe = await OrdenesCompra.findOne({
                    where: {
                        numero_orden: updates.numero_orden,
                        id_orden_compra: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('El número de orden ya existe');
                }
            }

            // Validar total si se actualiza
            if (updates.total_orden !== undefined && updates.total_orden <= 0) {
                throw new Error('El total de la orden debe ser mayor a 0');
            }

            // Validar fechas
            if (updates.fecha_entrega_esperada) {
                const fechaOrden = updates.fecha_orden || orden.fecha_orden;
                if (new Date(updates.fecha_entrega_esperada) < new Date(fechaOrden)) {
                    throw new Error('La fecha de entrega esperada no puede ser anterior a la fecha de orden');
                }
            }

            await orden.update(updates);
            return orden;
        } catch (error) {
            throw new Error(`Error al actualizar orden de compra: ${error.message}`);
        }
    }

    /**
     * Cambiar estado de la orden
     * @param {number} id - ID de la orden
     * @param {string} nuevoEstado - Nuevo estado
     * @returns {Promise<Object>}
     */
    async cambiarEstado(id, nuevoEstado) {
        try {
            const estadosValidos = ['pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada'];

            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error(`Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`);
            }

            const orden = await this.getOrdenById(id);

            // Validaciones de transición de estado
            if (orden.estado === 'cancelada') {
                throw new Error('No se puede cambiar el estado de una orden cancelada');
            }

            if (orden.estado === 'recibida' && nuevoEstado !== 'cancelada') {
                throw new Error('Una orden recibida solo puede ser cancelada');
            }

            // Si se marca como recibida, registrar fecha de entrega real
            const updates = { estado: nuevoEstado };
            if (nuevoEstado === 'recibida' && !orden.fecha_entrega_real) {
                updates.fecha_entrega_real = new Date();
            }

            await orden.update(updates);
            return orden;
        } catch (error) {
            throw new Error(`Error al cambiar estado: ${error.message}`);
        }
    }

    /**
     * Aprobar orden de compra
     * @param {number} id - ID de la orden
     * @returns {Promise<Object>}
     */
    async aprobarOrden(id) {
        return await this.cambiarEstado(id, 'aprobada');
    }

    /**
     * Marcar orden como enviada
     * @param {number} id - ID de la orden
     * @returns {Promise<Object>}
     */
    async marcarEnviada(id) {
        return await this.cambiarEstado(id, 'enviada');
    }

    /**
     * Marcar orden como recibida
     * @param {number} id - ID de la orden
     * @param {Date} fechaEntrega - Fecha de entrega real (opcional)
     * @returns {Promise<Object>}
     */
    async marcarRecibida(id, fechaEntrega = null) {
        try {
            const orden = await this.getOrdenById(id);

            await orden.update({
                estado: 'recibida',
                fecha_entrega_real: fechaEntrega || new Date()
            });

            return orden;
        } catch (error) {
            throw new Error(`Error al marcar orden como recibida: ${error.message}`);
        }
    }

    /**
     * Cancelar orden de compra
     * @param {number} id - ID de la orden
     * @param {string} motivo - Motivo de cancelación (opcional)
     * @returns {Promise<Object>}
     */
    async cancelarOrden(id, motivo = null) {
        try {
            const orden = await this.getOrdenById(id);

            if (orden.estado === 'recibida') {
                throw new Error('No se puede cancelar una orden ya recibida');
            }

            const updates = { estado: 'cancelada' };
            if (motivo) {
                updates.notas = orden.notas 
                    ? `${orden.notas}\n\nMotivo de cancelación: ${motivo}`
                    : `Motivo de cancelación: ${motivo}`;
            }

            await orden.update(updates);
            return orden;
        } catch (error) {
            throw new Error(`Error al cancelar orden: ${error.message}`);
        }
    }

    /**
     * Obtener órdenes por estado
     * @param {string} estado - Estado de las órdenes
     * @returns {Promise<Array>}
     */
    async getOrdenesByEstado(estado) {
        try {
            return await this.getAllOrdenes({ estado });
        } catch (error) {
            throw new Error(`Error al obtener órdenes por estado: ${error.message}`);
        }
    }

    /**
     * Obtener órdenes pendientes
     * @returns {Promise<Array>}
     */
    async getOrdenesPendientes() {
        return await this.getOrdenesByEstado('pendiente');
    }

    /**
     * Obtener órdenes vencidas (fecha de entrega esperada pasada)
     * @returns {Promise<Array>}
     */
    async getOrdenesVencidas() {
        try {
            const ahora = new Date();
            return await OrdenesCompra.findAll({
                where: {
                    fecha_entrega_esperada: { [Op.lt]: ahora },
                    estado: { [Op.notIn]: ['recibida', 'cancelada'] }
                },
                order: [['fecha_entrega_esperada', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener órdenes vencidas: ${error.message}`);
        }
    }

    /**
     * Obtener órdenes por proveedor
     * @param {number} idProveedor - ID del proveedor
     * @returns {Promise<Array>}
     */
    async getOrdenesByProveedor(idProveedor) {
        try {
            return await this.getAllOrdenes({ id_proveedor: idProveedor });
        } catch (error) {
            throw new Error(`Error al obtener órdenes por proveedor: ${error.message}`);
        }
    }

    /**
     * Calcular total de órdenes por estado
     * @param {string} estado - Estado (opcional)
     * @returns {Promise<Object>}
     */
    async getTotalByEstado(estado = null) {
        try {
            const where = estado ? { estado } : {};

            const result = await OrdenesCompra.findOne({
                where,
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('total_orden')), 'total'],
                    [sequelize.fn('COUNT', sequelize.col('id_orden_compra')), 'cantidad']
                ]
            });

            return {
                total: parseFloat(result.getDataValue('total')) || 0,
                cantidad: parseInt(result.getDataValue('cantidad')) || 0
            };
        } catch (error) {
            throw new Error(`Error al calcular total por estado: ${error.message}`);
        }
    }

    /**
     * Contar órdenes
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countOrdenes(filters = {}) {
        try {
            const where = {};

            if (filters.estado) {
                where.estado = filters.estado;
            }
            if (filters.id_proveedor) {
                where.id_proveedor = filters.id_proveedor;
            }
            if (filters.id_almacen) {
                where.id_almacen = filters.id_almacen;
            }

            return await OrdenesCompra.count({ where });
        } catch (error) {
            throw new Error(`Error al contar órdenes: ${error.message}`);
        }
    }

    /**
     * Eliminar orden de compra (solo si está pendiente)
     * @param {number} id - ID de la orden
     * @returns {Promise<boolean>}
     */
    async deleteOrden(id) {
        try {
            const orden = await this.getOrdenById(id);

            if (orden.estado !== 'pendiente') {
                throw new Error('Solo se pueden eliminar órdenes pendientes. Use cancelar para otros estados.');
            }

            await orden.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar orden: ${error.message}`);
        }
    }

    /**
     * Generar número de orden automático
     * @param {string} prefijo - Prefijo para el número (opcional)
     * @returns {Promise<string>}
     */
    async generarNumeroOrden(prefijo = 'OC') {
        try {
            const ultimaOrden = await OrdenesCompra.findOne({
                where: {
                    numero_orden: { [Op.like]: `${prefijo}%` }
                },
                order: [['id_orden_compra', 'DESC']]
            });

            let numeroConsecutivo = 1;
            if (ultimaOrden && ultimaOrden.numero_orden) {
                const numero = ultimaOrden.numero_orden.replace(prefijo, '');
                numeroConsecutivo = parseInt(numero) + 1 || 1;
            }

            return `${prefijo}${numeroConsecutivo.toString().padStart(6, '0')}`;
        } catch (error) {
            throw new Error(`Error al generar número de orden: ${error.message}`);
        }
    }

    /**
     * Verificar si una orden existe
     * @param {number} id - ID de la orden
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await OrdenesCompra.count({
                where: { id_orden_compra: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de orden: ${error.message}`);
        }
    }
}

export default new OrdenesCompraService();