import { Router } from 'express';
import campanasMarketingController from '../controllers/campanasMarketing.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Campañas Marketing
 *     description: Gestión de campañas de marketing y promociones
 */

/**
 * @swagger
 * /api/campanas-marketing:
 *   post:
 *     summary: Crear nueva campaña de marketing
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo_campana
 *               - descripcion
 *               - fecha_inicio
 *               - fecha_fin
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Black Friday 2025"
 *               tipo_campana:
 *                 type: string
 *                 enum: [email, sms, social, descuento]
 *                 example: "descuento"
 *               descripcion:
 *                 type: string
 *                 example: "Gran venta de descuentos del 50%"
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-10T00:00:00Z"
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-15T23:59:59Z"
 *               presupuesto:
 *                 type: number
 *                 example: 1000.00
 *               porcentaje_descuento:
 *                 type: number
 *                 example: 50
 *               estado:
 *                 type: string
 *                 enum: [planificacion, activa, pausada, finalizada]
 *                 example: "planificacion"
 *     responses:
 *       201:
 *         description: Campaña creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 estado:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *   get:
 *     summary: Obtener todas las campañas de marketing
 *     tags:
 *       - Campañas Marketing
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
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [planificacion, activa, pausada, finalizada]
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipo_campana
 *         schema:
 *           type: string
 *           enum: [email, sms, social, descuento]
 *         description: Filtrar por tipo de campaña
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [nombre, fecha_inicio, estado]
 *         description: Ordenar por campo
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de campañas obtenida exitosamente
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/activas:
 *   get:
 *     summary: Obtener campañas activas
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campañas activas
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/fecha:
 *   get:
 *     summary: Obtener campañas por rango de fechas
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de campañas en el rango de fechas
 *       400:
 *         description: Se requieren las fechas de inicio y fin
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de campañas
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de campañas
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/proximas:
 *   get:
 *     summary: Obtener campañas próximas
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Días a futuro para obtener campañas
 *     responses:
 *       200:
 *         description: Lista de campañas próximas
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/atencion:
 *   get:
 *     summary: Obtener campañas que necesitan atención
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campañas que necesitan atención
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/{id}:
 *   get:
 *     summary: Obtener campaña por ID
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Campaña obtenida exitosamente
 *       404:
 *         description: Campaña no encontrada
 *   put:
 *     summary: Actualizar campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *               presupuesto:
 *                 type: number
 *               porcentaje_descuento:
 *                 type: number
 *     responses:
 *       200:
 *         description: Campaña actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Campaña no encontrada
 *   delete:
 *     summary: Eliminar campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Campaña eliminada exitosamente
 *       404:
 *         description: Campaña no encontrada
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/campanas-marketing/{id}/estado:
 *   put:
 *     summary: Cambiar estado de la campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
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
 *                 enum: [activa, pausada, finalizada]
 *                 example: "activa"
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: El estado es requerido
 *       404:
 *         description: Campaña no encontrada
 */

/**
 * @swagger
 * /api/campanas-marketing/{id}/activar:
 *   put:
 *     summary: Activar campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Campaña activada exitosamente
 *       400:
 *         description: Error al activar la campaña
 *       404:
 *         description: Campaña no encontrada
 */

/**
 * @swagger
 * /api/campanas-marketing/{id}/pausar:
 *   put:
 *     summary: Pausar campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Campaña pausada exitosamente
 *       400:
 *         description: Error al pausar la campaña
 *       404:
 *         description: Campaña no encontrada
 */

/**
 * @swagger
 * /api/campanas-marketing/{id}/completar:
 *   put:
 *     summary: Completar campaña
 *     tags:
 *       - Campañas Marketing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Campaña completada exitosamente
 *       400:
 *         description: Error al completar la campaña
 *       404:
 *         description: Campaña no encontrada
 */

// Rutas para Campañas de Marketing
// CRUD básico
router.post('/', verifyToken, isAdmin, campanasMarketingController.createCampana);
router.get('/', verifyToken, campanasMarketingController.getAllCampanas);
router.get('/activas', verifyToken, campanasMarketingController.getCampanasActivas);
router.get('/fecha', verifyToken, campanasMarketingController.getCampanasByFecha);
router.get('/estadisticas', verifyToken, campanasMarketingController.getEstadisticas);
router.get('/proximas', verifyToken, campanasMarketingController.getCampanasProximas);
router.get('/atencion', verifyToken, campanasMarketingController.getCampanasNecesitanAtencion);

// Por ID
router.get('/:id', verifyToken, campanasMarketingController.getCampanaById);
router.put('/:id', verifyToken, isAdmin, campanasMarketingController.updateCampana);
router.delete('/:id', verifyToken, isAdmin, campanasMarketingController.deleteCampana);

// Cambios de estado
router.put('/:id/estado', verifyToken, isAdmin, campanasMarketingController.cambiarEstadoCampana);
router.put('/:id/activar', verifyToken, isAdmin, campanasMarketingController.activarCampana);
router.put('/:id/pausar', verifyToken, isAdmin, campanasMarketingController.pausarCampana);
router.put('/:id/completar', verifyToken, isAdmin, campanasMarketingController.completarCampana);

export default router;
