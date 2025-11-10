import { Router } from 'express';
import inventarioController from '../controllers/inventario.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/inventario:
 *   post:
 *     summary: Crear un nuevo registro de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_producto, id_almacen]
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 description: ID del producto
 *               id_almacen:
 *                 type: integer
 *                 description: ID del almacén
 *               cantidad_actual:
 *                 type: integer
 *                 default: 0
 *               cantidad_minima:
 *                 type: integer
 *               cantidad_maxima:
 *                 type: integer
 *               ubicacion_fisica:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventario creado exitosamente
 *       400:
 *         description: Error en validación
 *       409:
 *         description: Inventario ya existe
 *   get:
 *     summary: Obtener todos los registros de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_almacen
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_producto
 *         schema:
 *           type: integer
 *       - in: query
 *         name: bajo_stock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Inventarios obtenidos exitosamente
 *
 * /api/inventario/stock-bajo:
 *   get:
 *     summary: Obtener productos con stock bajo
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_almacen
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Productos con stock bajo obtenidos
 *
 * /api/inventario/{id}:
 *   get:
 *     summary: Obtener inventario por ID
 *     tags: [Inventario]
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
 *         description: Inventario obtenido
 *       404:
 *         description: Inventario no encontrado
 *   put:
 *     summary: Actualizar un inventario
 *     tags: [Inventario]
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
 *               cantidad_actual:
 *                 type: integer
 *               cantidad_minima:
 *                 type: integer
 *               cantidad_maxima:
 *                 type: integer
 *               ubicacion_fisica:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventario actualizado
 *   delete:
 *     summary: Eliminar un inventario
 *     tags: [Inventario]
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
 *         description: Inventario eliminado
 *
 * /api/inventario/{id}/ajustar:
 *   patch:
 *     summary: Ajustar cantidad de inventario (entrada/salida)
 *     tags: [Inventario]
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
 *             required: [cantidad, tipo]
 *             properties:
 *               cantidad:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida]
 *     responses:
 *       200:
 *         description: Cantidad ajustada
 *
 * /api/inventario/producto/{id_producto}/almacen/{id_almacen}:
 *   get:
 *     summary: Obtener inventario por producto y almacén
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_almacen
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventario obtenido
 */

router.post('/inventario', verifyToken, inventarioController.create);
router.get('/inventario', verifyToken, inventarioController.getAll);
router.get('/inventario/stock-bajo', verifyToken, inventarioController.getStockBajo);
router.get('/inventario/:id', verifyToken, inventarioController.getById);
router.get('/inventario/producto/:id_producto/almacen/:id_almacen', verifyToken, inventarioController.getByProductoAlmacen);
router.put('/inventario/:id', verifyToken, inventarioController.update);
router.patch('/inventario/:id/ajustar', verifyToken, inventarioController.ajustarCantidad);
router.delete('/inventario/:id', verifyToken, isAdmin, inventarioController.delete);

export default router;