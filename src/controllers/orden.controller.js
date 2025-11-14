import { ordenService } from '../services/orden.service.js'; // Asegúrate que la ruta sea correcta
import Cliente from '../models/cliente.model.js'; // Asegúrate que la ruta sea correcta

class OrdenController {
    /**
     * Actualiza el estado de una orden (solo administradores).
     */
    async updateOrderStatus(req, res) {
        try {
            const { id_orden } = req.params;
            const { estado_orden } = req.body;

            if (!estado_orden) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo estado_orden es requerido.',
                    code: 'ESTADO_REQUERIDO'
                });
            }

            const orden = await ordenService.updateOrderStatus(id_orden, estado_orden);

            res.status(200).json({
                success: true,
                data: orden,
                message: 'Estado de la orden actualizado correctamente.'
            });
        } catch (error) {
            console.error('Error al actualizar estado de la orden:', error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error al actualizar el estado de la orden.',
                code: 'ERROR_ACTUALIZAR_ESTADO_ORDEN'
            });
        }
    }

    /**
     * Crea una nueva orden desde el carrito de compras del usuario autenticado.
     */
    async createOrder(req, res) {
        try {
            // El id_usuario se inyecta desde un middleware de autenticación (ej. JWT)
            const { id_usuario } = req; 
            const { id_direccion_envio, notas_orden } = req.body;

            // 1. Validar la entrada
            if (!id_direccion_envio) {
                return res.status(400).json({
                    success: false,
                    message: 'La dirección de envío es requerida.',
                    code: 'DIRECCION_REQUERIDA'
                });
            }

            // 2. Buscar el perfil de cliente asociado al usuario
            const cliente = await Cliente.findOne({ 
                where: { id_usuario },
                attributes: ['id_cliente'] 
            });
            
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado para este usuario.',
                    code: 'CLIENTE_NO_ENCONTRADO'
                });
            }

            // 3. Llamar al servicio para crear la orden
            const nuevaOrden = await ordenService.createOrderFromCart(
                cliente.id_cliente, 
                id_direccion_envio, 
                notas_orden
            );
            
            // 4. Enviar respuesta exitosa
            res.status(201).json({
                success: true,
                data: nuevaOrden,
                message: 'Orden creada exitosamente.'
            });
            
        } catch (error) {
            console.error('Error al crear la orden:', error);
            
            // 5. Manejar errores conocidos y genéricos
            const isClientError = error.message.includes('stock') || 
                                  error.message.includes('vacío') ||
                                  error.message.includes('Dirección');
            
            const statusCode = isClientError ? 400 : 500;
            
            res.status(statusCode).json({
                success: false,
                message: error.message,
                code: 'ERROR_CREACION_ORDEN'
            });
        }
    }

    /**
     * Obtiene todas las órdenes del usuario autenticado.
     */
    async getMyOrders(req, res) {
        try {
            const { id_usuario } = req;

            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado.',
                    code: 'CLIENTE_NO_ENCONTRADO'
                });
            }

            const ordenes = await ordenService.getOrdersByClient(cliente.id_cliente);

            res.status(200).json({
                success: true,
                data: ordenes,
                message: 'Órdenes recuperadas exitosamente.'
            });

        } catch (error) {
            console.error('Error al obtener las órdenes del usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error al recuperar las órdenes.',
                code: 'ERROR_OBTENER_ORDENES'
            });
        }
    }

    /**
     * Obtiene una orden específica por su ID.
     * Verifica que la orden pertenezca al usuario que la solicita.
     */
    async getOrderById(req, res) {
        try {
            const { id_usuario } = req;
            const { id_orden } = req.params;

            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado.',
                    code: 'CLIENTE_NO_ENCONTRADO'
                });
            }

            const orden = await ordenService.getOrderDetailsById(id_orden);

            if (!orden) {
                return res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada.',
                    code: 'ORDEN_NO_ENCONTRADA'
                });
            }

            // Autorización: ¿El que pide la orden es el dueño?
            if (orden.id_cliente !== cliente.id_cliente) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para acceder a esta orden.',
                    code: 'ACCESO_DENEGADO'
                });
            }

            res.status(200).json({
                success: true,
                data: orden,
                message: 'Orden recuperada exitosamente.'
            });

        } catch (error) {
            console.error('Error al obtener detalle de la orden:', error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error al recuperar la orden.',
                code: 'ERROR_OBTENER_ORDEN'
            });
        }
    }
    
    /**
     * Cancela una orden. Solo puede ser cancelada por el usuario si está en estado 'pendiente'.
     */
    async cancelMyOrder(req, res) {
        try {
            const { id_usuario } = req;
            const { id_orden } = req.params;

            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de cliente no encontrado.',
                    code: 'CLIENTE_NO_ENCONTRADO'
                });
            }

            const orden = await ordenService.getOrderDetailsById(id_orden);

            if (!orden) {
                return res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada.',
                    code: 'ORDEN_NO_ENCONTRADA'
                });
            }

            if (orden.id_cliente !== cliente.id_cliente) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para cancelar esta orden.',
                    code: 'ACCESO_DENEGADO'
                });
            }

            if (orden.estado_orden !== 'pendiente') {
                return res.status(400).json({
                    success: false,
                    message: `No se puede cancelar una orden en estado '${orden.estado_orden}'.`,
                    code: 'CANCELACION_NO_PERMITIDA'
                });
            }
            
            // Aquí se podría añadir lógica para revertir el stock si no se maneja con triggers.
            const ordenActualizada = await ordenService.updateOrderStatus(id_orden, 'cancelado');

            res.status(200).json({
                success: true,
                data: ordenActualizada,
                message: 'La orden ha sido cancelada exitosamente.'
            });

        } catch (error) {
            console.error('Error al cancelar la orden:', error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error al cancelar la orden.',
                code: 'ERROR_CANCELAR_ORDEN'
            });
        }
    }
}

export default new OrdenController();