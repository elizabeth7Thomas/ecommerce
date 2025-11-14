// En /src/controllers/orden.controller.js
import ordenService from '../services/orden.service.js';
import { Cliente } from '../models/index.js';
import * as response from '../utils/response.js';

class OrdenController {
    async createOrder(req, res) {
        try {
            const { id_usuario } = req;
            const { id_direccion_envio, notas_orden } = req.body;

            // Validaciones básicas
            if (!id_direccion_envio) {
                return res.status(400).json({
                    success: false,
                    message: 'La dirección de envío es requerida'
                });
            }

            // Encontrar el cliente
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado'
                });
            }

            const nuevaOrden = await ordenService.createOrderFromCart(
                cliente.id_cliente, 
                id_direccion_envio, 
                notas_orden
            );
            
            res.status(201).json({
                success: true,
                data: nuevaOrden,
                message: 'Orden creada exitosamente'
            });
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getMyOrders(req, res) {
        try {
            const { id_usuario, nombre_rol } = req;
            
            if (nombre_rol === 'administrador') {
                const ordenes = await ordenService.getAllOrders();
                return res.status(200).json({
                    success: true,
                    data: ordenes
                });
            }
            
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado'
                });
            }
            
            const ordenes = await ordenService.getOrdersByClientId(cliente.id_cliente);
            res.status(200).json({
                success: true,
                data: ordenes
            });
        } catch (error) {
            console.error('Error getting orders:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const { id_usuario, nombre_rol } = req;
            
            const orden = await ordenService.getOrderDetailsById(id);

            // Verificar permisos
            if (nombre_rol !== 'administrador') {
                const cliente = await Cliente.findOne({ where: { id_usuario } });
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para ver esta orden'
                    });
                }
            }
            
            res.status(200).json({
                success: true,
                data: orden
            });
        } catch (error) {
            console.error('Error getting order details:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado_orden } = req.body;
            
            if (!estado_orden) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo estado_orden es requerido'
                });
            }

            const orden = await ordenService.updateOrderStatus(id, estado_orden);
            res.status(200).json({
                success: true,
                data: orden,
                message: 'Estado de la orden actualizado'
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteOrder(req, res) {
        try {
            const { id } = req.params;
            const { id_usuario, nombre_rol } = req;

            // Validar que la orden exista
            const orden = await ordenService.getOrderDetailsById(id);
            if (!orden) {
                return res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada'
                });
            }

            // Verificar permisos
            if (nombre_rol !== 'administrador') {
                const cliente = await Cliente.findOne({ where: { id_usuario } });
                if (!cliente || orden.id_cliente !== cliente.id_cliente) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para eliminar esta orden'
                    });
                }
            }

            await ordenService.deleteOrder(id);
            res.status(200).json({
                success: true,
                message: 'Orden eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error deleting order:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

// Exportar instancia del controlador
export default new OrdenController();