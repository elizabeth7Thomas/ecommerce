import { Router } from 'express';
import movimientosInventarioController from '../controllers/movimientosInventario.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/movimientos-inventario:
 *   post:
 *     summary: Registrar un nuevo movimiento de inventario
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_inventario, tipo_movimiento, cantidad, id_usuario]
 *             properties:
 *               id_inventario:
 *                 type: integer
 *                 description: ID del registro de inventario
 *               tipo_movimiento:
 *                 type: string
 *                 enum: [entrada, salida, ajuste, transferencia, devolucion]
 *                 description: Tipo de movimiento
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad a mover
 *               id_usuario:
 *                 type: integer
 *                 description: ID del usuario que realiza el movimiento
 *               motivo:
 *                 type: string
 *                 description: Motivo del movimiento
 *               referencia:
 *                 type: string
 *                 description: Número de documento o referencia
 *               id_orden:
 *                 type: integer
 *                 description: ID de la orden asociada (opcional)
 *     responses:
 *       201:
 *         description: Movimiento registrado exitosamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       404:
 *         description: Inventario no encontrado
 *   get:
 *     summary: Obtener todos los movimientos de inventario
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_inventario
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_movimiento
 *         schema:
 *           type: string
 *           enum: [entrada, salida, ajuste, transferencia, devolucion]
 *       - in: query
 *         name: id_usuario
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Movimientos obtenidos exitosamente
 *
 * /api/movimientos-inventario/{id}:
 *   get:
 *     summary: Obtener movimiento por ID
 *     tags: [Movimientos Inventario]
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
 *         description: Movimiento obtenido
 *       404:
 *         description: Movimiento no encontrado
 *   delete:
 *     summary: Eliminar movimiento (requiere confirmación)
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: forzar
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Debe ser true para confirmar la eliminación
 *     responses:
 *       200:
 *         description: Movimiento eliminado
 *       403:
 *         description: Eliminación no confirmada
 *       404:
 *         description: Movimiento no encontrado
 *
 * /api/movimientos-inventario/inventario/{id_inventario}:
 *   get:
 *     summary: Obtener movimientos de un inventario específico
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_inventario
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Movimientos del inventario obtenidos
 *
 * /api/movimientos-inventario/tipo/{tipo}:
 *   get:
 *     summary: Obtener movimientos por tipo
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [entrada, salida, ajuste, transferencia, devolucion]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Movimientos por tipo obtenidos
 *       400:
 *         description: Tipo inválido
 *
 * /api/movimientos-inventario/fecha:
 *   get:
 *     summary: Obtener movimientos por rango de fechas
 *     tags: [Movimientos Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tipo_movimiento
 *         schema:
 *           type: string
 *           enum: [entrada, salida, ajuste, transferencia, devolucion]
 *       - in: query
 *         name: id_inventario
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Movimientos por rango de fechas obtenidos con totales por tipo
 *       400:
 *         description: Fechas requeridas
 */

router.post('/movimientos-inventario', verifyToken, movimientosInventarioController.create);
router.get('/movimientos-inventario', verifyToken, movimientosInventarioController.getAll);
router.get('/movimientos-inventario/:id', verifyToken, movimientosInventarioController.getById);
router.get('/movimientos-inventario/inventario/:id_inventario', verifyToken, movimientosInventarioController.getByInventario);
router.get('/movimientos-inventario/tipo/:tipo', verifyToken, movimientosInventarioController.getByTipo);
router.get('/movimientos-inventario/fecha', verifyToken, movimientosInventarioController.getByFecha);
router.delete('/movimientos-inventario/:id', verifyToken, isAdmin, movimientosInventarioController.delete);

export default router;
