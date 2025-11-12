import express from 'express';
import * as devolucionController from '../controllers/devolucion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/devoluciones:
 *   post:
 *     summary: Crear solicitud de devolución
 *     tags: [Devoluciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_orden:
 *                 type: integer
 *               id_cliente:
 *                 type: integer
 *               tipo_devolucion:
 *                 type: string
 *                 enum: [devolucion_total, devolucion_parcial, cambio_producto]
 *               motivo:
 *                 type: string
 *                 enum: [producto_danado, producto_incorrecto, no_cumple_esperanzas, talla_incorrecta, color_incorrecto, arrepentimiento, otro]
 *               motivo_detalle:
 *                 type: string
 *               metodo_reembolso:
 *                 type: string
 *               notas_cliente:
 *                 type: string
 *     responses:
 *       201:
 *         description: Solicitud de devolución creada
 */
router.post('/', verificarToken, devolucionController.crearSolicitudDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/items:
 *   post:
 *     summary: Agregar item a devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               id_orden_item:
 *                 type: integer
 *               id_producto:
 *                 type: integer
 *               cantidad_solicitada:
 *                 type: integer
 *               precio_unitario:
 *                 type: number
 *               motivo_item:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 */
router.post('/:id_devolucion/items', verificarToken, devolucionController.agregarItemDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}:
 *   get:
 *     summary: Obtener devolución completa
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Devolución obtenida
 */
router.get('/:id_devolucion', verificarToken, devolucionController.obtenerDevolucion);

/**
 * @swagger
 * /api/devoluciones/cliente/{id_cliente}:
 *   get:
 *     summary: Listar devoluciones del cliente
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de devoluciones
 */
router.get('/cliente/:id_cliente', verificarToken, devolucionController.listarDevolucionesCliente);

/**
 * @swagger
 * /api/devoluciones/orden/{id_orden}:
 *   get:
 *     summary: Listar devoluciones de una orden
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de devoluciones
 */
router.get('/orden/:id_orden', verificarToken, devolucionController.listarDevolucionesOrden);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/aprobar:
 *   patch:
 *     summary: Aprobar devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               items_aprobados:
 *                 type: object
 *               notas_internas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devolución aprobada
 */
router.patch('/:id_devolucion/aprobar', verificarToken, devolucionController.aprobarDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/rechazar:
 *   patch:
 *     summary: Rechazar devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               razon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devolución rechazada
 */
router.patch('/:id_devolucion/rechazar', verificarToken, devolucionController.rechazarDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/recepcion:
 *   post:
 *     summary: Registrar recepción de devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               items_recibidos:
 *                 type: object
 *               guia_devolucion:
 *                 type: string
 *               transportista:
 *                 type: string
 *               condiciones:
 *                 type: object
 *     responses:
 *       200:
 *         description: Recepción registrada
 */
router.post('/:id_devolucion/recepcion', verificarToken, devolucionController.registrarRecepcionDevolucion);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/inspeccion:
 *   post:
 *     summary: Inspeccionar items de devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               inspecciones:
 *                 type: object
 *     responses:
 *       200:
 *         description: Inspección completada
 */
router.post('/:id_devolucion/inspeccion', verificarToken, devolucionController.inspeccionarItems);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/reembolso:
 *   post:
 *     summary: Crear reembolso para devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               id_metodo_pago:
 *                 type: integer
 *               monto_reembolso:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reembolso creado
 */
router.post('/:id_devolucion/reembolso', verificarToken, devolucionController.crearReembolso);

/**
 * @swagger
 * /api/devoluciones/reembolsos/{id_reembolso}/procesar:
 *   patch:
 *     summary: Procesar reembolso
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_reembolso
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reembolso procesado
 */
router.patch('/reembolsos/:id_reembolso/procesar', verificarToken, devolucionController.procesarReembolso);

/**
 * @swagger
 * /api/devoluciones/reembolsos/{id_reembolso}/completar:
 *   patch:
 *     summary: Completar reembolso
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_reembolso
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
 *               transaccion_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reembolso completado
 */
router.patch('/reembolsos/:id_reembolso/completar', verificarToken, devolucionController.completarReembolso);

/**
 * @swagger
 * /api/devoluciones/orden/{id_orden}/elegibilidad:
 *   get:
 *     summary: Verificar elegibilidad de devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_orden
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Elegibilidad verificada
 */
router.get('/orden/:id_orden/elegibilidad', verificarToken, devolucionController.verificarElegibilidad);

/**
 * @swagger
 * /api/devoluciones/reporte:
 *   get:
 *     summary: Obtener reporte de devoluciones
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_cliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte de devoluciones
 */
router.get('/reporte/general', verificarToken, devolucionController.obtenerReporte);

/**
 * @swagger
 * /api/devoluciones/pendientes:
 *   get:
 *     summary: Obtener devoluciones pendientes de aprobación
 *     tags: [Devoluciones]
 *     responses:
 *       200:
 *         description: Devoluciones pendientes
 */
router.get('/pendientes/list', verificarToken, devolucionController.obtenerPendientes);

/**
 * @swagger
 * /api/devoluciones/{id_devolucion}/cancelar:
 *   patch:
 *     summary: Cancelar devolución
 *     tags: [Devoluciones]
 *     parameters:
 *       - in: path
 *         name: id_devolucion
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
 *               razon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devolución cancelada
 */
router.patch('/:id_devolucion/cancelar', verificarToken, devolucionController.cancelarDevolucion);

export default router;
