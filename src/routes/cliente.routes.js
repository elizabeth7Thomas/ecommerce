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
 *     summary: Obtener perfil del cliente autenticado
 *     description: Obtiene el perfil de cliente del usuario actualmente autenticado usando su JWT
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del cliente obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cliente'
 *       404:
 *         description: El usuario no tiene un perfil de cliente
 *       401:
 *         description: No autorizado
 */
router.get('/perfil', verifyToken, clienteController.getMyProfile);

/**
 * @swagger
 * /api/clientes/perfil:
 *   put:
 *     summary: Actualizar perfil del cliente autenticado
 *     description: Actualiza el perfil de cliente del usuario actualmente autenticado
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
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 example: "Pérez"
 *               telefono:
 *                 type: string
 *                 example: "+502 7777-7777"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               genero:
 *                 type: string
 *                 enum: [M, F, O]
 *               empresa:
 *                 type: string
 *               documento_identidad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Perfil no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/perfil', verifyToken, clienteController.updateMyProfile);

/**
 * @swagger
 * /api/clientes/perfil:
 *   delete:
 *     summary: Eliminar perfil del cliente autenticado
 *     description: Elimina el perfil de cliente del usuario actualmente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil eliminado exitosamente
 *       404:
 *         description: Perfil no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/perfil', verifyToken, clienteController.deleteMyProfile);

/**
 * @swagger
 * /api/clientes/buscar:
 *   get:
 *     summary: Buscar clientes por criterios (Admin)
 *     description: Búsqueda avanzada de clientes por nombre, email o teléfono. Solo para administradores.
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Buscar por nombre del cliente
 *         example: "Juan"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Buscar por correo electrónico
 *         example: "juan@example.com"
 *       - in: query
 *         name: telefono
 *         schema:
 *           type: string
 *         description: Buscar por teléfono
 *         example: "+502 7777-7777"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda encontrados
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores pueden realizar búsquedas
 */
router.get('/buscar', verifyToken, isAdmin, clienteController.searchClientes);

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Obtener todos los clientes (Admin)
 *     description: Lista paginada de todos los clientes registrados en el sistema. Solo para administradores.
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
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general por nombre, apellido o email
 *         example: "Juan Pérez"
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores pueden listar clientes
 */
router.get('/', verifyToken, isAdmin, clienteController.getAllClientes);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Crear cliente (Usuario se registra como cliente)
 *     description: Un usuario autenticado crea su propio perfil de cliente usando su token JWT
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
 *               - nombre
 *               - apellido
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 example: "Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *               telefono:
 *                 type: string
 *                 example: "+502 7777-7777"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               genero:
 *                 type: string
 *                 enum: [M, F, O]
 *               empresa:
 *                 type: string
 *               documento_identidad:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: El usuario ya tiene un perfil de cliente
 */
router.post('/', verifyToken, (req, res) => {
  clienteController.createCliente(req, res);
});

/**
 * @swagger
 * /api/clientes/admin/crear:
 *   post:
 *     summary: Crear cliente (Admin crea cliente para usuario)
 *     description: El administrador crea un perfil de cliente para un usuario específico. El admin especifica el id_usuario en el body.
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
 *               - nombre
 *               - apellido
 *               - email
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 description: ID del usuario para el que se crea el cliente
 *                 example: 5
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 example: "Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *               telefono:
 *                 type: string
 *                 example: "+502 7777-7777"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               genero:
 *                 type: string
 *                 enum: [M, F, O]
 *               empresa:
 *                 type: string
 *               documento_identidad:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente por admin
 *       400:
 *         description: Datos inválidos o id_usuario requerido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores pueden usar este endpoint
 *       409:
 *         description: El usuario ya tiene un perfil de cliente
 */
router.post('/admin/crear', verifyToken, isAdmin, (req, res) => {
  clienteController.createClienteByAdmin(req, res);
});

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obtener cliente por ID (Admin)
 *     description: Obtiene los detalles completos de un cliente específico. Solo para administradores.
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a consultar
 *         example: 1
 *     responses:
 *       200:
 *         description: Cliente obtenido exitosamente
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
 *         description: Solo administradores pueden consultar clientes
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', verifyToken, isAdmin, clienteController.getClienteById);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Actualizar cliente (Admin o propietario del perfil)
 *     description: Actualiza la información de un cliente. Los administradores pueden actualizar cualquier cliente, los usuarios pueden actualizar su propio perfil
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del cliente a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Carlos"
 *               apellido:
 *                 type: string
 *                 example: "Pérez López"
 *               telefono:
 *                 type: string
 *                 example: "+502 7777-8888"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               genero:
 *                 type: string
 *                 enum: [M, F, O]
 *               empresa:
 *                 type: string
 *                 example: "Tech Solutions S.A."
 *               documento_identidad:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para actualizar este cliente
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', verifyToken, clienteController.updateCliente);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Eliminar cliente (Admin)
 *     description: Elimina un cliente del sistema. Solo para administradores.
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores pueden eliminar clientes
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', verifyToken, isAdmin, clienteController.deleteCliente);

export default router;
