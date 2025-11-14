import paymentService from '../services/payment.service.js';
import ordenService from '../services/orden.service.js';
import clienteService from '../services/cliente.service.js';
import * as response from '../utils/response.js';

class PaymentController {
    async getPaymentsByOrder(req, res) {
        try {
            const { id_orden } = req.params;
            const { id_usuario, nombre_rol } = req; // Cambiado de 'rol' a 'nombre_rol'

            // Verificar propiedad de la orden
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json(response.notFound('Orden no encontrada'));
            }

            if (nombre_rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden('No tienes permisos para ver los pagos de esta orden'));
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
            const { id_usuario, nombre_rol } = req; // Cambiado de 'rol' a 'nombre_rol'

            // Verificar que la orden exista y pertenezca al usuario (o sea admin)
            const orden = await ordenService.getOrderDetailsById(id_orden);
            if (!orden) {
                return res.status(404).json(response.notFound('Orden no encontrada'));
            }

            if (nombre_rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden('No tienes permisos para crear pagos para esta orden'));
                }
            }

            const paymentData = { 
                ...req.body, 
                id_orden,
                ip_origen: req.ip // Capturar IP del cliente
            };

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
            const { id_usuario, nombre_rol } = req;

            const payment = await paymentService.getPaymentById(id);
            if (!payment) {
                return res.status(404).json(response.notFound('Pago no encontrado'));
            }

            // Verificar permisos: admin o dueño de la orden
            if (nombre_rol !== 'administrador') {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (!cliente || payment.orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden('No tienes permisos para ver este pago'));
                }
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
            const { nombre_rol } = req;

            // Solo administradores pueden actualizar estados de pago
            if (nombre_rol !== 'administrador') {
                return res.status(403).json(response.forbidden('Solo los administradores pueden actualizar estados de pago'));
            }

            if (!estado_pago) {
                return res.status(400).json(response.badRequest('estado_pago es requerido'));
            }

            const estadosValidos = ['pendiente', 'procesando', 'completado', 'fallido', 'reembolsado', 'cancelado'];
            if (!estadosValidos.includes(estado_pago)) {
                return res.status(400).json(
                    response.badRequest(`Estado no válido. Estados permitidos: ${estadosValidos.join(', ')}`)
                );
            }

            const payment = await paymentService.updatePaymentStatus(id, estado_pago);
            res.status(200).json(response.success(payment, 'Estado del pago actualizado'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async getAllPayments(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                estado_pago, 
                id_orden, 
                orderBy = 'fecha_pago', 
                order = 'DESC' 
            } = req.query;
            
            const { nombre_rol } = req;

            // Solo los admins pueden ver todos los pagos
            if (nombre_rol !== 'administrador') {
                return res.status(403).json(response.forbidden('Solo los administradores pueden ver todos los pagos'));
            }

            const opciones = {
                page: parseInt(page),
                limit: parseInt(limit),
                estado_pago: estado_pago || undefined,
                id_orden: id_orden || undefined,
                orderBy,
                order
            };

            const payments = await paymentService.getAllPayments(opciones);
            res.status(200).json(response.success(payments));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async deletePayment(req, res) {
        try {
            const { id } = req.params;
            const { nombre_rol } = req;

            // Solo los admins pueden eliminar pagos
            if (nombre_rol !== 'administrador') {
                return res.status(403).json(response.forbidden('Solo los administradores pueden eliminar pagos'));
            }

            await paymentService.deletePayment(id);
            res.status(200).json(response.success(null, 'Pago eliminado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
}

export default new PaymentController();