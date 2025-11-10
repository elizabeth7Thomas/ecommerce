import { Router } from 'express';
import campanaClientesController from '../controllers/campanaClientes.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Campañas Clientes
 *   description: API para la gestión de asignaciones de clientes a campañas de marketing
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CampanaCliente:
 *       type: object
 *       required:
 *         - id_campana
 *         - id_cliente
 *       properties:
 *         id_campana:
 *           type: integer
 *           description: ID de la campaña
 *           example: 1
 *         id_cliente:
 *           type: integer
 *           description: ID del cliente
 *           example: 5
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *           description: Fecha cuando se envió la campaña
 *           example: "2025-11-10T10:30:00Z"
 *         estado_envio:
 *           type: string
 *           enum: [pendiente, enviado, abierto, respondido, fallido]
 *           description: Estado actual del envío
 *           example: "enviado"
 *         fecha_apertura:
 *           type: string
 *           format: date-time
 *           description: Fecha cuando se abrió la campaña
 *           example: "2025-11-10T11:15:00Z"
 *         fecha_respuesta:
 *           type: string
 *           format: date-time
 *           description: Fecha cuando respondió el cliente
 *           example: "2025-11-10T12:00:00Z"
 *         notas:
 *           type: string
 *           description: Notas adicionales sobre la asignación
 *           example: "Cliente interesado en el producto"
 *
 *     EstadisticasCampana:
 *       type: object
 *       properties:
 *         totalClientes:
 *           type: integer
 *           description: Total de clientes asignados
 *           example: 150
 *         porEstado:
 *           type: array
 *           description: Desglose por estado
 *           items:
 *             type: object
 *             properties:
 *               estado_envio:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *         tasaApertura:
 *           type: number
 *           format: double
 *           description: Porcentaje de tasa de apertura
 *           example: 45.33
 *         tasaRespuesta:
 *           type: number
 *           format: double
 *           description: Porcentaje de tasa de respuesta
 *           example: 23.50
 *         pendientes:
 *           type: integer
 *         enviados:
 *           type: integer
 *         abiertos:
 *           type: integer
 *         respondidos:
 *           type: integer
 *         fallidos:
 *           type: integer
 *
 *     ResumenAsignacion:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         asignaciones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CampanaCliente'
 *         totalAsignados:
 *           type: integer
 */

/**
 * @swagger
 * /api/campanas-clientes:
 *   post:
 *     summary: Asignar cliente a campaña
 *     description: Asigna un cliente individual a una campaña de marketing
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_campana
 *               - id_cliente
 *             properties:
 *               id_campana:
 *                 type: integer
 *                 example: 1
 *               id_cliente:
 *                 type: integer
 *                 example: 5
 *               estado_envio:
 *                 type: string
 *                 enum: [pendiente, enviado, abierto, respondido, fallido]
 *                 default: pendiente
 *               notas:
 *                 type: string
 *                 example: "Cliente potencial de primer contacto"
 *     responses:
 *       201:
 *         description: Cliente asignado a campaña exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CampanaCliente'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o cliente ya asignado a esta campaña
 *       401:
 *         description: No autorizado
 */
router.post('/', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.asignarClienteACampana(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/multiples/{idCampana}:
 *   post:
 *     summary: Asignar múltiples clientes a campaña
 *     description: Asigna varios clientes a una campaña en una sola operación
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientesIds
 *             properties:
 *               clientesIds:
 *                 type: array
 *                 description: Array de IDs de clientes a asignar
 *                 items:
 *                   type: integer
 *                 example: [5, 10, 15, 20]
 *     responses:
 *       201:
 *         description: Clientes asignados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResumenAsignacion'
 *                 message:
 *                   type: string
 *       400:
 *         description: Array de clientesIds inválido
 *       401:
 *         description: No autorizado
 */
router.post('/multiples/:idCampana', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.asignarMultiplesClientes(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}:
 *   get:
 *     summary: Obtener asignación específica
 *     description: Obtiene los detalles de una asignación específica campaña-cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *         example: 1
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *         example: 5
 *     responses:
 *       200:
 *         description: Asignación obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CampanaCliente'
 *       404:
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:idCampana/:idCliente', verifyToken, (req, res) => {
  campanaClientesController.getAsignacion(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/campaña/{idCampana}:
 *   get:
 *     summary: Obtener clientes de una campaña
 *     description: Obtiene todos los clientes asignados a una campaña con opciones de filtrado y paginación
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *         example: 1
 *       - in: query
 *         name: estado_envio
 *         schema:
 *           type: string
 *           enum: [pendiente, enviado, abierto, respondido, fallido]
 *         description: Filtrar por estado de envío
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
 *         description: Cantidad de registros por página
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida exitosamente
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
 *                     clientes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampanaCliente'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       404:
 *         description: Campaña no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/campaña/:idCampana', verifyToken, (req, res) => {
  campanaClientesController.getClientesByCampana(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/cliente/{idCliente}:
 *   get:
 *     summary: Obtener campañas de un cliente
 *     description: Obtiene todas las campañas asignadas a un cliente específico
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *         example: 5
 *       - in: query
 *         name: estado_envio
 *         schema:
 *           type: string
 *           enum: [pendiente, enviado, abierto, respondido, fallido]
 *         description: Filtrar por estado de envío
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
 *         description: Lista de campañas obtenida exitosamente
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
 *                     campanas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampanaCliente'
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
  campanaClientesController.getCampanasByCliente(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/estado:
 *   patch:
 *     summary: Actualizar estado de envío
 *     description: Actualiza el estado de envío de una asignación campaña-cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado_envio
 *             properties:
 *               estado_envio:
 *                 type: string
 *                 enum: [pendiente, enviado, abierto, respondido, fallido]
 *                 example: "abierto"
 *     responses:
 *       200:
 *         description: Estado de envío actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CampanaCliente'
 *                 message:
 *                   type: string
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.patch('/:idCampana/:idCliente/estado', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.actualizarEstadoEnvio(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/enviado:
 *   patch:
 *     summary: Marcar como enviado
 *     description: Marca una campaña como enviada para un cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marcado como enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CampanaCliente'
 *       404:
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.patch('/:idCampana/:idCliente/enviado', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.marcarComoEnviado(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/abierto:
 *   patch:
 *     summary: Marcar como abierto
 *     description: Marca una campaña como abierta para un cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marcado como abierto exitosamente
 */
router.patch('/:idCampana/:idCliente/abierto', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.marcarComoAbierto(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/respondido:
 *   patch:
 *     summary: Marcar como respondido
 *     description: Marca una campaña como respondida por un cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marcado como respondido exitosamente
 */
router.patch('/:idCampana/:idCliente/respondido', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.marcarComoRespondido(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/fallido:
 *   patch:
 *     summary: Marcar como fallido
 *     description: Marca una campaña como fallida para un cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marcado como fallido exitosamente
 */
router.patch('/:idCampana/:idCliente/fallido', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.marcarComoFallido(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/notas:
 *   patch:
 *     summary: Actualizar notas
 *     description: Actualiza las notas de una asignación campaña-cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
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
 *               - notas
 *             properties:
 *               notas:
 *                 type: string
 *                 example: "Cliente mostró interés en productos similares"
 *     responses:
 *       200:
 *         description: Notas actualizadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CampanaCliente'
 *                 message:
 *                   type: string
 */
router.patch('/:idCampana/:idCliente/notas', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.actualizarNotas(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}:
 *   put:
 *     summary: Actualizar asignación completa
 *     description: Actualiza todos los campos de una asignación
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
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
 *               estado_envio:
 *                 type: string
 *                 enum: [pendiente, enviado, abierto, respondido, fallido]
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asignación actualizada exitosamente
 */
router.put('/:idCampana/:idCliente', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.updateAsignacion(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}:
 *   delete:
 *     summary: Eliminar asignación
 *     description: Elimina una asignación específica campaña-cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asignación eliminada exitosamente
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
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:idCampana/:idCliente', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.eliminarAsignacion(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/campaña/{idCampana}/vaciar:
 *   delete:
 *     summary: Eliminar clientes de campaña
 *     description: Elimina todos los clientes de una campaña
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Clientes eliminados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEliminadas:
 *                       type: integer
 */
router.delete('/campaña/:idCampana/vaciar', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.eliminarClientesDeCampana(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/cliente/{idCliente}/vaciar:
 *   delete:
 *     summary: Eliminar campañas de cliente
 *     description: Elimina todas las campañas de un cliente
 *     tags: [Campañas Clientes]
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
 *         description: Campañas eliminadas exitosamente
 */
router.delete('/cliente/:idCliente/vaciar', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.eliminarCampanasDeCliente(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de campaña
 *     description: Obtiene estadísticas detalladas de una campaña incluyendo tasas de apertura y respuesta
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *         example: 1
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
 *                   $ref: '#/components/schemas/EstadisticasCampana'
 *       404:
 *         description: Campaña no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:idCampana/estadisticas', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.getEstadisticasCampana(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/pendientes:
 *   get:
 *     summary: Obtener clientes pendientes
 *     description: Obtiene los clientes que aún no han recibido la campaña
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de clientes pendientes obtenida exitosamente
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
 *                     $ref: '#/components/schemas/CampanaCliente'
 *       401:
 *         description: No autorizado
 */
router.get('/:idCampana/pendientes', verifyToken, isAdmin, (req, res) => {
  campanaClientesController.getClientesPendientes(req, res);
});

/**
 * @swagger
 * /api/campanas-clientes/{idCampana}/{idCliente}/verificar:
 *   get:
 *     summary: Verificar asignación
 *     description: Verifica si existe una asignación entre una campaña y cliente
 *     tags: [Campañas Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCampana
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idCliente
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     existe:
 *                       type: boolean
 */
router.get('/:idCampana/:idCliente/verificar', verifyToken, (req, res) => {
  campanaClientesController.verificarAsignacion(req, res);
});

export default router;
