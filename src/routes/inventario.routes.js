import express from 'express';
import InventarioController from '../controllers/inventario.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/inventario:
 *   post:
 *     summary: Crear nuevo registro de inventario
 *     description: Crea un nuevo registro de inventario para un producto en un almacén
 *     tags: [Inventario]
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
 *               - id_almacen
 *               - cantidad_actual
 *               - cantidad_minima
 *               - cantidad_maxima
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 example: 1
 *               id_almacen:
 *                 type: integer
 *                 example: 1
 *               cantidad_actual:
 *                 type: integer
 *                 example: 50
 *               cantidad_minima:
 *                 type: integer
 *                 example: 10
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 200
 *     responses:
 *       201:
 *         description: Registro de inventario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_inventario:
 *                   type: integer
 *                 id_producto:
 *                   type: integer
 *                 id_almacen:
 *                   type: integer
 *                 cantidad_actual:
 *                   type: integer
 *                 cantidad_minima:
 *                   type: integer
 *                 cantidad_maxima:
 *                   type: integer
 *       400:
 *         description: Error en validación de datos
 *       401:
 *         description: No autorizado
 */
router.post('/', verifyToken, InventarioController.createInventario);

/**
 * @swagger
 * /api/inventario:
 *   get:
 *     summary: Obtener todos los registros de inventario
 *     description: Obtiene una lista paginada de todos los registros de inventario con filtros opcionales
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Registros por página
 *       - in: query
 *         name: id_producto
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de producto
 *       - in: query
 *         name: id_almacen
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de almacén
 *       - in: query
 *         name: stock_bajo
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Mostrar solo productos con stock bajo
 *       - in: query
 *         name: stock_excedido
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Mostrar solo productos con stock excedido
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: fecha_actualizacion
 *         description: Campo por el que ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de inventario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventario:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 pagina:
 *                   type: integer
 *                 totalPaginas:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/', verifyToken, InventarioController.getAllInventario);

/**
 * @swagger
 * /api/inventario/{idInventario}:
 *   get:
 *     summary: Obtener registro de inventario por ID
 *     description: Obtiene los detalles de un registro de inventario específico
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de inventario
 *     responses:
 *       200:
 *         description: Registro de inventario obtenido exitosamente
 *       404:
 *         description: Registro de inventario no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:idInventario', verifyToken, InventarioController.getInventarioById);

/**
 * @swagger
 * /api/inventario/producto/{idProducto}/almacen/{idAlmacen}:
 *   get:
 *     summary: Obtener inventario por producto y almacén
 *     description: Obtiene el registro de inventario para un producto específico en un almacén
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *       - in: path
 *         name: idAlmacen
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del almacén
 *     responses:
 *       200:
 *         description: Registro obtenido exitosamente
 *       404:
 *         description: Registro no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/producto/:idProducto/almacen/:idAlmacen', verifyToken, InventarioController.getInventarioByProductoAlmacen);

/**
 * @swagger
 * /api/inventario/producto/{idProducto}:
 *   get:
 *     summary: Obtener inventario por producto
 *     description: Obtiene todos los registros de inventario para un producto en todos los almacenes
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Lista de registros obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/producto/:idProducto', verifyToken, InventarioController.getInventarioByProducto);

/**
 * @swagger
 * /api/inventario/almacen/{idAlmacen}:
 *   get:
 *     summary: Obtener inventario por almacén
 *     description: Obtiene todos los registros de inventario de un almacén específico
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAlmacen
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del almacén
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
 *       - in: query
 *         name: stock_bajo
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Lista de inventario del almacén obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/almacen/:idAlmacen', verifyToken, InventarioController.getInventarioByAlmacen);

/**
 * @swagger
 * /api/inventario/stock-total/{idProducto}:
 *   get:
 *     summary: Obtener stock total de un producto
 *     description: Obtiene la suma total de stock de un producto en todos los almacenes
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Stock total obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_producto:
 *                   type: integer
 *                 stock_total:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/stock-total/:idProducto', verifyToken, InventarioController.getStockTotalByProducto);

/**
 * @swagger
 * /api/inventario/{idInventario}:
 *   patch:
 *     summary: Actualizar registro de inventario
 *     description: Actualiza los datos de un registro de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
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
 *     responses:
 *       200:
 *         description: Registro actualizado exitosamente
 *       400:
 *         description: Error en validación
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario', verifyToken, InventarioController.updateInventario);

/**
 * @swagger
 * /api/inventario/{idInventario}/cantidad:
 *   patch:
 *     summary: Actualizar cantidad actual
 *     description: Establece la cantidad actual de un registro de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad_actual
 *             properties:
 *               cantidad_actual:
 *                 type: integer
 *                 example: 75
 *     responses:
 *       200:
 *         description: Cantidad actualizada exitosamente
 *       400:
 *         description: Error en validación
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario/cantidad', verifyToken, InventarioController.actualizarCantidad);

/**
 * @swagger
 * /api/inventario/{idInventario}/ajustar:
 *   patch:
 *     summary: Ajustar cantidad (sumar/restar)
 *     description: Ajusta la cantidad actual sumando o restando una cantidad
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad_ajuste
 *             properties:
 *               cantidad_ajuste:
 *                 type: integer
 *                 example: -5
 *                 description: Positivo para sumar, negativo para restar
 *     responses:
 *       200:
 *         description: Cantidad ajustada exitosamente
 *       400:
 *         description: Error en validación
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario/ajustar', verifyToken, InventarioController.ajustarCantidad);

/**
 * @swagger
 * /api/inventario/{idInventario}/incrementar:
 *   patch:
 *     summary: Incrementar cantidad
 *     description: Aumenta la cantidad actual de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
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
 *                 example: 10
 *     responses:
 *       200:
 *         description: Cantidad incrementada exitosamente
 *       400:
 *         description: Error en validación
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario/incrementar', verifyToken, InventarioController.incrementarCantidad);

/**
 * @swagger
 * /api/inventario/{idInventario}/decrementar:
 *   patch:
 *     summary: Decrementar cantidad
 *     description: Disminuye la cantidad actual de inventario
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
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
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cantidad decrementada exitosamente
 *       400:
 *         description: Error en validación o stock insuficiente
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario/decrementar', verifyToken, InventarioController.decrementarCantidad);

/**
 * @swagger
 * /api/inventario/{idInventario}/niveles:
 *   patch:
 *     summary: Actualizar niveles de stock
 *     description: Actualiza los niveles mínimo y máximo de stock
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad_minima
 *               - cantidad_maxima
 *             properties:
 *               cantidad_minima:
 *                 type: integer
 *                 example: 15
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 250
 *     responses:
 *       200:
 *         description: Niveles actualizados exitosamente
 *       400:
 *         description: Error en validación
 *       401:
 *         description: No autorizado
 */
router.patch('/:idInventario/niveles', verifyToken, InventarioController.actualizarNivelesStock);

/**
 * @swagger
 * /api/inventario/{idInventario}:
 *   delete:
 *     summary: Eliminar registro de inventario
 *     description: Elimina un registro de inventario por ID
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idInventario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Registro eliminado exitosamente
 *       404:
 *         description: Registro no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:idInventario', verifyToken, InventarioController.deleteInventario);

/**
 * @swagger
 * /api/inventario/producto/{idProducto}/almacen/{idAlmacen}:
 *   delete:
 *     summary: Eliminar inventario por producto y almacén
 *     description: Elimina el registro de inventario para un producto en un almacén específico
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idAlmacen
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Registro eliminado exitosamente
 *       404:
 *         description: Registro no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/producto/:idProducto/almacen/:idAlmacen', verifyToken, InventarioController.deleteInventarioByProductoAlmacen);

/**
 * @swagger
 * /api/inventario/estadisticas/stock-bajo:
 *   get:
 *     summary: Obtener productos con stock bajo
 *     description: Obtiene lista de productos con stock por debajo del nivel mínimo
 *     tags: [Inventario - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos con stock bajo obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/stock-bajo', verifyToken, InventarioController.getProductosStockBajo);

/**
 * @swagger
 * /api/inventario/estadisticas/stock-excedido:
 *   get:
 *     summary: Obtener productos con stock excedido
 *     description: Obtiene lista de productos con stock por encima del nivel máximo
 *     tags: [Inventario - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos con stock excedido obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/stock-excedido', verifyToken, InventarioController.getProductosStockExcedido);

/**
 * @swagger
 * /api/inventario/estadisticas/resumen:
 *   get:
 *     summary: Obtener resumen de inventario
 *     description: Obtiene un resumen general del estado del inventario
 *     tags: [Inventario - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRegistros:
 *                   type: integer
 *                 productosStockBajo:
 *                   type: integer
 *                 productosStockExcedido:
 *                   type: integer
 *                 totalUnidades:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/resumen', verifyToken, InventarioController.getResumenInventario);

/**
 * @swagger
 * /api/inventario/validar/stock/{idProducto}/{idAlmacen}/{cantidad}:
 *   get:
 *     summary: Verificar stock suficiente
 *     description: Verifica si hay suficiente stock de un producto en un almacén
 *     tags: [Inventario - Validación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idProducto
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idAlmacen
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: cantidad
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suficiente:
 *                   type: boolean
 *                 cantidad_actual:
 *                   type: integer
 *                 cantidad_requerida:
 *                   type: integer
 *                 diferencia:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/validar/stock/:idProducto/:idAlmacen/:cantidad', verifyToken, InventarioController.verificarStockSuficiente);

/**
 * @swagger
 * /api/inventario/transferencia:
 *   post:
 *     summary: Transferir stock entre almacenes
 *     description: Transfiere stock de un producto de un almacén a otro
 *     tags: [Inventario - Transferencia]
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
 *               - id_almacen_origen
 *               - id_almacen_destino
 *               - cantidad
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 example: 5
 *               id_almacen_origen:
 *                 type: integer
 *                 example: 1
 *               id_almacen_destino:
 *                 type: integer
 *                 example: 2
 *               cantidad:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Transferencia completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id_producto:
 *                   type: integer
 *                 id_almacen_origen:
 *                   type: integer
 *                 id_almacen_destino:
 *                   type: integer
 *                 cantidad:
 *                   type: integer
 *       400:
 *         description: Error en validación o stock insuficiente
 *       401:
 *         description: No autorizado
 */
router.post('/transferencia', verifyToken, InventarioController.transferirStock);

export default router;
