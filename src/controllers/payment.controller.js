import paymentService from '../services/payment.service.js';
import ordenService from '../services/orden.service.js';
import clienteService from '../services/cliente.service.js';

class PaymentController {
    async getPaymentsByOrder(req, res) {
        try {
            const { id_orden } = req.params;
            const { id_usuario, rol } = req;

            // Verificar propiedad de la orden
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            if (rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json({ message: 'Acceso denegado' });
                }
            }

            const payments = await paymentService.getPaymentsByOrder(id_orden);
            res.status(200).json(payments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createPayment(req, res) {
        try {
            const { id_orden } = req.params;
            const { id_usuario, rol } = req;

            // Verificar que la orden exista y pertenezca al usuario (o sea admin)
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json({ message: 'Orden no encontrada' });
            }

            if (rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json({ message: 'Acceso denegado' });
                }
            }

            const paymentData = { ...req.body, id_orden };
            const payment = await paymentService.createPayment(paymentData);
            res.status(201).json({ message: 'Pago creado exitosamente', payment });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getPaymentById(req, res) {
        try {
            const { id } = req.params;
            const payment = await paymentService.getPaymentById(id);
            if (!payment) {
                return res.status(404).json({ message: 'Pago no encontrado' });
            }
            res.status(200).json(payment);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updatePaymentStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado_pago } = req.body;

            if (!estado_pago) {
                return res.status(400).json({ message: 'estado_pago es requerido' });
            }

            const payment = await paymentService.updatePaymentStatus(id, estado_pago);
            res.status(200).json({ message: 'Estado del pago actualizado', payment });
        } catch (error) {
            if (error.message === 'Pago no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: error.message });
        }
    }
}

export default new PaymentController();