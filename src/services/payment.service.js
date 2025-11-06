import { Orden, Payment } from '../models/index.js';
import sequelize from '../config/database.js';

class PaymentService {
    async getPaymentsByOrder(id_orden) {
        return Payment.findAll({ where: { id_orden } });
    }

    async getPaymentById(id_pago) {
        return Payment.findByPk(id_pago);
    }

    async createPayment(data) {
        const t = await sequelize.transaction();
        try {
            const { id_orden } = data;
            if (!id_orden) throw new Error('id_orden es requerido');
            const orden = await Orden.findByPk(id_orden, { transaction: t });
            if (!orden) throw new Error('Orden no encontrada');

            // Validar monto
            if (parseFloat(data.monto) !== parseFloat(orden.total_orden)) {
                throw new Error('El monto del pago no coincide con el total de la orden.');
            }

            const existingPayment = await Payment.findOne({ where: { id_orden, estado_pago: 'completado' }, transaction: t });
            if (existingPayment) throw new Error('Esta orden ya tiene un pago completado.');

            const nuevoPago = await Payment.create(data, { transaction: t });
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
                include: [{ model: Orden, as: 'orden' }] 
            });
            if (!pago) throw new Error('Pago no encontrado');

            await pago.update({ estado_pago: nuevo_estado }, { transaction: t });

            const orden = pago.orden;
            if (nuevo_estado === 'completado' && orden.estado_orden === 'pendiente') {
                await orden.update({ estado_orden: 'procesando' }, { transaction: t });
            } else if (nuevo_estado === 'reembolsado' || nuevo_estado === 'cancelado') {
                await orden.update({ estado_orden: 'cancelado' }, { transaction: t });
            }

            await t.commit();
            return pago;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

export default new PaymentService();