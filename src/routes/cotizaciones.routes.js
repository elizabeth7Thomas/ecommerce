import express from 'express';
import * as cotizacionController from '../controllers/cotizacion.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/cotizaciones:
 *   post:
 *     summary: Crear nueva cotización
 *     tags: [Cotizaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_cliente:
 *                 type: integer
 *               fecha_expiracion:
 *                 type: string
 *                 format: date
 *               notas:
 *                 type: string
 *               terminos_condiciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cotización creada exitosamente
 */
router.post('/', verificarToken, cotizacionController.crearCotizacion);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}/items:
 *   post:
 *     summary: Agregar item a cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
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
 *               id_producto:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               precio_unitario:
 *                 type: number
 *               descuento_porcentaje:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item agregado exitosamente
 */
router.post('/:id_cotizacion/items', verificarToken, cotizacionController.agregarItem);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}:
 *   get:
 *     summary: Obtener cotización completa
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cotización obtenida
 */
router.get('/:id_cotizacion', verificarToken, cotizacionController.obtenerCotizacion);

/**
 * @swagger
 * /api/cotizaciones/cliente/{id_cliente}:
 *   get:
 *     summary: Listar cotizaciones de un cliente
 *     tags: [Cotizaciones]
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
 *           enum: [borrador, enviada, aceptada, rechazada, expirada]
 *     responses:
 *       200:
 *         description: Lista de cotizaciones
 */
router.get('/cliente/:id_cliente', verificarToken, cotizacionController.listarCotizacionesCliente);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}:
 *   put:
 *     summary: Actualizar cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
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
 *               fecha_expiracion:
 *                 type: string
 *                 format: date
 *               notas:
 *                 type: string
 *               terminos_condiciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cotización actualizada
 */
router.put('/:id_cotizacion', verificarToken, cotizacionController.actualizarCotizacion);

/**
 * @swagger
 * /api/cotizaciones/items/{id_cotizacion_item}:
 *   delete:
 *     summary: Eliminar item de cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion_item
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item eliminado
 */
router.delete('/items/:id_cotizacion_item', verificarToken, cotizacionController.eliminarItem);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}/enviar:
 *   patch:
 *     summary: Enviar cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cotización enviada
 */
router.patch('/:id_cotizacion/enviar', verificarToken, cotizacionController.enviarCotizacion);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}/aceptar:
 *   patch:
 *     summary: Aceptar cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cotización aceptada
 */
router.patch('/:id_cotizacion/aceptar', verificarToken, cotizacionController.aceptarCotizacion);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}/rechazar:
 *   patch:
 *     summary: Rechazar cotización
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cotización rechazada
 */
router.patch('/:id_cotizacion/rechazar', verificarToken, cotizacionController.rechazarCotizacion);

/**
 * @swagger
 * /api/cotizaciones/{id_cotizacion}/convertir-orden:
 *   post:
 *     summary: Convertir cotización a orden
 *     tags: [Cotizaciones]
 *     parameters:
 *       - in: path
 *         name: id_cotizacion
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
 *               id_orden:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cotización convertida a orden
 */
router.post('/:id_cotizacion/convertir-orden', verificarToken, cotizacionController.convertirAOrden);

/**
 * @swagger
 * /api/cotizaciones/reporte:
 *   get:
 *     summary: Obtener reporte de cotizaciones
 *     tags: [Cotizaciones]
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
 *         description: Reporte de cotizaciones
 */
router.get('/reporte/general', verificarToken, cotizacionController.obtenerReporte);

export default router;
