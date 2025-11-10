import { Router } from 'express';
import ordenItemController from '../controllers/ordenesItems.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Órdenes Items
 *   description: API para gestionar items de órdenes
 */

/**
 * @swagger
 * /api/ordenes-items:
 *   post:
 *     summary: Crear nuevo item de orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_orden:
 *                 type: integer
 *               id_producto:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *               precio_unitario:
 *                 type: number
 *                 format: decimal
 *               subtotal:
 *                 type: number
 *                 format: decimal
 *     responses:
 *       201:
 *         description: Item de orden creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', verifyToken, ordenItemController.createOrdenItem.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}:
 *   post:
 *     summary: Crear múltiples items para una orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
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
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                     precio_unitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Items creados exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/orden/:idOrden', verifyToken, ordenItemController.createMultipleOrdenItems.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/{id}:
 *   get:
 *     summary: Obtener item de orden por ID
 *     tags: [Órdenes Items]
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
 *         description: Item de orden encontrado
 *       404:
 *         description: Item no encontrado
 */
router.get('/:id', verifyToken, ordenItemController.getOrdenItemById.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}/items:
 *   get:
 *     summary: Obtener todos los items de una orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de items de la orden
 */
router.get('/orden/:idOrden/items', verifyToken, ordenItemController.getItemsByOrden.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}/producto/{idProducto}:
 *   get:
 *     summary: Obtener item específico de una orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item encontrado
 *       404:
 *         description: Item no encontrado
 */
router.get('/orden/:idOrden/producto/:idProducto', verifyToken, ordenItemController.getItemByOrdenProducto.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}/resumen:
 *   get:
 *     summary: Obtener resumen de la orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen de la orden
 */
router.get('/orden/:idOrden/resumen', verifyToken, ordenItemController.getResumenOrden.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/producto/{idProducto}:
 *   get:
 *     summary: Obtener órdenes que contienen un producto
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de órdenes con paginación
 */
router.get('/producto/:idProducto', verifyToken, ordenItemController.getOrdenesByProducto.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/estadisticas/orden/{idOrden}:
 *   get:
 *     summary: Obtener estadísticas de items de la orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas de la orden
 */
router.get('/estadisticas/orden/:idOrden', verifyToken, ordenItemController.getEstadisticasOrden.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/estadisticas/productos-mas-vendidos:
 *   get:
 *     summary: Obtener productos más vendidos
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de productos más vendidos
 */
router.get('/estadisticas/productos-mas-vendidos', verifyToken, ordenItemController.getProductosMasVendidos.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/{id}:
 *   put:
 *     summary: Actualizar item de orden
 *     tags: [Órdenes Items]
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
 *     responses:
 *       200:
 *         description: Item actualizado exitosamente
 *       404:
 *         description: Item no encontrado
 */
router.put('/:id', verifyToken, ordenItemController.updateOrdenItem.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/{id}/cantidad:
 *   put:
 *     summary: Actualizar cantidad de item
 *     tags: [Órdenes Items]
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
 *               cantidad:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 */
router.put('/:id/cantidad', verifyToken, ordenItemController.actualizarCantidad.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/{id}/precio:
 *   put:
 *     summary: Actualizar precio unitario
 *     tags: [Órdenes Items]
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
 *               precio_unitario:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Precio actualizado
 */
router.put('/:id/precio', verifyToken, ordenItemController.actualizarPrecio.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/{id}:
 *   delete:
 *     summary: Eliminar item de orden
 *     tags: [Órdenes Items]
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
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 */
router.delete('/:id', verifyToken, ordenItemController.deleteOrdenItem.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}/producto/{idProducto}:
 *   delete:
 *     summary: Eliminar item específico de una orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 */
router.delete('/orden/:idOrden/producto/:idProducto', verifyToken, ordenItemController.deleteItemEspecifico.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/orden/{idOrden}:
 *   delete:
 *     summary: Vaciar orden completa
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden vaciada exitosamente
 */
router.delete('/orden/:idOrden', verifyToken, ordenItemController.vaciarOrden.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/verificar:
 *   post:
 *     summary: Verificar si producto está en orden
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idOrden:
 *                 type: integer
 *               idProducto:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resultado de verificación
 */
router.post('/verificar/:idOrden/:idProducto', verifyToken, ordenItemController.verificarProductoEnOrden.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/calcular-subtotal:
 *   post:
 *     summary: Calcular subtotal
 *     tags: [Órdenes Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: integer
 *               precio_unitario:
 *                 type: number
 *     responses:
 *       200:
 *         description: Subtotal calculado
 */
router.post('/calcular-subtotal', ordenItemController.calcularSubtotal.bind(ordenItemController));

/**
 * @swagger
 * /api/ordenes-items/admin/recalcular-subtotales:
 *   post:
 *     summary: Recalcular todos los subtotales (Admin)
 *     tags: [Órdenes Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subtotales recalculados
 */
router.post('/admin/recalcular-subtotales', verifyToken, ordenItemController.recalcularTodosSubtotales.bind(ordenItemController));

export default router;
