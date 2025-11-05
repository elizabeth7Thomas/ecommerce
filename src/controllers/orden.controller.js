import ordenService from '../services/orden.service.js';
import { Cliente } from '../models/index.js';

class OrdenController {
    async createOrder(req, res) {
        try {
            // El id_usuario viene del token JWT
            const { id_usuario } = req;
            const { id_direccion_envio, notas_orden } = req.body;

            // Encontrar el id_cliente asociado al id_usuario
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({ message: 'Perfil de cliente no encontrado.' });
            }

            const nuevaOrden = await ordenService.createOrderFromCart(cliente.id_cliente, id_direccion_envio, notas_orden);
            res.status(201).json({ message: 'Orden creada exitosamente', orden: nuevaOrden });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getMyOrders(req, res) {
        try {
            const { id_usuario, rol } = req;
            
            if (rol === 'administrador') {
                 const ordenes = await ordenService.getAllOrders();
                 return res.status(200).json(ordenes);
            }
            
            const cliente = await Cliente.findOne({ where: { id_usuario } });
            if (!cliente) {
                return res.status(404).json({ message: 'Perfil de cliente no encontrado.' });
            }
            const ordenes = await ordenService.getOrdersByClientId(cliente.id_cliente);
            res.status(200).json(ordenes);
        } catch (error) {
            res.status(500).json({ message: error.message });
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
                     return res.status(403).json({ message: 'Acceso denegado. No eres el propietario de esta orden.' });
                 }
            }
            
            res.status(200).json(orden);
        } catch (error) {
            if (error.message === 'Orden no encontrada') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }
    
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado_orden } = req.body;
            if (!estado_orden) {
                return res.status(400).json({ message: 'El campo estado_orden es requerido.' });
            }
            
            const orden = await ordenService.updateOrderStatus(id, estado_orden);
            res.status(200).json({ message: 'Estado de la orden actualizado', orden });
        } catch (error) {
             if (error.message === 'Orden no encontrada') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }
}

export default new OrdenController();
