import { Router } from 'express';
import authRoutes from './auth.routes.js';
import rolRoutes from './rol.routes.js';
import productRoutes from './product.routes.js';
import { imagenRoutes } from './imagen.routes.js';
import categoriaRoutes from './categoria.routes.js';
import clienteRoutes from './cliente.routes.js';
import direccionRoutes from './direccion.routes.js';
import carritoRoutes from './carrito.routes.js';
import ordenRoutes from './orden.routes.js';
import { paymentRoutes } from './payment.routes.js';
import campanasMarketingRoutes from './campanasMarketing.routes.js';

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Ingresa el token JWT obtenido al iniciar sesión
 */

/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Registro, login y gestión de perfil de usuarios
 *   - name: Roles
 *     description: Gestión de roles y permisos de usuarios
 *   - name: Productos
 *     description: Gestión de productos del catálogo
 *   - name: Imágenes
 *     description: Gestión de imágenes de productos
 *   - name: Categorías
 *     description: Gestión de categorías de productos
 *   - name: Clientes
 *     description: Gestión de perfiles de clientes
 *   - name: Direcciones
 *     description: Gestión de direcciones de envío
 *   - name: Carrito
 *     description: Gestión del carrito de compras
 *   - name: Órdenes
 *     description: Gestión de órdenes de compra
 *   - name: Pagos
 *     description: Gestión de pagos de órdenes
 *   - name: Campañas Marketing
 *     description: Gestión de campañas de marketing y promociones
 */

// Montar todas las rutas
router.use('/auth', authRoutes);
router.use('/roles', rolRoutes);
router.use('/productos', productRoutes);
router.use('/imagenes', imagenRoutes); // Ruta de nivel superior (si existe)
router.use('/categorias', categoriaRoutes);
router.use('/clientes', clienteRoutes);
router.use('/direcciones', direccionRoutes);
router.use('/carrito', carritoRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/pagos', paymentRoutes); // Ruta de nivel superior (si existe)
router.use('/campanas-marketing', campanasMarketingRoutes);

export default router;
