// En /src/routes/auth.routes.js
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para registro, login y gestión de usuarios
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', verifyToken, authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
router.put('/change-password', verifyToken, authController.changePassword);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
router.get('/verify', verifyToken, authController.verifyToken);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar token
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh', verifyToken, authController.refreshToken);

export default router;