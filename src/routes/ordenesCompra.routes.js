import { Router } from 'express';
import ordenesCompraController from '../controllers/ordenesCompra.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/ordenes-compra:
 *   post:
 *     summary: Crear una nueva orden de compra
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_proveedor, id_almacen]
 *             properties:
 *               id_proveedor:
 *                 type: integer
 *               id_almacen:
 *                 type: integer
 *               fecha_entrega_esperada:
 *                 type: string
 *                 format: date
 *               total:
 *                 type: number
 *               estado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *   get:
 *     summary: Obtener todas las órdenes de compra
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Órdenes obtenidas exitosamente
 *
 * /api/ordenes-compra/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden obtenida
 *   put:
 *     summary: Actualizar orden
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_entrega_esperada:
 *                 type: string
 *               total:
 *                 type: number
 *     responses:
 *       200:
 *         description: Orden actualizada
 *   delete:
 *     summary: Eliminar orden
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden eliminada
 *
 * /api/ordenes-compra/proveedor/{id_proveedor}:
 *   get:
 *     summary: Obtener órdenes por proveedor
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_proveedor
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Órdenes obtenidas
 *
 * /api/ordenes-compra/estado/{estado}:
 *   get:
 *     summary: Obtener órdenes por estado
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estado
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Órdenes obtenidas
 *
 * /api/ordenes-compra/{id}/estado:
 *   put:
 *     summary: Cambiar estado de la orden
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 *
 * /api/ordenes-compra/{id}/entrega:
 *   put:
 *     summary: Registrar entrega
 *     tags: [Órdenes Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_entrega:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrega registrada
 */

router.post('/ordenes-compra', verifyToken, isAdmin, ordenesCompraController.create);
router.get('/ordenes-compra', verifyToken, ordenesCompraController.getAll);
router.get('/ordenes-compra/:id', verifyToken, ordenesCompraController.getById);
router.get('/ordenes-compra/proveedor/:id_proveedor', verifyToken, ordenesCompraController.getByProveedor);
router.get('/ordenes-compra/estado/:estado', verifyToken, ordenesCompraController.getByEstado);
router.put('/ordenes-compra/:id', verifyToken, isAdmin, ordenesCompraController.update);
router.put('/ordenes-compra/:id/estado', verifyToken, isAdmin, ordenesCompraController.updateEstado);
router.put('/ordenes-compra/:id/entrega', verifyToken, isAdmin, ordenesCompraController.registrarEntrega);
router.delete('/ordenes-compra/:id', verifyToken, isAdmin, ordenesCompraController.delete);

export default router;
