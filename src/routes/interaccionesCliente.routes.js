import { Router } from 'express';
import interaccionesClienteController from '../controllers/interaccionesCliente.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Interacciones Cliente
 *   description: API para la gestión de interacciones y seguimiento de clientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InteraccionCliente:
 *       type: object
 *       required:
 *         - id_cliente
 *         - tipo_interaccion
 *       properties:
 *         id_interaccion:
 *           type: integer
 *           description: ID único de la interacción
 *           example: 1
 *         id_cliente:
 *           type: integer
 *           description: ID del cliente
 *           example: 5
 *         id_usuario_asignado:
 *           type: integer
 *           description: ID del usuario asignado para el seguimiento
 *           example: 3
 *         tipo_interaccion:
 *           type: string
 *           enum: [llamada, email, reunión, mensaje, nota]
 *           description: Tipo de interacción
 *           example: "llamada"
 *         descripcion:
 *           type: string
 *           description: Descripción detallada de la interacción
 *           example: "Cliente interesado en nuevos productos"
 *         estado:
 *           type: string
 *           enum: [pendiente, en_proceso, completado, cancelado]
 *           description: Estado actual
 *           example: "completado"
 *         resultado:
 *           type: string
 *           description: Resultado de la interacción
 *           example: "Cliente confirmó compra"
 *         proxima_accion:
 *           type: string
 *           description: Próxima acción a realizar
 *           example: "Enviar propuesta"
 *         fecha_interaccion:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la interacción
 *           example: "2025-11-10T10:30:00Z"
 *         fecha_proxima_accion:
 *           type: string
 *           format: date-time
 *           description: Fecha programada para próxima acción
 *           example: "2025-11-17T10:00:00Z"
 *
 *     EstadisticasInteracciones:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         porEstado:
 *           type: array
 *         porTipo:
 *           type: array
 *         interaccionesEsteMes:
 *           type: integer
 *
 *     EstadisticasCliente:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         ultimaInteraccion:
 *           $ref: '#/components/schemas/InteraccionCliente'
 *         porTipo:
 *           type: array
 */

/**
 * @swagger
 * /api/interacciones:
 *   post:
 *     summary: Crear nueva interacción
 *     description: Crea una nueva interacción de cliente
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_cliente
 *               - tipo_interaccion
 *               - descripcion
 *             properties:
 *               id_cliente:
 *                 type: integer
 *                 example: 5
 *               id_usuario_asignado:
 *                 type: integer
 *                 example: 3
 *               tipo_interaccion:
 *                 type: string
 *                 enum: [llamada, email, reunión, mensaje, nota]
 *                 example: "llamada"
 *               descripcion:
 *                 type: string
 *                 example: "Cliente interesado en nuevos productos"
 *               resultado:
 *                 type: string
 *               proxima_accion:
 *                 type: string
 *               fecha_interaccion:
 *                 type: string
 *                 format: date-time
 *               fecha_proxima_accion:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Interacción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InteraccionCliente'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o fecha_proxima_accion debe ser futura
 *       401:
 *         description: No autorizado
 */
router.post('/', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.createInteraccion(req, res);
});

/**
 * @swagger
 * /api/interacciones:
 *   get:
 *     summary: Obtener todas las interacciones
 *     description: Obtiene interacciones con filtros y paginación
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: id_cliente
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_usuario_asignado
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_interaccion
 *         schema:
 *           type: string
 *           enum: [llamada, email, reunión, mensaje, nota]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_proceso, completado, cancelado]
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: fecha_interaccion
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Lista de interacciones obtenida exitosamente
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
 *                     interacciones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InteraccionCliente'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.getAllInteracciones(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}:
 *   get:
 *     summary: Obtener interacción por ID
 *     description: Obtiene los detalles de una interacción específica
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Interacción obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InteraccionCliente'
 *       404:
 *         description: Interacción no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', verifyToken, (req, res) => {
  interaccionesClienteController.getInteraccionById(req, res);
});

/**
 * @swagger
 * /api/interacciones/cliente/{idCliente}:
 *   get:
 *     summary: Obtener interacciones de un cliente
 *     description: Obtiene todas las interacciones de un cliente específico
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
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
 *           default: 20
 *       - in: query
 *         name: tipo_interaccion
 *         schema:
 *           type: string
 *           enum: [llamada, email, reunión, mensaje, nota]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_proceso, completado, cancelado]
 *     responses:
 *       200:
 *         description: Interacciones obtenidas exitosamente
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
 *                     interacciones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InteraccionCliente'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/cliente/:idCliente', verifyToken, (req, res) => {
  interaccionesClienteController.getInteraccionesByCliente(req, res);
});

/**
 * @swagger
 * /api/interacciones/usuario/{idUsuario}:
 *   get:
 *     summary: Obtener interacciones de un usuario
 *     description: Obtiene todas las interacciones asignadas a un usuario
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUsuario
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
 *           default: 20
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_proceso, completado, cancelado]
 *     responses:
 *       200:
 *         description: Interacciones obtenidas exitosamente
 */
router.get('/usuario/:idUsuario', verifyToken, (req, res) => {
  interaccionesClienteController.getInteraccionesByUsuario(req, res);
});

/**
 * @swagger
 * /api/interacciones/pendientes/proximas-acciones:
 *   get:
 *     summary: Obtener próximas acciones pendientes
 *     description: Obtiene interacciones pendientes con próximas acciones programadas
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Rango de días a considerar
 *     responses:
 *       200:
 *         description: Próximas acciones obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/InteraccionCliente'
 *       401:
 *         description: No autorizado
 */
router.get('/pendientes/proximas-acciones', verifyToken, (req, res) => {
  interaccionesClienteController.getProximasAccionesPendientes(req, res);
});

/**
 * @swagger
 * /api/interacciones/vencidas/todas:
 *   get:
 *     summary: Obtener interacciones vencidas
 *     description: Obtiene interacciones pendientes con fechas de próxima acción pasadas
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Interacciones vencidas obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/InteraccionCliente'
 *       401:
 *         description: No autorizado
 */
router.get('/vencidas/todas', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.getInteraccionesVencidas(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}:
 *   put:
 *     summary: Actualizar interacción
 *     description: Actualiza los datos de una interacción
 *     tags: [Interacciones Cliente]
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
 *               descripcion:
 *                 type: string
 *               resultado:
 *                 type: string
 *               proxima_accion:
 *                 type: string
 *               fecha_proxima_accion:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Interacción actualizada exitosamente
 */
router.put('/:id', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.updateInteraccion(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de interacción
 *     description: Cambia el estado de una interacción
 *     tags: [Interacciones Cliente]
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
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, completado, cancelado]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.patch('/:id/estado', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.cambiarEstadoInteraccion(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}/completar:
 *   patch:
 *     summary: Marcar interacción como completada
 *     description: Marca una interacción como completada con resultado opcional
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resultado:
 *                 type: string
 *                 example: "Cliente confirmó compra"
 *     responses:
 *       200:
 *         description: Interacción completada exitosamente
 */
router.patch('/:id/completar', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.marcarComoCompletada(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}/asignar:
 *   patch:
 *     summary: Asignar usuario a interacción
 *     description: Asigna un usuario responsable a una interacción
 *     tags: [Interacciones Cliente]
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
 *             required:
 *               - id_usuario_asignado
 *             properties:
 *               id_usuario_asignado:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Usuario asignado exitosamente
 */
router.patch('/:id/asignar', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.asignarUsuario(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}/programar:
 *   patch:
 *     summary: Programar próxima acción
 *     description: Programa una próxima acción para una interacción
 *     tags: [Interacciones Cliente]
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
 *             required:
 *               - proxima_accion
 *               - fecha_proxima_accion
 *             properties:
 *               proxima_accion:
 *                 type: string
 *                 example: "Enviar propuesta"
 *               fecha_proxima_accion:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-17T10:00:00Z"
 *     responses:
 *       200:
 *         description: Próxima acción programada exitosamente
 */
router.patch('/:id/programar', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.programarProximaAccion(req, res);
});

/**
 * @swagger
 * /api/interacciones/{id}:
 *   delete:
 *     summary: Eliminar interacción
 *     description: Elimina una interacción específica
 *     tags: [Interacciones Cliente]
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
 *         description: Interacción eliminada exitosamente
 *       404:
 *         description: Interacción no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.deleteInteraccion(req, res);
});

/**
 * @swagger
 * /api/interacciones/cliente/{idCliente}/vaciar:
 *   delete:
 *     summary: Eliminar interacciones de cliente
 *     description: Elimina todas las interacciones de un cliente
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Interacciones eliminadas exitosamente
 */
router.delete('/cliente/:idCliente/vaciar', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.deleteInteraccionesByCliente(req, res);
});

/**
 * @swagger
 * /api/interacciones/estadisticas/generales:
 *   get:
 *     summary: Obtener estadísticas generales
 *     description: Obtiene estadísticas generales de todas las interacciones
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
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
 *                   $ref: '#/components/schemas/EstadisticasInteracciones'
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/generales', verifyToken, isAdmin, (req, res) => {
  interaccionesClienteController.getEstadisticasGenerales(req, res);
});

/**
 * @swagger
 * /api/interacciones/estadisticas/cliente/{idCliente}:
 *   get:
 *     summary: Obtener estadísticas de cliente
 *     description: Obtiene estadísticas de interacciones de un cliente específico
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
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
 *                   $ref: '#/components/schemas/EstadisticasCliente'
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/cliente/:idCliente', verifyToken, (req, res) => {
  interaccionesClienteController.getEstadisticasByCliente(req, res);
});

/**
 * @swagger
 * /api/interacciones/estadisticas/usuario/{idUsuario}:
 *   get:
 *     summary: Obtener estadísticas de usuario
 *     description: Obtiene estadísticas de interacciones asignadas a un usuario
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         required: true
 *         schema:
 *           type: integer
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
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     completadas:
 *                       type: integer
 *                     pendientes:
 *                       type: integer
 *                     tasaCompletitud:
 *                       type: string
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/usuario/:idUsuario', verifyToken, (req, res) => {
  interaccionesClienteController.getEstadisticasByUsuario(req, res);
});

/**
 * @swagger
 * /api/interacciones/timeline/cliente/{idCliente}:
 *   get:
 *     summary: Obtener timeline de cliente
 *     description: Obtiene un timeline de las últimas 50 interacciones de un cliente
 *     tags: [Interacciones Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Timeline obtenido exitosamente
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
 *                     $ref: '#/components/schemas/InteraccionCliente'
 *       401:
 *         description: No autorizado
 */
router.get('/timeline/cliente/:idCliente', verifyToken, (req, res) => {
  interaccionesClienteController.getTimelineCliente(req, res);
});

export default router;
