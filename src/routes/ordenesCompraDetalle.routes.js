import { Router } from 'express';
import ordenesCompraDetalleController from '../controllers/ordenesCompraDetalle.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/ordenes-compra-detalle:
 *   post:
 *     summary: Crear detalle de orden de compra
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_orden_compra, id_producto, cantidad_ordenada, precio_unitario]
 *             properties:
 *               id_orden_compra:
 *                 type: integer
 *               id_producto:
 *                 type: integer
 *               cantidad_ordenada:
 *                 type: number
 *               precio_unitario:
 *                 type: number
 *               cantidad_recibida:
 *                 type: number
 *               notas_detalle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Detalle creado exitosamente
 *   get:
 *     summary: Obtener todos los detalles de órdenes
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_orden_compra
 *         schema:
 *           type: integer
 *       - in: query
 *         name: recibido_completo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Detalles obtenidos exitosamente
 *
 * /api/ordenes-compra-detalle/{id}:
 *   get:
 *     summary: Obtener detalle por ID
 *     tags: [Órdenes Compra Detalle]
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
 *         description: Detalle obtenido
 *   put:
 *     summary: Actualizar detalle
 *     tags: [Órdenes Compra Detalle]
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
 *     responses:
 *       200:
 *         description: Detalle actualizado
 *   delete:
 *     summary: Eliminar detalle
 *     tags: [Órdenes Compra Detalle]
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
 *         description: Detalle eliminado
 *
 * /api/ordenes-compra-detalle/orden/{id_orden_compra}:
 *   get:
 *     summary: Obtener detalles por orden de compra
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden_compra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la orden obtenidos
 *
 * /api/ordenes-compra-detalle/{id}/cantidad-recibida:
 *   put:
 *     summary: Registrar cantidad recibida
 *     tags: [Órdenes Compra Detalle]
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
 *             required: [cantidadRecibida]
 *             properties:
 *               cantidadRecibida:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cantidad registrada
 *
 * /api/ordenes-compra-detalle/{id}/recepcion-parcial:
 *   put:
 *     summary: Registrar recepción parcial
 *     tags: [Órdenes Compra Detalle]
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
 *             required: [cantidadAdicional]
 *             properties:
 *               cantidadAdicional:
 *                 type: number
 *     responses:
 *       200:
 *         description: Recepción parcial registrada
 *
 * /api/ordenes-compra-detalle/{id}/marcar-recibido:
 *   put:
 *     summary: Marcar detalle como completamente recibido
 *     tags: [Órdenes Compra Detalle]
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
 *         description: Marcado como recibido
 *
 * /api/ordenes-compra/{id_orden_compra}/marcar-como-recibida:
 *   put:
 *     summary: Marcar orden como completamente recibida
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden_compra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden marcada como recibida
 *
 * /api/ordenes-compra-detalle/pendientes:
 *   get:
 *     summary: Obtener detalles pendientes de recibir
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_orden_compra
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles pendientes obtenidos
 *
 * /api/ordenes-compra/{id_orden_compra}/total:
 *   get:
 *     summary: Calcular total de orden
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden_compra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Total calculado
 *
 * /api/ordenes-compra/{id_orden_compra}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de recepción
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden_compra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas
 *
 * /api/ordenes-compra/{id_orden_compra}/verificar-recepcion:
 *   get:
 *     summary: Verificar si recepción está completa
 *     tags: [Órdenes Compra Detalle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_orden_compra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Verificación completada
 */

// CRUD Base
router.post('/ordenes-compra-detalle', verifyToken, isAdmin, ordenesCompraDetalleController.create);
router.get('/ordenes-compra-detalle', verifyToken, ordenesCompraDetalleController.getAll);
router.get('/ordenes-compra-detalle/:id', verifyToken, ordenesCompraDetalleController.getById);
router.put('/ordenes-compra-detalle/:id', verifyToken, isAdmin, ordenesCompraDetalleController.update);
router.delete('/ordenes-compra-detalle/:id', verifyToken, isAdmin, ordenesCompraDetalleController.delete);

// Obtener detalles por orden
router.get('/ordenes-compra/orden/:id_orden_compra', verifyToken, ordenesCompraDetalleController.getByOrdenCompra);

// Gestión de Recepción
router.put('/ordenes-compra-detalle/:id/cantidad-recibida', verifyToken, isAdmin, ordenesCompraDetalleController.registrarCantidadRecibida);
router.put('/ordenes-compra-detalle/:id/recepcion-parcial', verifyToken, isAdmin, ordenesCompraDetalleController.registrarRecepcionParcial);
router.put('/ordenes-compra-detalle/:id/marcar-recibido', verifyToken, isAdmin, ordenesCompraDetalleController.marcarComoRecibido);
router.put('/ordenes-compra/:id_orden_compra/marcar-como-recibida', verifyToken, isAdmin, ordenesCompraDetalleController.marcarOrdenComoRecibida);

// Reportes y Estadísticas
router.get('/ordenes-compra-detalle/pendientes', verifyToken, ordenesCompraDetalleController.getDetallesPendientes);
router.get('/ordenes-compra/:id_orden_compra/total', verifyToken, ordenesCompraDetalleController.calcularTotalOrden);
router.get('/ordenes-compra/:id_orden_compra/estadisticas', verifyToken, ordenesCompraDetalleController.getEstadisticasRecepcion);
router.get('/ordenes-compra/:id_orden_compra/verificar-recepcion', verifyToken, ordenesCompraDetalleController.verificarRecepcionCompleta);

export default router;
