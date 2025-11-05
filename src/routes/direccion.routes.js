import { Router } from 'express';
import direccionController from '../controllers/direccion.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Direcciones
 *   description: API para la gestión de direcciones de envío
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Direccion:
 *       type: object
 *       properties:
 *         id_direccion:
 *           type: integer
 *         id_cliente:
 *           type: integer
 *         calle:
 *           type: string
 *         ciudad:
 *           type: string
 *         estado:
 *           type: string
 *         codigo_postal:
 *           type: string
 *         pais:
 *           type: string
 *         es_principal:
 *           type: boolean
 *       example:
 *         id_direccion: 1
 *         id_cliente: 1
 *         calle: "Calle Principal 123"
 *         ciudad: "Guatemala"
 *         estado: "Guatemala"
 *         codigo_postal: "01001"
 *         pais: "Guatemala"
 *         es_principal: true
 */

/**
 * @swagger
 * /api/direcciones:
 *   get:
 *     summary: Obtiene las direcciones del usuario autenticado
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Direccion'
 */
router.get('/', [verifyToken], direccionController.getMyDirecciones);

/**
 * @swagger
 * /api/direcciones:
 *   post:
 *     summary: Crea una nueva dirección para el usuario autenticado
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calle
 *               - ciudad
 *               - estado
 *               - codigo_postal
 *               - pais
 *             properties:
 *               calle:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               estado:
 *                 type: string
 *               codigo_postal:
 *                 type: string
 *               pais:
 *                 type: string
 *               es_principal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 */
router.post('/', [verifyToken], direccionController.createDireccion);

/**
 * @swagger
 * /api/direcciones/{id}:
 *   get:
 *     summary: Obtiene una dirección por ID
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Detalle de la dirección
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 */
router.get('/:id', [verifyToken], direccionController.getDireccionById);

/**
 * @swagger
 * /api/direcciones/{id}:
 *   put:
 *     summary: Actualiza una dirección
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               calle:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               estado:
 *                 type: string
 *               codigo_postal:
 *                 type: string
 *               pais:
 *                 type: string
 *               es_principal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Dirección actualizada
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 */
router.put('/:id', [verifyToken], direccionController.updateDireccion);

/**
 * @swagger
 * /api/direcciones/{id}:
 *   delete:
 *     summary: Elimina una dirección
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Dirección eliminada
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Dirección no encontrada
 */
router.delete('/:id', [verifyToken], direccionController.deleteDireccion);

export default router;
