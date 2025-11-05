import { Router } from 'express';
import carritoController from '../controllers/carrito.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carrito
 *   description: API para la gestión del carrito de compras
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CarritoItem:
 *       type: object
 *       properties:
 *         id_carrito_producto:
 *           type: integer
 *         id_producto:
 *           type: integer
 *         cantidad:
 *           type: integer
 *         precio_unitario:
 *           type: number
 *           format: float
 *         Producto:
 *           type: object
 *           properties:
 *             nombre_producto:
 *               type: string
 *             precio:
 *               type: number
 *       example:
 *         id_carrito_producto: 1
 *         id_producto: 5
 *         cantidad: 2
 *         precio_unitario: 249.99
 */

/**
 * @swagger
 * /api/carrito:
 *   get:
 *     summary: Obtiene el carrito del usuario autenticado
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_carrito:
 *                   type: integer
 *                 estado:
 *                   type: string
 *                 CarritoProductos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CarritoItem'
 */
router.get('/', [verifyToken], carritoController.getMyCart);

/**
 * @swagger
 * /api/carrito:
 *   post:
 *     summary: Agrega un producto al carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_producto
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 description: ID del producto a agregar
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad a agregar (default 1)
 *                 default: 1
 *     responses:
 *       200:
 *         description: Producto agregado al carrito
 *       400:
 *         description: Error en la solicitud
 */
router.post('/', [verifyToken], carritoController.addProductToCart);

/**
 * @swagger
 * /api/carrito/{id_producto}:
 *   delete:
 *     summary: Elimina un producto del carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito
 *       404:
 *         description: Producto no encontrado en el carrito
 */
router.delete('/:id_producto', [verifyToken], carritoController.removeProductFromCart);

/**
 * @swagger
 * /api/carrito/clear:
 *   delete:
 *     summary: Vacía el carrito del usuario
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *       404:
 *         description: Carrito no encontrado
 */
router.delete('/clear', [verifyToken], carritoController.clearCart);

export default router;
