import { Router } from 'express';
import rolController from '../controllers/rol.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: API para la gestión de roles de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       properties:
 *         id_rol:
 *           type: integer
 *           description: ID autogenerado del rol
 *         nombre_rol:
 *           type: string
 *           description: Nombre del rol
 *         descripcion:
 *           type: string
 *           description: Descripción del rol
 *         permisos:
 *           type: object
 *           description: Objeto JSON con los permisos del rol
 *         activo:
 *           type: boolean
 *           description: Estado del rol
 *       example:
 *         id_rol: 1
 *         nombre_rol: "administrador"
 *         descripcion: "Usuario con permisos administrativos completos"
 *         permisos: {"productos": ["crear", "editar", "eliminar", "ver"]}
 *         activo: true
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtiene todos los roles activos
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 */
router.get('/', rolController.getAllRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtiene un rol por su ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', rolController.getRolById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crea un nuevo rol (solo administrador)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_rol
 *             properties:
 *               nombre_rol:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               permisos:
 *                 type: object
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       400:
 *         description: Error en los datos
 *       403:
 *         description: Acceso denegado
 */
router.post('/', [verifyToken, isAdmin], rolController.createRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualiza un rol (solo administrador)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_rol:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               permisos:
 *                 type: object
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       404:
 *         description: Rol no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.put('/:id', [verifyToken, isAdmin], rolController.updateRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Desactiva un rol (solo administrador)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol desactivado exitosamente
 *       404:
 *         description: Rol no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', [verifyToken, isAdmin], rolController.deleteRol);

export default router;
