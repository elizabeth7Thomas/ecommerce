import { Router } from 'express';
import categoriaController from '../controllers/categoria.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: API para la gestión de categorías de productos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id_categoria:
 *           type: integer
 *           description: ID autogenerado de la categoría
 *         nombre_categoria:
 *           type: string
 *           description: Nombre de la categoría
 *         descripcion:
 *           type: string
 *           description: Descripción de la categoría
 *         activo:
 *           type: boolean
 *           description: Estado de la categoría
 *       example:
 *         id_categoria: 1
 *         nombre_categoria: "Electrónica"
 *         descripcion: "Dispositivos electrónicos y accesorios"
 *         activo: true
 */

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Obtiene todas las categorías
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 */
router.get('/', categoriaController.getAllCategorias);

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Obtiene una categoría por ID
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Detalle de la categoría
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/:id', categoriaController.getCategoriaById);

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Crea una nueva categoría (Solo Administradores)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_categoria
 *             properties:
 *               nombre_categoria:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       403:
 *         description: Acceso denegado
 */
router.post('/', [verifyToken, isAdmin], categoriaController.createCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Actualiza una categoría (Solo Administradores)
 *     tags: [Categorías]
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
 *               nombre_categoria:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       404:
 *         description: Categoría no encontrada
 */
router.put('/:id', [verifyToken, isAdmin], categoriaController.updateCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Desactiva una categoría (Solo Administradores)
 *     tags: [Categorías]
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
 *         description: Categoría desactivada
 *       404:
 *         description: Categoría no encontrada
 */
router.delete('/:id', [verifyToken, isAdmin], categoriaController.deleteCategoria);

export default router;
