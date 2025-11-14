import { Router } from 'express';
import metodoPagoController from '../controllers/metodoPago.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Métodos de Pago
 *   description: API para la gestión de métodos de pago del sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MetodoPago:
 *       type: object
 *       properties:
 *         id_metodo_pago:
 *           type: integer
 *           description: ID autogenerado del método de pago
 *         nombre_metodo:
 *           type: string
 *           description: Nombre del método de pago
 *         tipo_metodo:
 *           type: string
 *           enum: [tarjeta_credito, tarjeta_debito, transferencia_bancaria, billetera_digital, efectivo, cheque, criptomoneda]
 *           description: Tipo de método de pago
 *         descripcion:
 *           type: string
 *           description: Descripción del método de pago
 *         icono_url:
 *           type: string
 *           description: URL del icono del método de pago
 *         requiere_verificacion:
 *           type: boolean
 *           description: Si requiere verificación adicional
 *         comision_porcentaje:
 *           type: string
 *           description: Comisión en porcentaje (formato decimal)
 *         comision_fija:
 *           type: string
 *           description: Comisión fija (formato decimal)
 *         activo:
 *           type: boolean
 *           description: Estado del método de pago
 *         disponible_online:
 *           type: boolean
 *           description: Disponible para compras online
 *         disponible_tienda:
 *           type: boolean
 *           description: Disponible para compras en tienda
 *         orden_visualizacion:
 *           type: integer
 *           description: Orden de visualización en el frontend
 *         configuracion:
 *           type: object
 *           nullable: true
 *           description: Configuración específica del método de pago
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id_metodo_pago: 1
 *         nombre_metodo: "Visa"
 *         tipo_metodo: "tarjeta_credito"
 *         descripcion: "Tarjeta de crédito Visa"
 *         icono_url: "/icons/visa.png"
 *         requiere_verificacion: false
 *         comision_porcentaje: "2.90"
 *         comision_fija: "0.00"
 *         activo: true
 *         disponible_online: true
 *         disponible_tienda: true
 *         orden_visualizacion: 1
 *         configuracion: null
 *         fecha_creacion: "2025-11-14T00:57:39.527Z"
 *         fecha_actualizacion: "2025-11-14T00:57:39.527Z"
 *     MetodoPagoCreate:
 *       type: object
 *       required:
 *         - nombre_metodo
 *         - tipo_metodo
 *       properties:
 *         nombre_metodo:
 *           type: string
 *           description: Nombre del método de pago
 *         tipo_metodo:
 *           type: string
 *           enum: [tarjeta_credito, tarjeta_debito, transferencia_bancaria, billetera_digital, efectivo, cheque, criptomoneda]
 *         descripcion:
 *           type: string
 *         icono_url:
 *           type: string
 *         requiere_verificacion:
 *           type: boolean
 *           default: false
 *         comision_porcentaje:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         comision_fija:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         activo:
 *           type: boolean
 *           default: true
 *         disponible_online:
 *           type: boolean
 *           default: true
 *         disponible_tienda:
 *           type: boolean
 *           default: true
 *         orden_visualizacion:
 *           type: integer
 *           default: 0
 *         configuracion:
 *           type: object
 *       example:
 *         nombre_metodo: "Apple Pay"
 *         tipo_metodo: "billetera_digital"
 *         descripcion: "Pago mediante Apple Pay"
 *         icono_url: "/icons/applepay.png"
 *         requiere_verificacion: true
 *         comision_porcentaje: 2.5
 *         comision_fija: 0
 *         disponible_online: true
 *         disponible_tienda: false
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la operación fue exitosa
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del resultado
 *         data:
 *           description: Datos de respuesta (puede ser objeto, array o null)
 *       example:
 *         success: true
 *         message: "Operación exitosa"
 *         data: {}
 */

/**
 * @swagger
 * /api/metodos-pago:
 *   get:
 *     summary: Obtiene todos los métodos de pago
 *     tags: [Métodos de Pago]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: disponible_online
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad online
 *       - in: query
 *         name: disponible_tienda
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad en tienda
 *       - in: query
 *         name: tipo_metodo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de método
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Buscar por nombre (búsqueda parcial)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: orden_visualizacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Dirección del orden
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MetodoPago'
 *             example:
 *               success: true
 *               data:
 *                 - id_metodo_pago: 1
 *                   nombre_metodo: "Visa"
 *                   tipo_metodo: "tarjeta_credito"
 *                   activo: true
 *                   disponible_online: true
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "Error interno del servidor"
 */
router.get('/', metodoPagoController.getAllMetodosPago);

/**
 * @swagger
 * /api/metodos-pago/activos:
 *   get:
 *     summary: Obtiene solo métodos de pago activos
 *     tags: [Métodos de Pago]
 *     parameters:
 *       - in: query
 *         name: disponible_online
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad online
 *       - in: query
 *         name: disponible_tienda
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad en tienda
 *       - in: query
 *         name: tipo_metodo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de método
 *     responses:
 *       200:
 *         description: Lista de métodos de pago activos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MetodoPago'
 *             example:
 *               success: true
 *               data:
 *                 - id_metodo_pago: 1
 *                   nombre_metodo: "Visa"
 *                   activo: true
 *                   disponible_online: true
 */
router.get('/activos', metodoPagoController.getActiveMetodosPago);

/**
 * @swagger
 * /api/metodos-pago/online:
 *   get:
 *     summary: Obtiene métodos de pago disponibles online
 *     tags: [Métodos de Pago]
 *     responses:
 *       200:
 *         description: Lista de métodos de pago disponibles online
 */
router.get('/online', metodoPagoController.getOnlineMetodosPago);

/**
 * @swagger
 * /api/metodos-pago/tienda:
 *   get:
 *     summary: Obtiene métodos de pago disponibles en tienda
 *     tags: [Métodos de Pago]
 *     responses:
 *       200:
 *         description: Lista de métodos de pago disponibles en tienda
 */
router.get('/tienda', metodoPagoController.getStoreMetodosPago);

/**
 * @swagger
 * /api/metodos-pago/tipo/{tipo}:
 *   get:
 *     summary: Obtiene métodos de pago por tipo
 *     tags: [Métodos de Pago]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [tarjeta_credito, tarjeta_debito, transferencia_bancaria, billetera_digital, efectivo, cheque, criptomoneda]
 *         required: true
 *         description: Tipo de método de pago
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del tipo especificado
 */
router.get('/tipo/:tipo', metodoPagoController.getMetodosPagoByTipo);

/**
 * @swagger
 * /api/metodos-pago/{id}:
 *   get:
 *     summary: Obtiene un método de pago por ID
 *     tags: [Métodos de Pago]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del método de pago
 *     responses:
 *       200:
 *         description: Detalle del método de pago
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MetodoPago'
 *             example:
 *               success: true
 *               data:
 *                 id_metodo_pago: 1
 *                 nombre_metodo: "Visa"
 *                 tipo_metodo: "tarjeta_credito"
 *                 activo: true
 *       404:
 *         description: Método de pago no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "Método de pago no encontrado"
 */
router.get('/:id', metodoPagoController.getMetodoPagoById);

/**
 * @swagger
 * /api/metodos-pago:
 *   post:
 *     summary: Crea un nuevo método de pago (Solo Administradores)
 *     tags: [Métodos de Pago]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MetodoPagoCreate'
 *     responses:
 *       201:
 *         description: Método de pago creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MetodoPago'
 *             example:
 *               success: true
 *               message: "Método de pago creado exitosamente"
 *               data:
 *                 id_metodo_pago: 9
 *                 nombre_metodo: "Apple Pay"
 *                 tipo_metodo: "billetera_digital"
 *                 activo: true
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "Ya existe un método de pago con ese nombre"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado - Se requiere rol de administrador
 */
router.post('/', [verifyToken, isAdmin], metodoPagoController.createMetodoPago);

/**
 * @swagger
 * /api/metodos-pago/{id}:
 *   put:
 *     summary: Actualiza un método de pago (Solo Administradores)
 *     tags: [Métodos de Pago]
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
 *               nombre_metodo:
 *                 type: string
 *               tipo_metodo:
 *                 type: string
 *                 enum: [tarjeta_credito, tarjeta_debito, transferencia_bancaria, billetera_digital, efectivo, cheque, criptomoneda]
 *               descripcion:
 *                 type: string
 *               icono_url:
 *                 type: string
 *               requiere_verificacion:
 *                 type: boolean
 *               comision_porcentaje:
 *                 type: number
 *               comision_fija:
 *                 type: number
 *               activo:
 *                 type: boolean
 *               disponible_online:
 *                 type: boolean
 *               disponible_tienda:
 *                 type: boolean
 *               orden_visualizacion:
 *                 type: integer
 *               configuracion:
 *                 type: object
 *     responses:
 *       200:
 *         description: Método de pago actualizado
 *       404:
 *         description: Método de pago no encontrado
 */
router.put('/:id', [verifyToken, isAdmin], metodoPagoController.updateMetodoPago);

/**
 * @swagger
 * /api/metodos-pago/{id}:
 *   delete:
 *     summary: Desactiva un método de pago (Solo Administradores)
 *     tags: [Métodos de Pago]
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
 *         description: Método de pago desactivado
 *       404:
 *         description: Método de pago no encontrado
 */
router.delete('/:id', [verifyToken, isAdmin], metodoPagoController.deleteMetodoPago);

/**
 * @swagger
 * /api/metodos-pago/{id}/activar:
 *   patch:
 *     summary: Activa un método de pago (Solo Administradores)
 *     tags: [Métodos de Pago]
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
 *         description: Método de pago activado
 *       404:
 *         description: Método de pago no encontrado
 */
router.patch('/:id/activar', [verifyToken, isAdmin], metodoPagoController.activateMetodoPago);

/**
 * @swagger
 * /api/metodos-pago/{id}/configuracion:
 *   patch:
 *     summary: Actualiza la configuración de un método de pago (Solo Administradores)
 *     tags: [Métodos de Pago]
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
 *             required:
 *               - configuracion
 *             properties:
 *               configuracion:
 *                 type: object
 *                 description: Configuración específica del método de pago
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       404:
 *         description: Método de pago no encontrado
 */
router.patch('/:id/configuracion', [verifyToken, isAdmin], metodoPagoController.updateConfiguracion);

export default router;