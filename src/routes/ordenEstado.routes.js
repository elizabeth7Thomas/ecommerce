import { Router } from 'express';
import ordenEstadoController from '../controllers/OrdenEstadoController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// 🔥 PROTEGER TODAS LAS RUTAS - Solo administradores
router.use(verifyToken, isAdmin);

// Middleware de validación de ID
const validateId = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID inválido',
            code: 'ID_INVALIDO'
        });
    }
    next();
};

/**
 * @swagger
 * tags:
 *   name: Estados de Orden
 *   description: Gestión de estados del flujo de órdenes
 */


/**
 * @swagger
 * /api/estados-orden:
 *   post:
 *     summary: Crea un nuevo estado de orden
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_estado:
 *                 type: string
 *                 example: pendiente
 *     responses:
 *       201:
 *         description: Estado creado correctamente
 *       400:
 *         description: Error en la solicitud
 */
router.post('/', ordenEstadoController.create);


/**
 * @swagger
 * /api/estados-orden:
 *   get:
 *     summary: Obtiene todos los estados de orden
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados de orden
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_estado_orden:
 *                     type: integer
 *                   nombre_estado:
 *                     type: string
 */
router.get('/', ordenEstadoController.findAll);


/**
 * @swagger
 * /api/estados-orden/{id}:
 *   get:
 *     summary: Obtiene un estado de orden por ID
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado de orden
 *     responses:
 *       200:
 *         description: Estado encontrado
 *       404:
 *         description: Estado no encontrado
 */
router.get('/:id', validateId, ordenEstadoController.findOne);


/**
 * @swagger
 * /api/estados-orden/{id}:
 *   put:
 *     summary: Actualiza un estado de orden
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado de orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_estado:
 *                 type: string
 *                 example: completada
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Error en la solicitud
 *       404:
 *         description: Estado no encontrado
 */
router.put('/:id', validateId, ordenEstadoController.update);


/**
 * @swagger
 * /api/estados-orden/{id}:
 *   delete:
 *     summary: Desactiva (elimina) un estado de orden
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado de orden
 *     responses:
 *       200:
 *         description: Estado desactivado correctamente
 *       404:
 *         description: Estado no encontrado
 */
router.delete('/:id', validateId, ordenEstadoController.delete);


/**
 * @swagger
 * /api/estados-orden/{id}/activate:
 *   patch:
 *     summary: Reactiva un estado de orden previamente desactivado
 *     tags: [Estados de Orden]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del estado de orden
 *     responses:
 *       200:
 *         description: Estado reactivado correctamente
 *       404:
 *         description: Estado no encontrado
 */
router.patch('/:id/activate', validateId, ordenEstadoController.activate);

export default router;