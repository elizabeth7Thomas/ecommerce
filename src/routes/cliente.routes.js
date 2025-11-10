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
 *         usuario:
 *           type: object
 *           description: Alias correcto para acceder al usuario relacionado
 *           properties:
 *             id_usuario:
 *               type: integer
 *             nombre_usuario:
 *               type: string
 *             correo_electronico:
 *               type: string
 *             estado_usuario:
 *               type: string
 *       example:
 *         id_cliente: 1
 *         id_usuario: 2
 *         nombre: "Juan"
 *         apellido: "Pérez"
 *         telefono: "+502 1234-5678"
 *         usuario:
 *           id_usuario: 2
 *           nombre_usuario: "jperez"
 *           correo_electronico: "juan@example.com"
 *           estado_usuario: "activo"
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
 * /api/clientes/perfil:
 *   put:
 *     summary: Actualiza el perfil propio del cliente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
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
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Error al actualizar el perfil
 *       404:
 *         description: Perfil no encontrado
 */
router.put('/perfil', [verifyToken], clienteController.updateMyProfile);

/**
 * @swagger
 * /api/clientes/perfil:
 *   delete:
 *     summary: Elimina el perfil propio del cliente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil eliminado exitosamente
 *       404:
 *         description: Perfil no encontrado
 */
router.delete('/perfil', [verifyToken], clienteController.deleteMyProfile);

/**
 * @swagger
 * /api/clientes/buscar:
 *   get:
 *     summary: Busca clientes por criterios específicos (Solo Administradores)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Buscar por nombre
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Buscar por email
 *       - in: query
 *         name: telefono
 *         schema:
 *           type: string
 *         description: Buscar por teléfono
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere permisos de administrador)
 */
router.get('/buscar', [verifyToken, isAdmin], clienteController.searchClientes);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtiene todos los clientes con paginación y búsqueda (Solo Administradores)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, apellido o email
 *     responses:
 *       200:
 *         description: Lista de clientes con paginación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere permisos de administrador)
 */
router.get('/', [verifyToken, isAdmin], clienteController.getAllClientes);

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
 *         description: El ID del cliente
 *     responses:
 *       200:
 *         description: Detalle del cliente con información del usuario asociado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere permisos de administrador)
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
