import { Router } from 'express';
import productoController from '../controllers/product.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';
import { nestedImagenRoutes } from './imagen.routes.js'; // <-- Importa la ruta anidada

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoriaProducto:
 *       type: object
 *       properties:
 *         id_categoria:
 *           type: integer
 *         nombre_categoria:
 *           type: string
 *         descripcion:
 *           type: string
 *         activo:
 *           type: boolean
 *
 *     ProductoImagen:
 *       type: object
 *       properties:
 *         id_imagen:
 *           type: integer
 *         id_producto:
 *           type: integer
 *         url_imagen:
 *           type: string
 *           format: uri
 *         es_principal:
 *           type: boolean
 *
 *     Producto:
 *       type: object
 *       properties:
 *         id_producto:
 *           type: integer
 *           description: El ID autogenerado del producto
 *         id_categoria:
 *           type: integer
 *           description: El ID de la categoría
 *         nombre_producto:
 *           type: string
 *           description: El nombre del producto
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del producto
 *         precio:
 *           type: number
 *           format: double
 *           description: El precio del producto
 *         stock:
 *           type: integer
 *           description: La cantidad disponible en inventario
 *         activo:
 *           type: boolean
 *           description: Indica si el producto está disponible
 *         categoria:
 *           $ref: '#/components/schemas/CategoriaProducto'
 *           description: Categoría del producto (alias correcto)
 *         imagenes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductoImagen'
 *           description: Imágenes del producto (alias correcto)
 *       example:
 *         id_producto: 1
 *         id_categoria: 1
 *         nombre_producto: "Laptop Gaming Pro"
 *         descripcion: "Laptop con procesador Intel i7, 16GB RAM, 512GB SSD"
 *         precio: 1299.99
 *         stock: 10
 *         activo: true
 *         categoria:
 *           id_categoria: 1
 *           nombre_categoria: "Electrónica"
 *           descripcion: "Equipos electrónicos"
 *         imagenes:
 *           - id_imagen: 1
 *             url_imagen: "https://cdn.example.com/producto1.jpg"
 *             es_principal: true
 *         Categoria_Producto:
 *           nombre_categoria: "Electrónica"
 *
 *     ProductoInput:
 *       type: object
 *       required:
 *         - id_categoria
 *         - nombre_producto
 *         - precio
 *         - stock
 *       properties:
 *         id_categoria:
 *           type: integer
 *         nombre_producto:
 *           type: string
 *         descripcion:
 *           type: string
 *         precio:
 *           type: number
 *           format: float
 *         stock:
 *           type: integer
 */

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: API para la gestión de productos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Retorna la lista de todos los productos activos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: La lista de productos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */
router.get('/', productoController.getAllProductos);

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtiene un producto por su ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del producto.
 *     responses:
 *       200:
 *         description: Detalles del producto.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado.
 */
router.get('/:id', productoController.getProductoById);

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crea un nuevo producto (Solo Administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoInput'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *       400:
 *         description: Datos inválidos (ej. categoría no existe).
 *       403:
 *         description: Acceso denegado.
 */
router.post('/', [verifyToken, isAdmin], productoController.createProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualiza un producto existente (Solo Administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del producto a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductoInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente.
 *       404:
 *         description: Producto no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
router.put('/:id', [verifyToken, isAdmin], productoController.updateProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Desactiva un producto (eliminación lógica) (Solo Administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del producto a desactivar.
 *     responses:
 *       200:
 *         description: Producto desactivado exitosamente.
 *       404:
 *         description: Producto no encontrado.
 *       403:
 *         description: Acceso denegado.
 */
router.delete('/:id', [verifyToken, isAdmin], productoController.deleteProducto);

// Monta las rutas anidadas de imágenes bajo un producto específico
router.use('/:id_producto/imagenes', nestedImagenRoutes);

export default router;