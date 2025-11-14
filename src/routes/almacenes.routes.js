import { Router } from 'express';
import almacenesController from '../controllers/almacenes.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/almacenes:
 *   post:
 *     summary: Crear un nuevo almacén
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, ubicacion]
 *             properties:
 *               nombre:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               capacidad_maxima:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Almacén creado exitosamente
 *   get:
 *     summary: Obtener todos los almacenes
 *     tags: [Almacenes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Almacenes obtenidos exitosamente
 *
 * /api/almacenes/{id}:
 *   get:
 *     summary: Obtener almacén por ID
 *     tags: [Almacenes]
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
 *         description: Almacén obtenido
 *       404:
 *         description: Almacén no encontrado
 *   put:
 *     summary: Actualizar un almacén
 *     tags: [Almacenes]
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
 *               nombre:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               capacidad_maxima:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Almacén actualizado
 *   delete:
 *     summary: Eliminar un almacén
 *     tags: [Almacenes]
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
 *         description: Almacén eliminado
 */

router.post('/', verifyToken, isAdmin, almacenesController.create);
router.get('/', verifyToken, almacenesController.getAll);
router.get('/:id', verifyToken, almacenesController.getById);
router.put('/:id', verifyToken, isAdmin, almacenesController.update);
router.delete('/:id', verifyToken, isAdmin, almacenesController.delete);

export default router;