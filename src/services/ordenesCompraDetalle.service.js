// Servicio para gestionar detalles de órdenes de compra
import { OrdenesCompraDetalle } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

class OrdenesCompraDetalleService {
    /**
     * Calcular subtotal automáticamente
     * @param {number} cantidad - Cantidad ordenada
     * @param {number} precioUnitario - Precio unitario
     * @returns {number}
     */
    calcularSubtotal(cantidad, precioUnitario) {
        return parseFloat((cantidad * precioUnitario).toFixed(2));
    }

    /**
     * Crear detalle de orden de compra
     * @param {Object} data - Datos del detalle
     * @returns {Promise<Object>}
     */
    async createDetalle(data) {
        try {
            // Validar datos requeridos
            if (!data.id_orden_compra) {
                throw new Error('El ID de la orden de compra es requerido');
            }
            if (!data.id_producto) {
                throw new Error('El ID del producto es requerido');
            }
            if (!data.cantidad_ordenada || data.cantidad_ordenada < 1) {
                throw new Error('La cantidad ordenada debe ser mayor a 0');
            }
            if (!data.precio_unitario || data.precio_unitario < 0) {
                throw new Error('El precio unitario debe ser mayor o igual a 0');
            }

            // Verificar si el producto ya existe en la orden
            const existe = await OrdenesCompraDetalle.findOne({
                where: {
                    id_orden_compra: data.id_orden_compra,
                    id_producto: data.id_producto
                }
            });

            if (existe) {
                throw new Error('El producto ya existe en esta orden de compra');
            }

            // Calcular subtotal si no se proporciona
            const subtotal = data.subtotal || this.calcularSubtotal(
                data.cantidad_ordenada,
                data.precio_unitario
            );

            const detalleData = {
                ...data,
                subtotal,
                cantidad_recibida: data.cantidad_recibida || 0
            };

            return await OrdenesCompraDetalle.create(detalleData);
        } catch (error) {
            throw new Error(`Error al crear detalle de orden: ${error.message}`);
        }
    }

    /**
     * Crear múltiples detalles de orden
     * @param {Array} detalles - Array de detalles
     * @returns {Promise<Array>}
     */
    async createMultipleDetalles(detalles) {
        const transaction = await sequelize.transaction();
        try {
            if (!Array.isArray(detalles) || detalles.length === 0) {
                throw new Error('Debe proporcionar al menos un detalle');
            }

            const detallesCreados = [];

            for (const detalle of detalles) {
                // Calcular subtotal
                const subtotal = detalle.subtotal || this.calcularSubtotal(
                    detalle.cantidad_ordenada,
                    detalle.precio_unitario
                );

                const detalleData = {
                    ...detalle,
                    subtotal,
                    cantidad_recibida: detalle.cantidad_recibida || 0
                };

                const creado = await OrdenesCompraDetalle.create(detalleData, { transaction });
                detallesCreados.push(creado);
            }

            await transaction.commit();
            return detallesCreados;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al crear múltiples detalles: ${error.message}`);
        }
    }

    /**
     * Obtener todos los detalles
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllDetalles(options = {}) {
        try {
            const where = {};

            if (options.id_orden_compra) {
                where.id_orden_compra = options.id_orden_compra;
            }

            if (options.id_producto) {
                where.id_producto = options.id_producto;
            }

            // Filtrar por estado de recepción
            if (options.recibido_completo === true) {
                where[Op.and] = sequelize.literal('cantidad_recibida >= cantidad_ordenada');
            } else if (options.recibido_completo === false) {
                where[Op.and] = sequelize.literal('cantidad_recibida < cantidad_ordenada');
            }

            return await OrdenesCompraDetalle.findAll({
                where,
                order: [['id_detalle', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener detalles: ${error.message}`);
        }
    }

    /**
     * Obtener detalle por ID
     * @param {number} id - ID del detalle
     * @returns {Promise<Object>}
     */
    async getDetalleById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const detalle = await OrdenesCompraDetalle.findByPk(id);

            if (!detalle) {
                throw new Error('Detalle no encontrado');
            }

            return detalle;
        } catch (error) {
            throw new Error(`Error al obtener detalle: ${error.message}`);
        }
    }

    /**
     * Obtener detalles por orden de compra
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<Array>}
     */
    async getDetallesByOrden(idOrdenCompra) {
        try {
            if (!idOrdenCompra || isNaN(idOrdenCompra)) {
                throw new Error('ID de orden inválido');
            }

            return await OrdenesCompraDetalle.findAll({
                where: { id_orden_compra: idOrdenCompra },
                order: [['id_detalle', 'ASC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener detalles por orden: ${error.message}`);
        }
    }

    /**
     * Obtener detalles por producto
     * @param {number} idProducto - ID del producto
     * @returns {Promise<Array>}
     */
    async getDetallesByProducto(idProducto) {
        try {
            if (!idProducto || isNaN(idProducto)) {
                throw new Error('ID de producto inválido');
            }

            return await OrdenesCompraDetalle.findAll({
                where: { id_producto: idProducto },
                order: [['id_orden_compra', 'DESC']]
            });
        } catch (error) {
            throw new Error(`Error al obtener detalles por producto: ${error.message}`);
        }
    }

    /**
     * Actualizar detalle
     * @param {number} id - ID del detalle
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateDetalle(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const detalle = await OrdenesCompraDetalle.findByPk(id);

            if (!detalle) {
                throw new Error('Detalle no encontrado');
            }

            // Validar cantidad ordenada
            if (updates.cantidad_ordenada !== undefined && updates.cantidad_ordenada < 1) {
                throw new Error('La cantidad ordenada debe ser mayor a 0');
            }

            // Validar cantidad recibida
            if (updates.cantidad_recibida !== undefined && updates.cantidad_recibida < 0) {
                throw new Error('La cantidad recibida no puede ser negativa');
            }

            // Validar que cantidad recibida no exceda cantidad ordenada
            const cantidadOrdenada = updates.cantidad_ordenada || detalle.cantidad_ordenada;
            const cantidadRecibida = updates.cantidad_recibida !== undefined 
                ? updates.cantidad_recibida 
                : detalle.cantidad_recibida;

            if (cantidadRecibida > cantidadOrdenada) {
                throw new Error('La cantidad recibida no puede ser mayor a la cantidad ordenada');
            }

            // Validar precio unitario
            if (updates.precio_unitario !== undefined && updates.precio_unitario < 0) {
                throw new Error('El precio unitario debe ser mayor o igual a 0');
            }

            // Recalcular subtotal si se actualizan cantidad o precio
            if (updates.cantidad_ordenada || updates.precio_unitario) {
                const cantidad = updates.cantidad_ordenada || detalle.cantidad_ordenada;
                const precio = updates.precio_unitario || detalle.precio_unitario;
                updates.subtotal = this.calcularSubtotal(cantidad, precio);
            }

            await detalle.update(updates);
            return detalle;
        } catch (error) {
            throw new Error(`Error al actualizar detalle: ${error.message}`);
        }
    }

    /**
     * Registrar cantidad recibida
     * @param {number} id - ID del detalle
     * @param {number} cantidadRecibida - Cantidad recibida
     * @returns {Promise<Object>}
     */
    async registrarCantidadRecibida(id, cantidadRecibida) {
        try {
            const detalle = await this.getDetalleById(id);

            if (cantidadRecibida < 0) {
                throw new Error('La cantidad recibida no puede ser negativa');
            }

            if (cantidadRecibida > detalle.cantidad_ordenada) {
                throw new Error('La cantidad recibida no puede ser mayor a la cantidad ordenada');
            }

            await detalle.update({ cantidad_recibida: cantidadRecibida });
            return detalle;
        } catch (error) {
            throw new Error(`Error al registrar cantidad recibida: ${error.message}`);
        }
    }

    /**
     * Registrar recepción parcial
     * @param {number} id - ID del detalle
     * @param {number} cantidadAdicional - Cantidad adicional recibida
     * @returns {Promise<Object>}
     */
    async registrarRecepcionParcial(id, cantidadAdicional) {
        try {
            const detalle = await this.getDetalleById(id);

            if (cantidadAdicional <= 0) {
                throw new Error('La cantidad adicional debe ser mayor a 0');
            }

            const nuevaCantidadRecibida = detalle.cantidad_recibida + cantidadAdicional;

            if (nuevaCantidadRecibida > detalle.cantidad_ordenada) {
                throw new Error('La cantidad total recibida excedería la cantidad ordenada');
            }

            await detalle.update({ cantidad_recibida: nuevaCantidadRecibida });
            return detalle;
        } catch (error) {
            throw new Error(`Error al registrar recepción parcial: ${error.message}`);
        }
    }

    /**
     * Marcar detalle como completamente recibido
     * @param {number} id - ID del detalle
     * @returns {Promise<Object>}
     */
    async marcarComoRecibido(id) {
        try {
            const detalle = await this.getDetalleById(id);

            await detalle.update({ cantidad_recibida: detalle.cantidad_ordenada });
            return detalle;
        } catch (error) {
            throw new Error(`Error al marcar como recibido: ${error.message}`);
        }
    }

    /**
     * Marcar todos los detalles de una orden como recibidos
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<Array>}
     */
    async marcarOrdenComoRecibida(idOrdenCompra) {
        const transaction = await sequelize.transaction();
        try {
            const detalles = await this.getDetallesByOrden(idOrdenCompra);

            const detallesActualizados = [];
            for (const detalle of detalles) {
                await detalle.update(
                    { cantidad_recibida: detalle.cantidad_ordenada },
                    { transaction }
                );
                detallesActualizados.push(detalle);
            }

            await transaction.commit();
            return detallesActualizados;
        } catch (error) {
            await transaction.rollback();
            throw new Error(`Error al marcar orden como recibida: ${error.message}`);
        }
    }

    /**
     * Eliminar detalle
     * @param {number} id - ID del detalle
     * @returns {Promise<boolean>}
     */
    async deleteDetalle(id) {
        try {
            const detalle = await this.getDetalleById(id);

            if (detalle.cantidad_recibida > 0) {
                throw new Error('No se puede eliminar un detalle con cantidad recibida. Considere ajustar la cantidad.');
            }

            await detalle.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar detalle: ${error.message}`);
        }
    }

    /**
     * Eliminar todos los detalles de una orden
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<number>}
     */
    async deleteDetallesByOrden(idOrdenCompra) {
        try {
            const detalles = await this.getDetallesByOrden(idOrdenCompra);

            // Verificar que ningún detalle tenga cantidad recibida
            const tieneRecepcion = detalles.some(d => d.cantidad_recibida > 0);
            if (tieneRecepcion) {
                throw new Error('No se pueden eliminar detalles con cantidad recibida');
            }

            const count = await OrdenesCompraDetalle.destroy({
                where: { id_orden_compra: idOrdenCompra }
            });

            return count;
        } catch (error) {
            throw new Error(`Error al eliminar detalles de orden: ${error.message}`);
        }
    }

    /**
     * Calcular total de una orden
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<Object>}
     */
    async calcularTotalOrden(idOrdenCompra) {
        try {
            const result = await OrdenesCompraDetalle.findOne({
                where: { id_orden_compra: idOrdenCompra },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('subtotal')), 'total'],
                    [sequelize.fn('COUNT', sequelize.col('id_detalle')), 'items'],
                    [sequelize.fn('SUM', sequelize.col('cantidad_ordenada')), 'total_unidades']
                ]
            });

            return {
                total: parseFloat(result.getDataValue('total')) || 0,
                items: parseInt(result.getDataValue('items')) || 0,
                total_unidades: parseInt(result.getDataValue('total_unidades')) || 0
            };
        } catch (error) {
            throw new Error(`Error al calcular total de orden: ${error.message}`);
        }
    }

    /**
     * Obtener detalles pendientes de recibir
     * @param {number} idOrdenCompra - ID de la orden de compra (opcional)
     * @returns {Promise<Array>}
     */
    async getDetallesPendientes(idOrdenCompra = null) {
        try {
            const where = sequelize.literal('cantidad_recibida < cantidad_ordenada');

            if (idOrdenCompra) {
                return await OrdenesCompraDetalle.findAll({
                    where: {
                        id_orden_compra: idOrdenCompra,
                        [Op.and]: where
                    }
                });
            }

            return await OrdenesCompraDetalle.findAll({
                where: { [Op.and]: where }
            });
        } catch (error) {
            throw new Error(`Error al obtener detalles pendientes: ${error.message}`);
        }
    }

    /**
     * Obtener detalles completamente recibidos
     * @param {number} idOrdenCompra - ID de la orden de compra (opcional)
     * @returns {Promise<Array>}
     */
    async getDetallesCompletados(idOrdenCompra = null) {
        try {
            const where = sequelize.literal('cantidad_recibida >= cantidad_ordenada');

            if (idOrdenCompra) {
                return await OrdenesCompraDetalle.findAll({
                    where: {
                        id_orden_compra: idOrdenCompra,
                        [Op.and]: where
                    }
                });
            }

            return await OrdenesCompraDetalle.findAll({
                where: { [Op.and]: where }
            });
        } catch (error) {
            throw new Error(`Error al obtener detalles completados: ${error.message}`);
        }
    }

    /**
     * Verificar si una orden está completamente recibida
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<Object>}
     */
    async verificarRecepcionCompleta(idOrdenCompra) {
        try {
            const detalles = await this.getDetallesByOrden(idOrdenCompra);
            
            if (detalles.length === 0) {
                return { completa: false, detalles: 0, recibidos: 0, pendientes: 0 };
            }

            const recibidos = detalles.filter(d => d.cantidad_recibida >= d.cantidad_ordenada).length;
            const pendientes = detalles.length - recibidos;

            return {
                completa: pendientes === 0,
                detalles: detalles.length,
                recibidos,
                pendientes,
                porcentaje: ((recibidos / detalles.length) * 100).toFixed(2)
            };
        } catch (error) {
            throw new Error(`Error al verificar recepción completa: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas de recepción por orden
     * @param {number} idOrdenCompra - ID de la orden de compra
     * @returns {Promise<Object>}
     */
    async getEstadisticasRecepcion(idOrdenCompra) {
        try {
            const result = await OrdenesCompraDetalle.findAll({
                where: { id_orden_compra: idOrdenCompra },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('cantidad_ordenada')), 'total_ordenado'],
                    [sequelize.fn('SUM', sequelize.col('cantidad_recibida')), 'total_recibido'],
                    [sequelize.fn('COUNT', sequelize.col('id_detalle')), 'total_items']
                ]
            });

            const data = result[0];
            const totalOrdenado = parseInt(data.getDataValue('total_ordenado')) || 0;
            const totalRecibido = parseInt(data.getDataValue('total_recibido')) || 0;
            const totalItems = parseInt(data.getDataValue('total_items')) || 0;
            const pendiente = totalOrdenado - totalRecibido;
            const porcentaje = totalOrdenado > 0 
                ? ((totalRecibido / totalOrdenado) * 100).toFixed(2) 
                : 0;

            return {
                total_ordenado: totalOrdenado,
                total_recibido: totalRecibido,
                total_pendiente: pendiente,
                total_items: totalItems,
                porcentaje_recibido: parseFloat(porcentaje)
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de recepción: ${error.message}`);
        }
    }

    /**
     * Contar detalles
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countDetalles(filters = {}) {
        try {
            const where = {};

            if (filters.id_orden_compra) {
                where.id_orden_compra = filters.id_orden_compra;
            }
            if (filters.id_producto) {
                where.id_producto = filters.id_producto;
            }

            return await OrdenesCompraDetalle.count({ where });
        } catch (error) {
            throw new Error(`Error al contar detalles: ${error.message}`);
        }
    }

    /**
     * Verificar si un detalle existe
     * @param {number} id - ID del detalle
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await OrdenesCompraDetalle.count({
                where: { id_detalle: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de detalle: ${error.message}`);
        }
    }
}

export default new OrdenesCompraDetalleService();