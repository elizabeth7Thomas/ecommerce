import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id_pago:
 *           type: integer
 *         id_orden:
 *           type: integer
 *         metodo_pago:
 *           type: string
 *           enum: [tarjeta_credito, tarjeta_debito, paypal, transferencia, efectivo]
 *         monto:
 *           type: number
 *           format: float
 *         estado_pago:
 *           type: string
 *           enum: [pendiente, procesando, completado, fallido, reembolsado, cancelado]
 *         fecha_pago:
 *           type: string
 *           format: date-time
 *         transaccion_id:
 *           type: string
 *         orden:
 *           type: object
 *           description: Alias correcto para acceder a la orden relacionada
 *           properties:
 *             id_orden:
 *               type: integer
 *             numero_orden:
 *               type: string
 *             total_orden:
 *               type: number
 *             estado_orden:
 *               type: string
 *
 *     PaymentInput:
 *       type: object
 *       required: [metodo_pago, monto, estado_pago]
 *       properties:
 *         metodo_pago:
 *           type: string
 *         monto:
 *           type: number
 *           format: float
 *         estado_pago:
 *           type: string
 *         transaccion_id:
 *           type: string
 *         detalles_pago:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: API para gestionar los pagos de las órdenes
 */

// Rutas anidadas bajo /api/ordenes/:id_orden/pagos
const nestedRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/ordenes/{id_orden}/pagos:
 *   get:
 *     summary: Obtiene los pagos de una orden específica
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         schema: { type: integer }
 *         required: true
 *         description: El ID de la orden.
 *     responses:
 *       200:
 *         description: Lista de pagos de la orden
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
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (no es tu orden o no eres admin)
 *       404:
 *         description: Orden no encontrada
 */
nestedRouter.get('/', [verifyToken], paymentController.getPaymentsByOrder);

/**
 * @swagger
 * /api/ordenes/{id_orden}/pagos:
 *   post:
 *     summary: Crea un nuevo pago para una orden
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         schema: { type: integer }
 *         required: true
 *         description: El ID de la orden.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInput'
 *     responses:
 *       201:
 *         description: Pago creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Datos inválidos (ej. monto incorrecto)
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
 */
nestedRouter.post('/', [verifyToken], paymentController.createPayment);

// Ruta para que un admin actualice el estado de un pago
/**
 * @swagger
 * /api/pagos/{id}/status:
 *   put:
 *     summary: Actualiza el estado de un pago (Solo Administradores)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *         description: El ID del pago a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_pago:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado del pago actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere permisos de administrador)
 *       404:
 *         description: Pago no encontrado
 */
router.put('/pagos/:id/status', [verifyToken, isAdmin], paymentController.updatePaymentStatus);

export { router as paymentRoutes, nestedRouter as nestedPaymentRoutes };