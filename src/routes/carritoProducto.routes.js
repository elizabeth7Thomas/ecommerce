import { Router } from 'express';
import carritoProductoController from '../controllers/carritoProducto.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carrito Productos
 *   description: API para la gestión de productos dentro del carrito de compras
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CarritoProducto:
 *       type: object
 *       required:
 *         - id_carrito
 *         - id_producto
 *         - cantidad
 *         - precio_unitario
 *       properties:
 *         id_carrito_producto:
 *           type: integer
 *           description: ID único del producto en carrito
 *           example: 1
 *         id_carrito:
 *           type: integer
 *           description: ID del carrito
 *           example: 5
 *         id_producto:
 *           type: integer
 *           description: ID del producto
 *           example: 10
 *         cantidad:
 *           type: integer
 *           description: Cantidad de productos
 *           minimum: 1
 *           example: 2
 *         precio_unitario:
 *           type: number
 *           format: double
 *           description: Precio unitario del producto
 *           minimum: 0
 *           example: 1299.99
 *         producto:
 *           type: object
 *           description: Información completa del producto
 *           properties:
 *             id_producto:
 *               type: integer
 *             nombre_producto:
 *               type: string
 *             precio:
 *               type: number
 *             categoria:
 *               type: object
 *               properties:
 *                 id_categoria:
 *                   type: integer
 *                 nombre_categoria:
 *                   type: string
 *
 *     ResumenCarrito:
 *       type: object
 *       properties:
 *         totalProductos:
 *           type: integer
 *           description: Total de productos únicos
 *         totalCantidad:
 *           type: integer
 *           description: Total de unidades
 *         subtotal:
 *           type: number
 *           format: double
 *         iva:
 *           type: number
 *           format: double
 *         total:
 *           type: number
 *           format: double
 *         productos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CarritoProducto'
 *
 *     EstadisticasCarrito:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: integer
 *         totalCantidad:
 *           type: integer
 *         montoTotal:
 *           type: number
 *         promedioPorProducto:
 *           type: number
 *         productoMasCaro:
 *           type: object
 *         productoMasBarato:
 *           type: object
 *
 *   responses:
 *     ProductoAgregado:
 *       description: Producto agregado exitosamente
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               data:
 *                 $ref: '#/components/schemas/CarritoProducto'
 *               message:
 *                 type: string
 *
 *     ProductoNoEncontrado:
 *       description: Producto no encontrado en el carrito
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * /api/carrito-productos:
 *   post:
 *     summary: Agregar producto al carrito
 *     description: Agrega un nuevo producto al carrito de compras. Si el producto ya existe, incrementa la cantidad.
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_carrito
 *               - id_producto
 *               - cantidad
 *               - precio_unitario
 *             properties:
 *               id_carrito:
 *                 type: integer
 *                 example: 5
 *               id_producto:
 *                 type: integer
 *                 example: 10
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               precio_unitario:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 example: 1299.99
 *     responses:
 *       201:
 *         description: Producto agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ProductoAgregado'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', verifyToken, (req, res) => {
  carritoProductoController.agregarProducto(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{id}:
 *   get:
 *     summary: Obtener producto del carrito por ID
 *     description: Obtiene los detalles de un producto específico en el carrito
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *         example: 1
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CarritoProducto'
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', verifyToken, (req, res) => {
  carritoProductoController.getProductoCarritoById(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/carrito/{idCarrito}:
 *   get:
 *     summary: Obtener todos los productos de un carrito
 *     description: Obtiene la lista completa de productos en un carrito específico
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/CarritoProducto'
 *       404:
 *         description: Carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/carrito/:idCarrito', verifyToken, (req, res) => {
  carritoProductoController.getProductosByCarrito(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/carrito/{idCarrito}/producto/{idProducto}:
 *   get:
 *     summary: Obtener producto específico en carrito
 *     description: Obtiene los detalles de un producto específico dentro de un carrito
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *         example: 10
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CarritoProducto'
 *       404:
 *         description: Producto o carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/carrito/:idCarrito/producto/:idProducto', verifyToken, (req, res) => {
  carritoProductoController.getProductoEnCarrito(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{idCarrito}/resumen:
 *   get:
 *     summary: Obtener resumen del carrito
 *     description: Obtiene un resumen completo del carrito con totales, subtotal e IVA
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *     responses:
 *       200:
 *         description: Resumen del carrito obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResumenCarrito'
 *       404:
 *         description: Carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:idCarrito/resumen', verifyToken, (req, res) => {
  carritoProductoController.getResumenCarrito(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{id}:
 *   put:
 *     summary: Actualizar producto en carrito
 *     description: Actualiza los datos de un producto en el carrito (cantidad y/o precio)
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               precio_unitario:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 example: 1500.00
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CarritoProducto'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id', verifyToken, (req, res) => {
  carritoProductoController.updateCarritoProducto(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{id}/cantidad:
 *   patch:
 *     summary: Actualizar cantidad de producto
 *     description: Actualiza solo la cantidad de un producto en el carrito
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cantidad actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CarritoProducto'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/cantidad', verifyToken, (req, res) => {
  carritoProductoController.actualizarCantidad(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{id}/precio:
 *   patch:
 *     summary: Actualizar precio unitario
 *     description: Actualiza solo el precio unitario de un producto en el carrito
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - precio_unitario
 *             properties:
 *               precio_unitario:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 example: 1500.00
 *     responses:
 *       200:
 *         description: Precio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CarritoProducto'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/precio', verifyToken, (req, res) => {
  carritoProductoController.actualizarPrecio(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{id}:
 *   delete:
 *     summary: Eliminar producto del carrito
 *     description: Elimina un producto específico del carrito por su ID
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *         example: 1
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', verifyToken, (req, res) => {
  carritoProductoController.eliminarProducto(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{idCarrito}/producto/{idProducto}:
 *   delete:
 *     summary: Eliminar producto específico
 *     description: Elimina un producto específico de un carrito usando tanto el ID del carrito como el del producto
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *         example: 10
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Producto o carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:idCarrito/producto/:idProducto', verifyToken, (req, res) => {
  carritoProductoController.eliminarProductoEspecifico(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{idCarrito}/vaciar:
 *   delete:
 *     summary: Vaciar carrito completo
 *     description: Elimina todos los productos de un carrito específico
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:idCarrito/vaciar', verifyToken, (req, res) => {
  carritoProductoController.vaciarCarrito(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{idCarrito}/verificar/{idProducto}:
 *   get:
 *     summary: Verificar si producto está en carrito
 *     description: Verifica si un producto específico está presente en un carrito
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *         example: 10
 *     responses:
 *       200:
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     existe:
 *                       type: boolean
 *       401:
 *         description: No autorizado
 */
router.get('/:idCarrito/verificar/:idProducto', verifyToken, (req, res) => {
  carritoProductoController.verificarProductoEnCarrito(req, res);
});

/**
 * @swagger
 * /api/carrito-productos/{idCarrito}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas del carrito
 *     description: Obtiene estadísticas detalladas del carrito incluyendo totales, promedios y productos más/menos caros
 *     tags: [Carrito Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCarrito
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *         example: 5
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EstadisticasCarrito'
 *       404:
 *         description: Carrito no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:idCarrito/estadisticas', verifyToken, (req, res) => {
  carritoProductoController.getEstadisticasCarrito(req, res);
});

export default router;
