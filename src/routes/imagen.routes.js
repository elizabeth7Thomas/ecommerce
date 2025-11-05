import { Router } from 'express';
import imagenController from '../controllers/imagen.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductoImagen:
 *       type: object
 *       properties:
 *         id_imagen:
 *           type: integer
 *         id_producto:
 *           type: integer
 *         url_imagen:
 *           type: string
 *         es_principal:
 *           type: boolean
 *       example:
 *         id_imagen: 1
 *         id_producto: 1
 *         url_imagen: "/images/laptop-dell-1.jpg"
 *         es_principal: true
 *
 *     ProductoImagenInput:
 *       type: object
 *       required:
 *         - url_imagen
 *       properties:
 *         url_imagen:
 *           type: string
 *           description: "URL pública de la imagen."
 *         es_principal:
 *           type: boolean
 *           description: "Si es true, esta se convertirá en la imagen principal del producto."
 */

/**
 * @swagger
 * tags:
 *   name: Imagenes de Productos
 *   description: API para gestionar las imágenes de los productos
 */

// Rutas anidadas bajo /api/productos/:id_producto/imagenes
const nestedRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/productos/{id_producto}/imagenes:
 *   get:
 *     summary: Obtiene todas las imágenes de un producto específico
 *     tags: [Imagenes de Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del producto.
 *     responses:
 *       200:
 *         description: Lista de imágenes del producto.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductoImagen'
 *       404:
 *         description: Producto no encontrado.
 */
nestedRouter.get('/', imagenController.getImagesByProduct);

/**
 * @swagger
 * /api/productos/{id_producto}/imagenes:
 *   post:
 *     summary: Añade una nueva imagen a un producto (Solo Administradores)
 *     tags: [Imagenes de Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del producto al que se añade la imagen.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoImagenInput'
 *     responses:
 *       201:
 *         description: Imagen añadida exitosamente.
 *       404:
 *         description: Producto no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
nestedRouter.post('/', [verifyToken, isAdmin], imagenController.addImageToProduct);

/**
 * @swagger
 * /api/productos/{id_producto}/imagenes/{id}:
 *   delete:
 *     summary: Elimina una imagen por su ID (Solo Administradores)
 *     tags: [Imagenes de Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID de la imagen a eliminar.
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente.
 *       404:
 *         description: Imagen no encontrada.
 *       403:
 *         description: Acceso denegado.
 */
nestedRouter.delete('/:id', [verifyToken, isAdmin], imagenController.deleteImage);

/**
 * @swagger
 * /api/productos/{id_producto}/imagenes/{id}/principal:
 *   put:
 *     summary: Establece una imagen como principal
 *     tags: [Imagenes de Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Imagen marcada como principal
 *       404:
 *         description: Imagen no encontrada
 *       403:
 *         description: Acceso denegado
 */
nestedRouter.put('/:id/principal', [verifyToken, isAdmin], imagenController.setPrincipal);

// Ruta de nivel superior para eliminar una imagen por su ID único
router.delete('/imagenes/:id', [verifyToken, isAdmin], imagenController.deleteImage);

export { router as imagenRoutes, nestedRouter as nestedImagenRoutes };