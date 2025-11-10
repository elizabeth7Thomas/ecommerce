import ordenService from '../services/orden.service.js';
import { Cliente } from '../models/index.js';
import * as response from '../utils/response.js';

class OrdenController {
    async createOrder(req, res) {
        try {
            // El id_usuario viene del token JWT
            const { id_usuario } = req;
            const { id_direccion_envio, notas_orden } = req.body;

            // Encontrar el id_cliente asociado al id_usuario
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
            }

            const nuevaOrden = await ordenService.createOrderFromCart(cliente.id_cliente, id_direccion_envio, notas_orden);
            res.status(201).json(response.created(nuevaOrden, 'Orden creada exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async getMyOrders(req, res) {
        try {
            const { id_usuario, rol } = req;
            
            if (rol === 'administrador') {
                 const ordenes = await ordenService.getAllOrders();
                 return res.status(200).json(response.success(ordenes));
            }
            
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json(response.notFound('Perfil de cliente no encontrado'));
            }
            const ordenes = await ordenService.getOrdersByClientId(cliente.id_cliente);
            res.status(200).json(response.success(ordenes));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const { id_usuario, rol } = req;
            
            const orden = await ordenService.getOrderDetailsById(id);

            // Autorización: El usuario es admin o es el dueño de la orden
            if (rol !== 'administrador') {
                 const cliente = await Cliente.findOne({ where: { id_usuario } });
                 if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                     return res.status(403).json(response.forbidden('No eres el propietario de esta orden'));
                 }
            }
            
            res.status(200).json(response.success(orden));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
    
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado_orden } = req.body;
            if (!estado_orden) {
                return res.status(400).json(response.badRequest('El campo estado_orden es requerido'));
            }
            
            const orden = await ordenService.updateOrderStatus(id, estado_orden);
            res.status(200).json(response.success(orden, 'Estado de la orden actualizado'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async deleteOrder(req, res) {
        try {
            const { id } = req.params;
            const { id_usuario, rol } = req;

            // Validar que la orden exista
            const orden = await ordenService.getOrderDetailsById(id);
            if (!orden) {
                return res.status(404).json(response.notFound('Orden no encontrada'));
            }

            // Autorización: El usuario es admin o es el dueño de la orden
            if (rol !== 'administrador') {
                const cliente = await Cliente.findOne({ where: { id_usuario } });
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json(response.forbidden('No eres el propietario de esta orden'));
                }
            }

            // Solo se pueden eliminar órdenes en ciertos estados
            const estadosEliminables = ['pendiente', 'cancelada'];
            if (!estadosEliminables.includes(orden.estado_orden)) {
                return res.status(400).json(response.badRequest(`No se puede eliminar una orden en estado ${orden.estado_orden}`));
            }

            await ordenService.deleteOrder(id);
            res.status(200).json(response.success(null, 'Orden eliminada exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
}

export default new OrdenController();
