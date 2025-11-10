import express from 'express';
import OportunidadesController from '../controllers/oportunidades.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Oportunidades Venta
 *   description: API para la gestión de oportunidades de venta (CRM)
 */

/**
 * @swagger
 * /api/oportunidades:
 *   post:
 *     summary: Crear nueva oportunidad de venta
 *     tags: [Oportunidades Venta]
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
 *               - titulo
 *             properties:
 *               id_cliente:
 *                 type: integer
 *               id_usuario_asignado:
 *                 type: integer
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               valor_estimado:
 *                 type: number
 *               probabilidad_cierre:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               etapa:
 *                 type: string
 *                 enum: [prospecto, calificado, negociación, propuesta, cierre]
 *               fecha_cierre_estimada:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Oportunidad creada exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.post('/', [verifyToken], OportunidadesController.createOportunidad);

/**
 * @swagger
 * /api/oportunidades:
 *   get:
 *     summary: Obtener todas las oportunidades
 *     tags: [Oportunidades Venta]
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
 *         name: etapa
 *         schema:
 *           type: string
 *           enum: [prospecto, calificado, negociación, propuesta, cierre]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, pausado, completado, archivado]
 *     responses:
 *       200:
 *         description: Lista de oportunidades
 *       401:
 *         description: No autorizado
 */
router.get('/', [verifyToken], OportunidadesController.getAllOportunidades);

/**
 * @swagger
 * /api/oportunidades/{id}:
 *   get:
 *     summary: Obtener oportunidad por ID
 *     tags: [Oportunidades Venta]
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
 *         description: Oportunidad obtenida
 *       404:
 *         description: Oportunidad no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', [verifyToken], OportunidadesController.getOportunidadById);

/**
 * @swagger
 * /api/oportunidades/cliente/{idCliente}:
 *   get:
 *     summary: Obtener oportunidades por cliente
 *     tags: [Oportunidades Venta]
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
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: etapa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oportunidades del cliente
 *       401:
 *         description: No autorizado
 */
router.get('/cliente/:idCliente', [verifyToken], OportunidadesController.getOportunidadesByCliente);

/**
 * @swagger
 * /api/oportunidades/usuario/{idUsuario}:
 *   get:
 *     summary: Obtener oportunidades por usuario asignado
 *     tags: [Oportunidades Venta]
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
 *       - in: query
 *         name: etapa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oportunidades del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/usuario/:idUsuario', [verifyToken], OportunidadesController.getOportunidadesByUsuario);

/**
 * @swagger
 * /api/oportunidades/estado/{estado}:
 *   get:
 *     summary: Obtener oportunidades por estado
 *     tags: [Oportunidades Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estado
 *         required: true
 *         schema:
 *           type: string
 *           enum: [activo, pausado, completado, archivado]
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
 *         name: etapa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oportunidades por estado
 *       401:
 *         description: No autorizado
 */
router.get('/estado/:estado', [verifyToken], OportunidadesController.getOportunidadesByEstado);

/**
 * @swagger
 * /api/oportunidades/etapa/{etapa}:
 *   get:
 *     summary: Obtener oportunidades por etapa
 *     tags: [Oportunidades Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: etapa
 *         required: true
 *         schema:
 *           type: string
 *           enum: [prospecto, calificado, negociación, propuesta, cierre]
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
 *     responses:
 *       200:
 *         description: Oportunidades por etapa
 *       401:
 *         description: No autorizado
 */
router.get('/etapa/:etapa', [verifyToken], OportunidadesController.getOportunidadesByEtapa);

/**
 * @swagger
 * /api/oportunidades/{id}:
 *   put:
 *     summary: Actualizar oportunidad
 *     tags: [Oportunidades Venta]
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
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               valor_estimado:
 *                 type: number
 *               probabilidad_cierre:
 *                 type: integer
 *               etapa:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Oportunidad actualizada
 *       404:
 *         description: Oportunidad no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', [verifyToken], OportunidadesController.updateOportunidad);

/**
 * @swagger
 * /api/oportunidades/{id}/etapa:
 *   patch:
 *     summary: Cambiar etapa de oportunidad
 *     tags: [Oportunidades Venta]
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
 *               - etapa
 *             properties:
 *               etapa:
 *                 type: string
 *                 enum: [prospecto, calificado, negociación, propuesta, cierre]
 *     responses:
 *       200:
 *         description: Etapa actualizada
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/etapa', [verifyToken], OportunidadesController.cambiarEtapa);

/**
 * @swagger
 * /api/oportunidades/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de oportunidad
 *     tags: [Oportunidades Venta]
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
 *                 enum: [activo, pausado, completado, archivado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/estado', [verifyToken], OportunidadesController.cambiarEstado);

/**
 * @swagger
 * /api/oportunidades/{id}/ganada:
 *   patch:
 *     summary: Marcar oportunidad como ganada
 *     tags: [Oportunidades Venta]
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
 *               fecha_cierre:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Oportunidad marcada como ganada
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/ganada', [verifyToken], OportunidadesController.marcarComoGanada);

/**
 * @swagger
 * /api/oportunidades/{id}/perdida:
 *   patch:
 *     summary: Marcar oportunidad como perdida
 *     tags: [Oportunidades Venta]
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
 *               - motivo_perdida
 *             properties:
 *               motivo_perdida:
 *                 type: string
 *               fecha_cierre:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Oportunidad marcada como perdida
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/perdida', [verifyToken], OportunidadesController.marcarComoPerdida);

/**
 * @swagger
 * /api/oportunidades/{id}:
 *   delete:
 *     summary: Eliminar oportunidad
 *     tags: [Oportunidades Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Oportunidad eliminada
 *       404:
 *         description: Oportunidad no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', [verifyToken, isAdmin], OportunidadesController.deleteOportunidad);

/**
 * @swagger
 * /api/oportunidades/estadisticas/pipeline:
 *   get:
 *     summary: Obtener pipeline de ventas
 *     tags: [Oportunidades Venta - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_usuario_asignado
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           default: activo
 *     responses:
 *       200:
 *         description: Pipeline de ventas con estadísticas por etapa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prospecto:
 *                   type: object
 *                 calificado:
 *                   type: object
 *                 negociación:
 *                   type: object
 *                 propuesta:
 *                   type: object
 *                 cierre:
 *                   type: object
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/pipeline', [verifyToken], OportunidadesController.getPipelineVentas);

/**
 * @swagger
 * /api/oportunidades/estadisticas/resumen:
 *   get:
 *     summary: Obtener resumen general de oportunidades
 *     tags: [Oportunidades Venta - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_usuario_asignado
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen de oportunidades
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/resumen', [verifyToken], OportunidadesController.getResumenOportunidades);

/**
 * @swagger
 * /api/oportunidades/estadisticas/proximas-a-vencer:
 *   get:
 *     summary: Obtener oportunidades próximas a vencer
 *     tags: [Oportunidades Venta - Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Oportunidades próximas a vencer
 *       401:
 *         description: No autorizado
 */
router.get('/estadisticas/proximas-a-vencer', [verifyToken], OportunidadesController.getOportunidadesProximasAVencer);

export default router;
