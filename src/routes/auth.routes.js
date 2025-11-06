import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: API para autenticación de usuarios (registro, login, perfil)
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
 *         nombre_rol:
 *           type: string
 *         descripcion:
 *           type: string
 *         permisos:
 *           type: object
 *       example:
 *         id_rol: 2
 *         nombre_rol: "cliente"
 *         descripcion: "Usuario cliente"
 *         permisos: {}
 *
 *     Usuario:
 *       type: object
 *       properties:
 *         id_usuario:
 *           type: integer
 *         nombre_usuario:
 *           type: string
 *         correo_electronico:
 *           type: string
 *           format: email
 *         id_rol:
 *           type: integer
 *         nombre_rol:
 *           type: string
 *         rol:
 *           $ref: '#/components/schemas/Rol'
 *         activo:
 *           type: boolean
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *       example:
 *         id_usuario: 5
 *         nombre_usuario: "juan_perez"
 *         correo_electronico: "juan@example.com"
 *         id_rol: 2
 *         nombre_rol: "cliente"
 *         rol:
 *           id_rol: 2
 *           nombre_rol: "cliente"
 *           descripcion: "Usuario cliente"
 *           permisos: {}
 *         activo: true
 *         fecha_creacion: "2025-11-05T10:30:00.000Z"
 *     
 *     UsuarioRegistro:
 *       type: object
 *       required:
 *         - nombre_usuario
 *         - correo_electronico
 *         - contrasena
 *       properties:
 *         nombre_usuario:
 *           type: string
 *           description: Nombre único del usuario
 *         correo_electronico:
 *           type: string
 *           format: email
 *           description: Email único del usuario
 *         contrasena:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *         nombre_rol:
 *           type: string
 *           description: Nombre del rol (opcional, por defecto "cliente")
 *       example:
 *         nombre_usuario: "juan_perez"
 *         correo_electronico: "juan@example.com"
 *         contrasena: "SecurePass123"
 *         nombre_rol: "cliente"
 *     
 *     UsuarioLogin:
 *       type: object
 *       required:
 *         - correo_electronico
 *         - contrasena
 *       properties:
 *         correo_electronico:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *           format: password
 *       example:
 *         correo_electronico: "juan@example.com"
 *         contrasena: "SecurePass123"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id_usuario:
 *               type: integer
 *             nombre_usuario:
 *               type: string
 *             correo_electronico:
 *               type: string
 *             id_rol:
 *               type: integer
 *             nombre_rol:
 *               type: string
 *             permisos:
 *               type: object
 *             token:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Error en los datos de registro
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión con email y contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioLogin'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Email y contraseña son requeridos
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario con su rol incluido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado - Token inválido o expirado
 */
router.get('/profile', [verifyToken], authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualiza el perfil del usuario autenticado
 *     tags: [Autenticación]
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
 *                 description: Nuevo nombre de usuario
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Error en los datos
 *       401:
 *         description: No autorizado
 */
router.put('/profile', [verifyToken], authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contrasena_actual
 *               - contrasena_nueva
 *             properties:
 *               contrasena_actual:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual
 *               contrasena_nueva:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña
 *     responses:
 *       204:
 *         description: Contraseña actualizada exitosamente
 *       401:
 *         description: Contraseña actual incorrecta o no autorizado
 *       400:
 *         description: Datos requeridos faltantes
 */
router.put('/change-password', [verifyToken], authController.changePassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña (mínimo 6 caracteres)
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       401:
 *         description: Contraseña actual incorrecta
 *       400:
 *         description: Contraseñas son requeridas
 */
router.put('/change-password', [verifyToken], authController.changePassword);

export default router;
