import { Router } from 'express';
import usuarioController from '../controllers/usuario.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id_usuario:
 *           type: integer
 *           description: El ID autogenerado del usuario.
 *         nombre_usuario:
 *           type: string
 *           description: El nombre de usuario único.
 *         correo_electronico:
 *           type: string
 *           format: email
 *           description: El correo electrónico único del usuario.
 *         rol:
 *           type: string
 *           enum: [cliente, administrador]
 *           description: El rol del usuario.
 *         activo:
 *           type: boolean
 *           description: Indica si el usuario está activo.
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: La fecha de creación del usuario.
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           description: La última fecha de actualización del usuario.
 *       example:
 *         id_usuario: 1
 *         nombre_usuario: "admin_user"
 *         correo_electronico: "admin@example.com"
 *         rol: "administrador"
 *         activo: true
 *         fecha_creacion: "2023-10-27T10:00:00.000Z"
 *         fecha_actualizacion: "2023-10-27T10:00:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: API para la gestión de usuarios (Requiere rol de Administrador)
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Retorna la lista de todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: La lista de usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       403:
 *         description: Acceso denegado.
 */
router.get('/usuarios', [verifyToken, isAdmin], usuarioController.getAllUsuarios);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtiene un usuario por su ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del usuario.
 *     responses:
 *       200:
 *         description: Detalles del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
router.get('/usuarios/:id', [verifyToken, isAdmin], usuarioController.getUsuarioById);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *               correo_electronico:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       409:
 *         description: Conflicto, el usuario o correo ya existe.
 *       403:
 *         description: Acceso denegado.
 */
router.post('/usuarios', [verifyToken, isAdmin], usuarioController.createUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualiza un usuario existente
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del usuario a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *               correo_electronico:
 *                 type: string
 *               rol:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
router.put('/usuarios/:id', [verifyToken, isAdmin], usuarioController.updateUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Desactiva un usuario (eliminación lógica)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del usuario a desactivar.
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
router.delete('/usuarios/:id', [verifyToken, isAdmin], usuarioController.deleteUsuario);

export default router;