import { Op } from 'sequelize';
import { Orden, Payment } from '../models/index.js';
import sequelize from '../config/database.js';

class PaymentService {
    async getPaymentsByOrder(id_orden) {
        return Payment.findAll({ 
            where: { id_orden },
            include: [
                {
                    model: Orden,
                    as: 'orden',
                    attributes: ['id_orden', 'total_orden', 'estado_orden']
                }
            ]
        });
    }

    async getPaymentById(id_pago) {
        return Payment.findByPk(id_pago, {
            include: [
                {
                    model: Orden,
                    as: 'orden',
                    attributes: ['id_orden', 'total_orden', 'estado_orden', 'id_cliente']
                }
            ]
        });
    }

    async createPayment(data) {
        const t = await sequelize.transaction();
        try {
            const { id_orden } = data;
            
            if (!id_orden) {
                throw new Error('id_orden es requerido');
            }

            const orden = await Orden.findByPk(id_orden, { transaction: t });
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            // Validar monto
            if (parseFloat(data.monto) !== parseFloat(orden.total_orden)) {
                throw new Error(`El monto del pago (${data.monto}) no coincide con el total de la orden (${orden.total_orden}).`);
            }

            // Verificar si ya existe un pago completado para esta orden
            const existingPayment = await Payment.findOne({ 
                where: { 
                    id_orden, 
                    estado_pago: 'completado' 
                }, 
                transaction: t 
            });
            
            if (existingPayment) {
                throw new Error('Esta orden ya tiene un pago completado.');
            }

            const nuevoPago = await Payment.create(data, { transaction: t });
            
            // Actualizar estado de la orden si el pago se completa
            if (nuevoPago.estado_pago === 'completado') {
                await orden.update({ estado_orden: 'procesando' }, { transaction: t });
            }

            await t.commit();
            return nuevoPago;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async updatePaymentStatus(id_pago, nuevo_estado) {
        const t = await sequelize.transaction();
        try {
            const pago = await Payment.findByPk(id_pago, { 
                transaction: t,
                include: [
                    {
                        model: Orden,
                        as: 'orden'
                    }
                ]
            });
            
            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            await pago.update({ estado_pago: nuevo_estado }, { transaction: t });

            const orden = pago.orden;
            
            // Actualizar estado de la orden basado en el estado del pago
            if (nuevo_estado === 'completado' && orden.estado_orden === 'pendiente') {
                await orden.update({ estado_orden: 'procesando' }, { transaction: t });
            } else if (nuevo_estado === 'reembolsado' || nuevo_estado === 'cancelado') {
                await orden.update({ estado_orden: 'cancelado' }, { transaction: t });
            } else if (nuevo_estado === 'fallido' && orden.estado_orden === 'procesando') {
                await orden.update({ estado_orden: 'pendiente' }, { transaction: t });
            }

            await t.commit();
            return pago;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async getAllPayments(opciones = {}) {
        const {
            page = 1,
            limit = 10,
            estado_pago,
            id_orden,
            orderBy = 'fecha_pago',
            order = 'DESC'
        } = opciones;

        const where = {};
        
        if (estado_pago) {
            where.estado_pago = estado_pago;
        }
        
        if (id_orden) {
            where.id_orden = id_orden;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Payment.findAndCountAll({
            where,
            include: [
                {
                    model: Orden,
                    as: 'orden',
                    attributes: ['id_orden', 'total_orden', 'estado_orden', 'id_cliente']
                }
            ],
            order: [[orderBy, order.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            payments: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            hasNext: page < Math.ceil(count / limit),
            hasPrev: page > 1
        };
    }

    async deletePayment(id_pago) {
        const t = await sequelize.transaction();
        try {
            const pago = await Payment.findByPk(id_pago, { transaction: t });
            
            if (!pago) {
                throw new Error('Pago no encontrado');
            }

            // Solo permitir eliminar pagos pendientes
            if (pago.estado_pago !== 'pendiente') {
                throw new Error(`No se puede eliminar un pago en estado ${pago.estado_pago}`);
            }

            await pago.destroy({ transaction: t });
            await t.commit();
            
            return true;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

export default new PaymentService();