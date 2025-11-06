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
 * components:
 *   schemas:
 *     OrdenItem:
 *       type: object
 *       properties:
 *         id_item:
 *           type: integer
 *         id_orden:
 *           type: integer
 *         id_producto:
 *           type: integer
 *         cantidad:
 *           type: integer
 *         precio_unitario:
 *           type: number
 *           format: double
 *         producto:
 *           type: object
 *           properties:
 *             id_producto:
 *               type: integer
 *             nombre_producto:
 *               type: string
 *             precio:
 *               type: number
 *
 *     Orden:
 *       type: object
 *       properties:
 *         id_orden:
 *           type: integer
 *         numero_orden:
 *           type: string
 *           pattern: "ORD-YYYY-\\d{5}"
 *         id_cliente:
 *           type: integer
 *         id_direccion_envio:
 *           type: integer
 *         total_orden:
 *           type: number
 *           format: double
 *         estado_orden:
 *           type: string
 *           enum: [pendiente, confirmada, enviada, completada, cancelada]
 *         cliente:
 *           type: object
 *           description: Alias correcto para acceder al cliente
 *           properties:
 *             id_cliente:
 *               type: integer
 *             usuario:
 *               type: object
 *               properties:
 *                 nombre_usuario:
 *                   type: string
 *                 correo_electronico:
 *                   type: string
 *         direccionEnvio:
 *           type: object
 *           description: Alias correcto para acceder a la dirección
 *           properties:
 *             id_direccion:
 *               type: integer
 *             calle:
 *               type: string
 *             ciudad:
 *               type: string
 *             codigo_postal:
 *               type: string
 *             pais:
 *               type: string
 *         items:
 *           type: array
 *           description: Alias correcto (NO OrdenItems)
 *           items:
 *             $ref: '#/components/schemas/OrdenItem'
 *         pagos:
 *           type: array
 *           description: Alias correcto para acceder a los pagos
 *           items:
 *             type: object
 *             properties:
 *               id_pago:
 *                 type: integer
 *               monto:
 *                 type: number
 *               metodo_pago:
 *                 type: string
 *               estado_pago:
 *                 type: string
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *
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
 *             required: [id_direccion]
 *             properties:
 *               id_direccion:
 *                 type: integer
 *                 description: El ID de la dirección de envío del cliente
 *               notas_orden:
 *                 type: string
 *                 description: Notas adicionales para la orden
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Orden'
 *       400:
 *         description: Error en la solicitud (carrito vacío, stock insuficiente, dirección inválida)
 *       401:
 *         description: No autorizado
 */
router.post('/', [verifyToken], ordenController.createOrder);

/**
 * @swagger
 * /api/ordenes:
 *   get:
 *     summary: Obtiene las órdenes del usuario autenticado
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_orden:
 *                         type: integer
 *                       numero_orden:
 *                         type: string
 *                       estado_orden:
 *                         type: string
 *                       total_orden:
 *                         type: number
 *                       fecha_creacion:
 *                         type: string
 *       401:
 *         description: No autorizado
 */
router.get('/', [verifyToken], ordenController.getMyOrders);

/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     summary: Obtiene el detalle completo de una orden (con cliente, items, pagos)
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *         description: El ID de la orden
 *     responses:
 *       200:
 *         description: Detalle completo de la orden con todas las relaciones (cliente, items, pagos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Orden'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
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
 *         description: El ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_orden:
 *                 type: string
 *                 enum: [pendiente, confirmada, enviada, completada, cancelada]
 *                 description: Nuevo estado para la orden
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Orden'
 *       403:
 *         description: Acceso denegado (requiere permisos de administrador)
 *       404:
 *         description: Orden no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id/status', [verifyToken, isAdmin], ordenController.updateOrderStatus);


// Anidar rutas de pagos aquí
router.use('/:id_orden/pagos', nestedPaymentRoutes);

export default router;