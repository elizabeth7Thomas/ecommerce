import { Router } from 'express';
import alertasInventarioController from '../controllers/alertasInventario.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/alertas-inventario:
 *   post:
 *     summary: Crear una nueva alerta
 *     tags: [Alertas Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_inventario, tipo]
 *             properties:
 *               id_inventario:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [stock_bajo, stock_critico, exceso, vencimiento]
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *   get:
 *     summary: Obtener todas las alertas
 *     tags: [Alertas Inventario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas obtenidas exitosamente
 *
 * /api/alertas-inventario/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     tags: [Alertas Inventario]
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
 *         description: Alerta obtenida
 *   put:
 *     summary: Actualizar alerta
 *     tags: [Alertas Inventario]
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
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *   delete:
 *     summary: Eliminar alerta
 *     tags: [Alertas Inventario]
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
 *         description: Alerta eliminada
 *
 * /api/alertas-inventario/inventario/{id_inventario}:
 *   get:
 *     summary: Obtener alertas por inventario
 *     tags: [Alertas Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_inventario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *
 * /api/alertas-inventario/tipo/{tipo}:
 *   get:
 *     summary: Obtener alertas por tipo
 *     tags: [Alertas Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *
 * /api/alertas-inventario/estado/{estado}:
 *   get:
 *     summary: Obtener alertas por estado
 *     tags: [Alertas Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estado
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alertas obtenidas
 *
 * /api/alertas-inventario/{id}/resolver:
 *   put:
 *     summary: Marcar alerta como resuelta
 *     tags: [Alertas Inventario]
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
 *               resolucion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alerta resuelta
 */

router.post('/alertas-inventario', verifyToken, isAdmin, alertasInventarioController.create);
router.get('/alertas-inventario', verifyToken, alertasInventarioController.getAll);
router.get('/alertas-inventario/:id', verifyToken, alertasInventarioController.getById);
router.get('/alertas-inventario/inventario/:id_inventario', verifyToken, alertasInventarioController.getByInventario);
router.get('/alertas-inventario/tipo/:tipo', verifyToken, alertasInventarioController.getByTipo);
router.get('/alertas-inventario/estado/:estado', verifyToken, alertasInventarioController.getByEstado);
router.put('/alertas-inventario/:id', verifyToken, isAdmin, alertasInventarioController.update);
router.put('/alertas-inventario/:id/resolver', verifyToken, isAdmin, alertasInventarioController.resolver);
router.delete('/alertas-inventario/:id', verifyToken, isAdmin, alertasInventarioController.delete);

export default router;
