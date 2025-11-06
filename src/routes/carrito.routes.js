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
 *     CarritoProducto:
 *       type: object
 *       properties:
 *         id_carrito_producto:
 *           type: integer
 *         id_carrito:
 *           type: integer
 *         id_producto:
 *           type: integer
 *         cantidad:
 *           type: integer
 *         precio_unitario:
 *           type: number
 *           format: double
 *         producto:
 *           $ref: '#/components/schemas/Producto'
 *           description: Alias correcto para acceder al producto
 *       example:
 *         id_carrito_producto: 1
 *         id_carrito: 3
 *         id_producto: 5
 *         cantidad: 2
 *         precio_unitario: 1299.99
 *         producto:
 *           id_producto: 5
 *           nombre_producto: "Laptop Gaming Pro"
 *           precio: 1299.99
 *           categoria:
 *             id_categoria: 1
 *             nombre_categoria: "Electrónica"
 *           imagenes:
 *             - id_imagen: 1
 *               url_imagen: "https://cdn.example.com/img1.jpg"
 *               es_principal: true
 *
 *     Carrito:
 *       type: object
 *       properties:
 *         id_carrito:
 *           type: integer
 *         id_cliente:
 *           type: integer
 *         estado:
 *           type: string
 *           enum: [activo, abandonado, convertido]
 *         productosCarrito:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CarritoProducto'
 *           description: Alias correcto (NO CarritoProductos)
 *       example:
 *         id_carrito: 3
 *         id_cliente: 1
 *         estado: "activo"
 *         productosCarrito:
 *           - id_carrito_producto: 1
 *             cantidad: 2
 *             precio_unitario: 1299.99
 *             producto:
 *               id_producto: 5
 *               nombre_producto: "Laptop Gaming Pro"
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
 *         description: Carrito con todos los productos (usa alias productosCarrito)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Carrito'
 *       401:
 *         description: No autorizado
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
 *       201:
 *         description: Producto agregado al carrito exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Carrito'
 *       400:
 *         description: Error en la solicitud o stock insuficiente
 *       401:
 *         description: No autorizado
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
