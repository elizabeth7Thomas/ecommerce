import paymentService from '../services/payment.service.js';
import ordenService from '../services/orden.service.js';
import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class PaymentController {
    async getPaymentsByOrder(req, res) {
        try {
            const { id_orden } = req.params;
            const { id_usuario, rol } = req;

            // Verificar propiedad de la orden
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json(response.notFound('Orden no encontrada'));
            }

            if (rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden());
                }
            }

            const payments = await paymentService.getPaymentsByOrder(id_orden);
            res.status(200).json(response.success(payments));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async createPayment(req, res) {
        try {
            const { id_orden } = req.params;
            const { id_usuario, rol } = req;

            // Verificar que la orden exista y pertenezca al usuario (o sea admin)
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json(response.notFound('Orden no encontrada'));
            }

            if (rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden());
                }
            }

            const paymentData = { ...req.body, id_orden };
            const payment = await paymentService.createPayment(paymentData);
            res.status(201).json(response.created(payment, 'Pago creado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async getPaymentById(req, res) {
        try {
            const { id } = req.params;
            const payment = await paymentService.getPaymentById(id);
            if (!payment) {
                return res.status(404).json(response.notFound('Pago no encontrado'));
            }
            res.status(200).json(response.success(payment));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async updatePaymentStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado_pago } = req.body;

            if (!estado_pago) {
                return res.status(400).json(response.badRequest('estado_pago es requerido'));
            }

            const payment = await paymentService.updatePaymentStatus(id, estado_pago);
            res.status(200).json(response.success(payment, 'Estado del pago actualizado'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }
}

export default new PaymentController();