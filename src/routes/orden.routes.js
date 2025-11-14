// En /src/routes/orden.routes.js - VERSIÓN COMPLETA CORREGIDA
import { Router } from 'express';
import ordenController from '../controllers/orden.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import { nestedPaymentRoutes } from './payment.routes.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Órdenes
 *   description: API para la gestión de órdenes de compra
 */

// Middleware para validar parámetros
const validateOrderId = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID de orden inválido'
        });
    }
    next();
};

// ============================================
// RUTAS PRINCIPALES
// ============================================

/**
 * @swagger
 * /api/ordenes:
 *   post:
 *     summary: Crea una nueva orden a partir del carrito del usuario
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', verifyToken, ordenController.createOrder);

/**
 * @swagger
 * /api/ordenes:
 *   get:
 *     summary: Obtiene las órdenes del usuario autenticado
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', verifyToken, ordenController.getMyOrders);

// ============================================
// RUTAS ESPECÍFICAS POR ID
// ============================================

/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     summary: Obtiene el detalle completo de una orden
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', verifyToken, validateOrderId, ordenController.getOrderById);


/**
 * @swagger
 * /api/ordenes/{id_orden}:
 *   delete:
 *     summary: Cancela una orden (solo si está pendiente y es del usuario)
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id_orden', verifyToken, validateOrderId, ordenController.cancelMyOrder);

/**
 * @swagger
 * /api/ordenes/{id}/status:
 *   put:
 *     summary: Actualiza el estado de una orden (Solo Administradores)
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/status', verifyToken, isAdmin, validateOrderId, ordenController.updateOrderStatus);

// ============================================
// RUTAS ANIDADAS
// ============================================

/**
 * @swagger
 * /api/ordenes/{id_orden}/pagos:
 *   get:
 *     summary: Obtiene los pagos de una orden específica
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 */
router.use('/:id_orden/pagos', verifyToken, (req, res, next) => {
    const idOrden = parseInt(req.params.id_orden);
    if (isNaN(idOrden) || idOrden <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID de orden inválido'
        });
    }
    next();
}, nestedPaymentRoutes);

// EXPORT DEFAULT CORREGIDO
export default router;