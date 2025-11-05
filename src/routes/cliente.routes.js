import { Router } from 'express';
import clienteController from '../controllers/cliente.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: API para la gestión de clientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Cliente:
 *       type: object
 *       properties:
 *         id_cliente:
 *           type: integer
 *         id_usuario:
 *           type: integer
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         telefono:
 *           type: string
 *       example:
 *         id_cliente: 1
 *         id_usuario: 2
 *         nombre: "Juan"
 *         apellido: "Pérez"
 *         telefono: "+502 1234-5678"
 */

/**
 * @swagger
 * /api/clientes/perfil:
 *   get:
 *     summary: Obtiene el perfil del cliente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del cliente
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/perfil', [verifyToken], clienteController.getMyProfile);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Crea un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *             properties:
 *               id_usuario:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado
 */
router.post('/', [verifyToken], clienteController.createCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obtiene un cliente por ID (Solo Administradores)
 *     tags: [Clientes]
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
 *         description: Detalle del cliente
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', [verifyToken, isAdmin], clienteController.getClienteById);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente
 *     tags: [Clientes]
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
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', [verifyToken], clienteController.updateCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente (Solo Administradores)
 *     tags: [Clientes]
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
 *         description: Cliente eliminado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', [verifyToken, isAdmin], clienteController.deleteCliente);

export default router;
