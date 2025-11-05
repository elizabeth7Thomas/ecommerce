// En /src/routes/orden.routes.js
import { Router } from 'express';
import ordenController from '../controllers/orden.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import { nestedPaymentRoutes } from './payment.routes.js'; // Importamos las rutas de pagos

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Órdenes
 *   description: API para la gestión de órdenes de compra
 */

/**
 * @swagger
 * /api/ordenes:
 *   post:
 *     summary: Crea una nueva orden a partir del carrito del usuario
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_direccion_envio]
 *             properties:
 *               id_direccion_envio:
 *                 type: integer
 *                 description: El ID de la dirección de envío del cliente.
 *               notas_orden:
 *                 type: string
 *                 description: Notas adicionales para la orden.
 *     responses:
 *       201:
 *         description: Orden creada exitosamente.
 *       400:
 *         description: Error en la solicitud (ej. carrito vacío, stock insuficiente).
 *       403:
 *         description: Acceso denegado.
 */
router.post('/', [verifyToken], ordenController.createOrder);

/**
 * @swagger
 * /api/ordenes:
 *   get:
 *     summary: Obtiene las órdenes del usuario (o todas si es admin)
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes.
 *       403:
 *         description: Acceso denegado.
 */
router.get('/', [verifyToken], ordenController.getMyOrders);

/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     summary: Obtiene el detalle de una orden específica
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *         description: El ID de la orden.
 *     responses:
 *       200:
 *         description: Detalle de la orden.
 *       403:
 *         description: Acceso denegado.
 *       404:
 *         description: Orden no encontrada.
 */
router.get('/:id', [verifyToken], ordenController.getOrderById);

/**
 * @swagger
 * /api/ordenes/{id}/status:
 *   put:
 *     summary: Actualiza el estado de una orden (Solo Administradores)
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *         description: El ID de la orden.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_orden:
 *                 type: string
 *                 enum: [pendiente, procesando, enviado, entregado, cancelado]
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *       403:
 *         description: Acceso denegado.
 *       404:
 *         description: Orden no encontrada.
 */
router.put('/:id/status', [verifyToken, isAdmin], ordenController.updateOrderStatus);


// Anidar rutas de pagos aquí
router.use('/:id_orden/pagos', nestedPaymentRoutes);

export default router;