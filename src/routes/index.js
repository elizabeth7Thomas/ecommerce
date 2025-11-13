import { Router } from 'express';
import authRoutes from './auth.routes.js';
import rolRoutes from './rol.routes.js';
import usuarioRoutes from './usuario.routes.js';
import productRoutes from './product.routes.js';
import categoriaRoutes from './categoria.routes.js';
import clienteRoutes from './cliente.routes.js';
import direccionRoutes from './direccion.routes.js';
import carritoRoutes from './carrito.routes.js';
import ordenRoutes from './orden.routes.js';
import campanasMarketingRoutes from './campanasMarketing.routes.js';
import cotizacionesRoutes from './cotizaciones.routes.js';
import devolucionesRoutes from './devoluciones.routes.js';
import proveedoresRoutes from './proveedores.routes.js';
import almacenesRoutes from './almacenes.routes.js';

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
 *   - name: Usuarios
 *     description: Gestión de usuarios del sistema
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
 *   - name: Cotizaciones
 *     description: Gestión de cotizaciones de ventas
 *   - name: Devoluciones
 *     description: Gestión de devoluciones y reembolsos de órdenes
 */

// Montar todas las rutas
router.use('/auth', authRoutes);
router.use('/almacenes', almacenesRoutes);
router.use('/roles', rolRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/productos', productRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/clientes', clienteRoutes);
router.use('/direcciones', direccionRoutes);
router.use('/carrito', carritoRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/campanas-marketing', campanasMarketingRoutes);
router.use('/cotizaciones', cotizacionesRoutes);
router.use('/devoluciones', devolucionesRoutes);
router.use('/proveedores', proveedoresRoutes);

export default router;