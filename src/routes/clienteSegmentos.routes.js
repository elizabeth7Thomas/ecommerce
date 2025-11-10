import { Router } from 'express';
import clienteSegmentosController from '../controllers/clienteSegmentos.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cliente Segmentos
 *   description: API para la gestión de asignaciones de clientes a segmentos de mercado
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ClienteSegmento:
 *       type: object
 *       required:
 *         - id_cliente
 *         - id_segmento
 *       properties:
 *         id_cliente:
 *           type: integer
 *           description: ID del cliente
 *           example: 5
 *         id_segmento:
 *           type: integer
 *           description: ID del segmento
 *           example: 2
 *         fecha_asignacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de asignación al segmento
 *           example: "2025-11-10T10:30:00Z"
 *
 *     ResumenAsignaciones:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         asignaciones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ClienteSegmento'
 *         totalAsignados:
 *           type: integer
 *
 *     EstadisticasCliente:
 *       type: object
 *       properties:
 *         totalSegmentos:
 *           type: integer
 *           description: Total de segmentos asignados
 *           example: 5
 *         segmentoMasAntiguo:
 *           $ref: '#/components/schemas/ClienteSegmento'
 *         segmentoMasReciente:
 *           $ref: '#/components/schemas/ClienteSegmento'
 *
 *     EstadisticasSegmento:
 *       type: object
 *       properties:
 *         totalClientes:
 *           type: integer
 *           description: Total de clientes en este segmento
 *           example: 150
 *         clienteMasAntiguo:
 *           $ref: '#/components/schemas/ClienteSegmento'
 *         clienteMasReciente:
 *           $ref: '#/components/schemas/ClienteSegmento'
 *
 *     DistribucionSegmentos:
 *       type: object
 *       properties:
 *         id_segmento:
 *           type: integer
 *         total_clientes:
 *           type: integer
 */

/**
 * @swagger
 * /api/cliente-segmentos:
 *   post:
 *     summary: Asignar segmento a cliente
 *     description: Asigna un segmento individual a un cliente
 *     tags: [Cliente Segmentos]
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
 *               - id_segmento
 *             properties:
 *               id_cliente:
 *                 type: integer
 *                 example: 5
 *               id_segmento:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Segmento asignado a cliente exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClienteSegmento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o cliente ya asignado a este segmento
 *       401:
 *         description: No autorizado
 */
router.post('/', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.asignarSegmentoACliente(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/cliente/{idCliente}/multiples:
 *   post:
 *     summary: Asignar múltiples segmentos a un cliente
 *     description: Asigna varios segmentos a un cliente en una sola operación
 *     tags: [Cliente Segmentos]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - segmentosIds
 *             properties:
 *               segmentosIds:
 *                 type: array
 *                 description: Array de IDs de segmentos
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Segmentos asignados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResumenAsignaciones'
 *       400:
 *         description: Array de segmentosIds inválido
 *       401:
 *         description: No autorizado
 */
router.post('/cliente/:idCliente/multiples', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.asignarMultiplesSegmentos(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/segmento/{idSegmento}/multiples:
 *   post:
 *     summary: Asignar múltiples clientes a un segmento
 *     description: Asigna varios clientes a un segmento en una sola operación
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSegmento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segmento
 *         example: 2
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
 *                 description: Array de IDs de clientes
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
 *                   $ref: '#/components/schemas/ResumenAsignaciones'
 *       400:
 *         description: Array de clientesIds inválido
 *       401:
 *         description: No autorizado
 */
router.post('/segmento/:idSegmento/multiples', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.asignarMultiplesClientes(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/{idCliente}/{idSegmento}:
 *   get:
 *     summary: Obtener asignación específica
 *     description: Obtiene los detalles de una asignación específica cliente-segmento
 *     tags: [Cliente Segmentos]
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
 *       - in: path
 *         name: idSegmento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segmento
 *         example: 2
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
 *                   $ref: '#/components/schemas/ClienteSegmento'
 *       404:
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:idCliente/:idSegmento', verifyToken, (req, res) => {
  clienteSegmentosController.getAsignacion(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/cliente/{idCliente}:
 *   get:
 *     summary: Obtener segmentos de un cliente
 *     description: Obtiene todos los segmentos asignados a un cliente con paginación
 *     tags: [Cliente Segmentos]
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
 *         description: Lista de segmentos obtenida exitosamente
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
 *                     segmentos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ClienteSegmento'
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
  clienteSegmentosController.getSegmentosByCliente(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/segmento/{idSegmento}:
 *   get:
 *     summary: Obtener clientes de un segmento
 *     description: Obtiene todos los clientes asignados a un segmento con paginación
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSegmento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segmento
 *         example: 2
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
 *                         $ref: '#/components/schemas/ClienteSegmento'
 *                     total:
 *                       type: integer
 *                     pagina:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */
router.get('/segmento/:idSegmento', verifyToken, (req, res) => {
  clienteSegmentosController.getClientesBySegmento(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/interseccion/multiples:
 *   post:
 *     summary: Obtener clientes en múltiples segmentos
 *     description: Obtiene los clientes que están asignados a TODOS los segmentos especificados
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - segmentosIds
 *             properties:
 *               segmentosIds:
 *                 type: array
 *                 description: Array de IDs de segmentos
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Clientes en intersección obtenidos exitosamente
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
 *                     type: object
 *                     properties:
 *                       id_cliente:
 *                         type: integer
 *                       total_segmentos:
 *                         type: integer
 *       400:
 *         description: Array de segmentosIds inválido
 *       401:
 *         description: No autorizado
 */
router.post('/interseccion/multiples', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.getClientesEnMultiplesSegmentos(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/{idCliente}/{idSegmento}/fecha:
 *   patch:
 *     summary: Actualizar fecha de asignación
 *     description: Actualiza la fecha de asignación de un cliente a un segmento
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idSegmento
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
 *               - fecha_asignacion
 *             properties:
 *               fecha_asignacion:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-11-10T10:30:00Z"
 *     responses:
 *       200:
 *         description: Fecha de asignación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClienteSegmento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Asignación no encontrada
 *       401:
 *         description: No autorizado
 */
router.patch('/:idCliente/:idSegmento/fecha', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.actualizarFechaAsignacion(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/{idCliente}/{idSegmento}:
 *   delete:
 *     summary: Eliminar asignación
 *     description: Elimina una asignación específica cliente-segmento
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idSegmento
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
router.delete('/:idCliente/:idSegmento', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.eliminarAsignacion(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/cliente/{idCliente}/vaciar:
 *   delete:
 *     summary: Eliminar todos los segmentos de un cliente
 *     description: Elimina todos los segmentos asignados a un cliente
 *     tags: [Cliente Segmentos]
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
 *         description: Segmentos eliminados exitosamente
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
router.delete('/cliente/:idCliente/vaciar', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.eliminarSegmentosDeCliente(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/segmento/{idSegmento}/vaciar:
 *   delete:
 *     summary: Eliminar todos los clientes de un segmento
 *     description: Elimina todos los clientes asignados a un segmento
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSegmento
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
router.delete('/segmento/:idSegmento/vaciar', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.eliminarClientesDeSegmento(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/{idCliente}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de cliente
 *     description: Obtiene estadísticas de los segmentos asignados a un cliente
 *     tags: [Cliente Segmentos]
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
router.get('/:idCliente/estadisticas', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.getEstadisticasCliente(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/segmento/{idSegmento}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de segmento
 *     description: Obtiene estadísticas de los clientes asignados a un segmento
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idSegmento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del segmento
 *         example: 2
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
 *                   $ref: '#/components/schemas/EstadisticasSegmento'
 *       401:
 *         description: No autorizado
 */
router.get('/segmento/:idSegmento/estadisticas', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.getEstadisticasSegmento(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/distribucion/todos:
 *   get:
 *     summary: Obtener distribución de segmentos
 *     description: Obtiene la distribución de clientes por segmentos (ordenado por cantidad descendente)
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Distribución obtenida exitosamente
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
 *                     $ref: '#/components/schemas/DistribucionSegmentos'
 *       401:
 *         description: No autorizado
 */
router.get('/distribucion/todos', verifyToken, isAdmin, (req, res) => {
  clienteSegmentosController.getDistribucionSegmentos(req, res);
});

/**
 * @swagger
 * /api/cliente-segmentos/{idCliente}/{idSegmento}/verificar:
 *   get:
 *     summary: Verificar asignación
 *     description: Verifica si existe una asignación entre un cliente y un segmento
 *     tags: [Cliente Segmentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: idSegmento
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
 *       401:
 *         description: No autorizado
 */
router.get('/:idCliente/:idSegmento/verificar', verifyToken, (req, res) => {
  clienteSegmentosController.verificarAsignacion(req, res);
});

export default router;
