import express from 'express';
import * as devolucionController from '../controllers/devolucion.controller.js';
import { verifyToken, isAdmin, hasRole } from '../middlewares/auth.middleware.js'; 

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Devolucion:
 *       type: object
 *       properties:
 *         id_devolucion:
 *           type: integer
 *         id_orden:
 *           type: integer
 *         id_cliente:
 *           type: integer
 *         numero_devolucion:
 *           type: string
 *         tipo_devolucion:
 *           type: string
 *           enum: [devolucion_total, devolucion_parcial, cambio_producto]
 *         motivo:
 *           type: string
 *           enum: [producto_danado, producto_incorrecto, no_cumple_esperanzas, talla_incorrecta, color_incorrecto, arrepentimiento, otro]
 *         estado:
 *           type: string
 *           enum: [solicitada, aprobada, rechazada, en_proceso, completada, cancelada]
 *         monto_total_devolucion:
 *           type: number
 *         fecha_solicitud:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/devoluciones:
 *   post:
 *     summary: Crear solicitud de devolución
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_orden
 *               - id_cliente
 *               - tipo_devolucion
 *               - motivo
 *             properties:
 *               id_orden:
 *                 type: integer
 *                 example: 1
 *               id_cliente:
 *                 type: integer
 *                 example: 1
 *               tipo_devolucion:
 *                 type: string
 *                 enum: [devolucion_total, devolucion_parcial, cambio_producto]
 *                 example: devolucion_parcial
 *               motivo:
 *                 type: string
 *                 enum: [producto_danado, producto_incorrecto, no_cumple_esperanzas, talla_incorrecta, color_incorrecto, arrepentimiento, otro]
 *                 example: producto_danado
 *               motivo_detalle:
 *                 type: string
 *                 example: "El producto llegó con daños en la caja"
 *               metodo_reembolso:
 *                 type: string
 *                 example: "transferencia_bancaria"
 *               notas_cliente:
 *                 type: string
 *                 example: "Necesito el reembolso lo antes posible"
 *               evidencia_imagenes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Solicitud de devolución creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Devolucion'
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', verifyToken, devolucionController.crearSolicitudDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/items:
 *   post:
 *     summary: Agregar item a devolución
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_orden_item
 *               - id_producto
 *               - cantidad_solicitada
 *               - precio_unitario
 *             properties:
 *               id_orden_item:
 *                 type: integer
 *                 example: 1
 *               id_producto:
 *                 type: integer
 *                 example: 1
 *               cantidad_solicitada:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               precio_unitario:
 *                 type: number
 *                 minimum: 0
 *                 example: 29.99
 *               motivo_item:
 *                 type: string
 *                 example: "Producto defectuoso"
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Devolución no encontrada
 */
router.post('/:id_devolucion/items', verifyToken, devolucionController.agregarItemDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}:
 *   get:
 *     summary: Obtener devolución completa con items
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Devolución obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Devolucion'
 *       404:
 *         description: Devolución no encontrada
 */
router.get('/:id_devolucion', verifyToken, devolucionController.obtenerDevolucion);

/**
 * @swagger
 * /api/devoluciones/cliente/{id_cliente}:
 *   get:
 *     summary: Listar devoluciones del cliente
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [solicitada, aprobada, rechazada, en_proceso, completada, cancelada]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de devoluciones del cliente
 */
router.get('/cliente/:id_cliente', verifyToken, devolucionController.listarDevolucionesCliente);

/**
 * @swagger
 * /api/devoluciones/orden/{id_orden}:
 *   get:
 *     summary: Listar devoluciones de una orden
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de devoluciones de la orden
 */
router.get('/orden/:id_orden', verifyToken, devolucionController.listarDevolucionesOrden);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/aprobar:
 *   patch:
 *     summary: Aprobar devolución (Solo administradores/vendedores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items_aprobados
 *             properties:
 *               items_aprobados:
 *                 type: object
 *                 description: "Objeto con { id_item: cantidad_aprobada }"
 *                 example: { "1": 2, "2": 1 }
 *               notas_internas:
 *                 type: string
 *                 example: "Productos aprobados para reembolso"
 *     responses:
 *       200:
 *         description: Devolución aprobada exitosamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Devolución no encontrada
 */
router.patch('/:id_devolucion/aprobar', verifyToken, hasRole('administrador', 'vendedor'), devolucionController.aprobarDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/rechazar:
 *   patch:
 *     summary: Rechazar devolución (Solo administradores/vendedores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razon
 *             properties:
 *               razon:
 *                 type: string
 *                 example: "Producto fuera del período de devolución"
 *     responses:
 *       200:
 *         description: Devolución rechazada exitosamente
 *       403:
 *         description: No autorizado
 */
router.patch('/:id_devolucion/rechazar', verifyToken, hasRole('administrador', 'vendedor'), devolucionController.rechazarDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/recepcion:
 *   post:
 *     summary: Registrar recepción de devolución (Solo administradores/vendedores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items_recibidos
 *               - guia_devolucion
 *             properties:
 *               items_recibidos:
 *                 type: object
 *                 description: "Objeto con { id_item: cantidad_recibida }"
 *                 example: { "1": 2, "2": 1 }
 *               guia_devolucion:
 *                 type: string
 *                 example: "GUIA123456789"
 *               transportista:
 *                 type: string
 *                 example: "FedEx"
 *               condiciones:
 *                 type: object
 *                 description: "Objeto con { id_item: condicion }"
 *                 example: { "1": "buena", "2": "danado" }
 *     responses:
 *       200:
 *         description: Recepción registrada exitosamente
 */
router.post('/:id_devolucion/recepcion', verifyToken, hasRole('administrador', 'vendedor'), devolucionController.registrarRecepcionDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/inspeccion:
 *   post:
 *     summary: Inspeccionar items de devolución (Solo administradores/vendedores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspecciones
 *             properties:
 *               inspecciones:
 *                 type: object
 *                 description: "Objeto con inspecciones por item"
 *                 example: 
 *                   "1": 
 *                     condicion: "buena"
 *                     accion: "reembolsar"
 *                     notas: "Producto en buen estado"
 *     responses:
 *       200:
 *         description: Inspección completada exitosamente
 */
router.post('/:id_devolucion/inspeccion', verifyToken, hasRole('administrador', 'vendedor'), devolucionController.inspeccionarItems);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/reembolso:
 *   post:
 *     summary: Crear reembolso para devolución (Solo administradores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto_reembolso
 *             properties:
 *               id_metodo_pago:
 *                 type: integer
 *                 example: 1
 *               monto_reembolso:
 *                 type: number
 *                 minimum: 0
 *                 example: 59.98
 *     responses:
 *       201:
 *         description: Reembolso creado exitosamente
 */
router.post('/:id_devolucion/reembolso', verifyToken, isAdmin, devolucionController.crearReembolso);

/**
 * @swagger
 * /api/devoluciones/reembolsos/{id_reembolso}/procesar:
 *   patch:
 *     summary: Procesar reembolso (Solo administradores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_reembolso
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Reembolso procesado exitosamente
 */
router.patch('/reembolsos/:id_reembolso/procesar', verifyToken, isAdmin, devolucionController.procesarReembolso);

/**
 * @swagger
 * /api/devoluciones/reembolsos/{id_reembolso}/completar:
 *   patch:
 *     summary: Completar reembolso (Solo administradores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_reembolso
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaccion_id
 *             properties:
 *               transaccion_id:
 *                 type: string
 *                 example: "TXN123456789"
 *     responses:
 *       200:
 *         description: Reembolso completado exitosamente
 */
router.patch('/reembolsos/:id_reembolso/completar', verifyToken, isAdmin, devolucionController.completarReembolso);

/**
 * @swagger
 * /api/devoluciones/orden/{id_orden}/elegibilidad:
 *   get:
 *     summary: Verificar elegibilidad de devolución para una orden
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Elegibilidad verificada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 elegible:
 *                   type: boolean
 *                 razon:
 *                   type: string
 *                 dias_restantes:
 *                   type: integer
 */
router.get('/orden/:id_orden/elegibilidad', verifyToken, devolucionController.verificarElegibilidad);

/**
 * @swagger
 * /api/devoluciones/reporte/general:
 *   get:
 *     summary: Obtener reporte de devoluciones (Solo administradores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [solicitada, aprobada, rechazada, en_proceso, completada, cancelada]
 *       - in: query
 *         name: id_cliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */
router.get('/reporte/general', verifyToken, isAdmin, devolucionController.obtenerReporte);

/**
 * @swagger
 * /api/devoluciones/pendientes/list:
 *   get:
 *     summary: Obtener devoluciones pendientes de aprobación (Solo administradores/vendedores)
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de devoluciones pendientes
 */
router.get('/pendientes/list', verifyToken, hasRole('administrador', 'vendedor'), devolucionController.obtenerPendientes);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/cancelar:
 *   patch:
 *     summary: Cancelar devolución
 *     tags: [Devoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razon
 *             properties:
 *               razon:
 *                 type: string
 *                 example: "Ya no necesito la devolución"
 *     responses:
 *       200:
 *         description: Devolución cancelada exitosamente
 */
router.patch('/:id_devolucion/cancelar', verifyToken, devolucionController.cancelarDevolucion);

export default router;