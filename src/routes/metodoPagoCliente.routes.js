import { Router } from 'express';
import metodoPagoClienteController from '../controllers/metodoPagoCliente.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Métodos de Pago Cliente
 *   description: API para la gestión de métodos de pago de los clientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MetodoPagoCliente:
 *       type: object
 *       properties:
 *         id_metodo_pago_cliente:
 *           type: integer
 *           description: ID autogenerado del método de pago del cliente
 *         id_cliente:
 *           type: integer
 *           description: ID del cliente propietario
 *         id_metodo_pago:
 *           type: integer
 *           description: ID del método de pago del sistema
 *         alias:
 *           type: string
 *           nullable: true
 *           description: Alias personalizado del cliente para este método
 *         numero_tarjeta_ultimos_4:
 *           type: string
 *           nullable: true
 *           maxLength: 4
 *           description: Últimos 4 dígitos de la tarjeta
 *         nombre_titular:
 *           type: string
 *           nullable: true
 *           description: Nombre del titular de la tarjeta
 *         fecha_expiracion:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha de expiración de la tarjeta
 *         tipo_tarjeta:
 *           type: string
 *           enum: [visa, mastercard, amex, discover, otro]
 *           nullable: true
 *           description: Tipo de tarjeta
 *         banco:
 *           type: string
 *           nullable: true
 *           description: Banco emisor
 *         numero_cuenta:
 *           type: string
 *           nullable: true
 *           description: Número de cuenta (encriptado)
 *         email_billetera:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Email asociado a billetera digital
 *         telefono_billetera:
 *           type: string
 *           nullable: true
 *           description: Teléfono asociado a billetera digital
 *         identificador_externo:
 *           type: string
 *           nullable: true
 *           description: ID en sistema externo de pagos
 *         token_pago:
 *           type: string
 *           nullable: true
 *           description: Token de pago encriptado
 *         proveedor_token:
 *           type: string
 *           nullable: true
 *           description: Proveedor del token de pago
 *         es_predeterminado:
 *           type: boolean
 *           description: Si es el método de pago predeterminado
 *         activo:
 *           type: boolean
 *           description: Estado del método de pago del cliente
 *         verificado:
 *           type: boolean
 *           description: Si el método de pago está verificado
 *         fecha_verificacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de verificación del método
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *         metodoPago:
 *           $ref: '#/components/schemas/MetodoPagoInfo'
 *       example:
 *         id_metodo_pago_cliente: 1
 *         id_cliente: 5
 *         id_metodo_pago: 1
 *         alias: "Mi Visa Principal"
 *         numero_tarjeta_ultimos_4: "1234"
 *         nombre_titular: "Juan Pérez"
 *         fecha_expiracion: "2025-12-01"
 *         tipo_tarjeta: "visa"
 *         banco: "Banco Nacional"
 *         es_predeterminado: true
 *         activo: true
 *         verificado: true
 *         fecha_verificacion: "2025-11-14T00:57:39.527Z"
 *         metodoPago:
 *           nombre_metodo: "Visa"
 *           tipo_metodo: "tarjeta_credito"
 *           icono_url: "/icons/visa.png"
 *     MetodoPagoInfo:
 *       type: object
 *       properties:
 *         nombre_metodo:
 *           type: string
 *         tipo_metodo:
 *           type: string
 *         descripcion:
 *           type: string
 *         icono_url:
 *           type: string
 *         requiere_verificacion:
 *           type: boolean
 *     MetodoPagoClienteCreate:
 *       type: object
 *       required:
 *         - id_metodo_pago
 *       properties:
 *         id_metodo_pago:
 *           type: integer
 *           description: ID del método de pago del sistema
 *         alias:
 *           type: string
 *           maxLength: 100
 *         numero_tarjeta_ultimos_4:
 *           type: string
 *           maxLength: 4
 *           pattern: '^[0-9]{4}$'
 *         nombre_titular:
 *           type: string
 *           maxLength: 255
 *         fecha_expiracion:
 *           type: string
 *           format: date
 *         tipo_tarjeta:
 *           type: string
 *           enum: [visa, mastercard, amex, discover, otro]
 *         banco:
 *           type: string
 *           maxLength: 100
 *         numero_cuenta:
 *           type: string
 *           maxLength: 255
 *         email_billetera:
 *           type: string
 *           format: email
 *           maxLength: 255
 *         telefono_billetera:
 *           type: string
 *           maxLength: 20
 *         identificador_externo:
 *           type: string
 *           maxLength: 255
 *         token_pago:
 *           type: string
 *           maxLength: 255
 *         proveedor_token:
 *           type: string
 *           maxLength: 50
 *         es_predeterminado:
 *           type: boolean
 *           default: false
 *         activo:
 *           type: boolean
 *           default: true
 *         verificado:
 *           type: boolean
 *           default: false
 *       example:
 *         id_metodo_pago: 1
 *         alias: "Mi tarjeta de trabajo"
 *         numero_tarjeta_ultimos_4: "5678"
 *         nombre_titular: "Juan Pérez"
 *         fecha_expiracion: "2026-08-31"
 *         tipo_tarjeta: "visa"
 *         banco: "Banco Santander"
 *         es_predeterminado: false
 */

/**
 * @swagger
 * /api/metodos-pago-cliente:
 *   get:
 *     summary: Obtiene los métodos de pago del cliente autenticado
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: verificado
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado verificado
 *       - in: query
 *         name: es_predeterminado
 *         schema:
 *           type: boolean
 *         description: Filtrar por método predeterminado
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del cliente
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
 *                         $ref: '#/components/schemas/MetodoPagoCliente'
 *             example:
 *               success: true
 *               data:
 *                 - id_metodo_pago_cliente: 1
 *                   alias: "Mi Visa Principal"
 *                   numero_tarjeta_ultimos_4: "1234"
 *                   es_predeterminado: true
 *                   verificado: true
 *                   metodoPago:
 *                     nombre_metodo: "Visa"
 *                     tipo_metodo: "tarjeta_credito"
 *                     icono_url: "/icons/visa.png"
 *       401:
 *         description: No autorizado - Token requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "Token de acceso requerido"
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
router.get('/', verifyToken, metodoPagoClienteController.getMetodosPagoByCliente);

/**
 * @swagger
 * /api/metodos-pago-cliente/predeterminado:
 *   get:
 *     summary: Obtiene el método de pago predeterminado del cliente
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Método de pago predeterminado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MetodoPagoCliente'
 *             example:
 *               success: true
 *               data:
 *                 id_metodo_pago_cliente: 5
 *                 alias: "Mi Visa Principal"
 *                 es_predeterminado: true
 *                 verificado: true
 *                 metodoPago:
 *                   nombre_metodo: "Visa"
 *                   icono_url: "/icons/visa.png"
 *       404:
 *         description: No tiene método de pago predeterminado configurado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: "No tienes un método de pago predeterminado configurado"
 *       401:
 *         description: No autorizado
 */
router.get('/predeterminado', verifyToken, metodoPagoClienteController.getDefaultMetodoPago);

/**
 * @swagger
 * /api/metodos-pago-cliente/{id}:
 *   get:
 *     summary: Obtiene un método de pago específico del cliente
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del método de pago del cliente
 *     responses:
 *       200:
 *         description: Detalle del método de pago del cliente
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: No tienes acceso a este método de pago
 *       401:
 *         description: No autorizado
 */
router.get('/:id', verifyToken, metodoPagoClienteController.getMetodoPagoClienteById);

/**
 * @swagger
 * /api/metodos-pago-cliente:
 *   post:
 *     summary: Agrega un nuevo método de pago al cliente autenticado
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MetodoPagoClienteCreate'
 *     responses:
 *       201:
 *         description: Método de pago agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MetodoPagoCliente'
 *             example:
 *               success: true
 *               message: "Método de pago agregado exitosamente"
 *               data:
 *                 id_metodo_pago_cliente: 15
 *                 alias: "Mi tarjeta de trabajo"
 *                 numero_tarjeta_ultimos_4: "5678"
 *                 es_predeterminado: false
 *                 verificado: false
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             examples:
 *               metodo_no_existe:
 *                 summary: Método de pago no encontrado
 *                 value:
 *                   success: false
 *                   message: "Método de pago no encontrado o inactivo"
 *               datos_invalidos:
 *                 summary: Datos requeridos faltantes
 *                 value:
 *                   success: false
 *                   message: "ID de método de pago es requerido"
 *       401:
 *         description: No autorizado - Token requerido
 */
router.post('/', verifyToken, metodoPagoClienteController.createMetodoPagoCliente);

/**
 * @swagger
 * /api/metodos-pago-cliente/{id}:
 *   put:
 *     summary: Actualiza un método de pago del cliente
 *     tags: [Métodos de Pago Cliente]
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
 *               alias:
 *                 type: string
 *               numero_tarjeta_ultimos_4:
 *                 type: string
 *                 maxLength: 4
 *               nombre_titular:
 *                 type: string
 *               fecha_expiracion:
 *                 type: string
 *                 format: date
 *               tipo_tarjeta:
 *                 type: string
 *                 enum: [visa, mastercard, amex, discover, otro]
 *               banco:
 *                 type: string
 *               numero_cuenta:
 *                 type: string
 *               email_billetera:
 *                 type: string
 *                 format: email
 *               telefono_billetera:
 *                 type: string
 *               es_predeterminado:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Método de pago actualizado
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: No tienes acceso a este método de pago
 *       401:
 *         description: No autorizado
 */
router.put('/:id', verifyToken, metodoPagoClienteController.updateMetodoPagoCliente);

/**
 * @swagger
 * /api/metodos-pago-cliente/{id}:
 *   delete:
 *     summary: Elimina un método de pago del cliente
 *     tags: [Métodos de Pago Cliente]
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
 *         description: Método de pago eliminado exitosamente
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: No tienes acceso a este método de pago
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', verifyToken, metodoPagoClienteController.deleteMetodoPagoCliente);

/**
 * @swagger
 * /api/metodos-pago-cliente/{id}/predeterminado:
 *   patch:
 *     summary: Establece un método de pago como predeterminado
 *     tags: [Métodos de Pago Cliente]
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
 *         description: Método de pago establecido como predeterminado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MetodoPagoCliente'
 *             example:
 *               success: true
 *               message: "Método de pago establecido como predeterminado"
 *               data:
 *                 id_metodo_pago_cliente: 3
 *                 alias: "Mi Mastercard"
 *                 es_predeterminado: true
 *       400:
 *         description: Error en la operación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             examples:
 *               ya_predeterminado:
 *                 summary: Ya es predeterminado
 *                 value:
 *                   success: false
 *                   message: "Este método de pago ya es el predeterminado"
 *               metodo_inactivo:
 *                 summary: Método inactivo
 *                 value:
 *                   success: false
 *                   message: "Método de pago del cliente no encontrado, inactivo o no pertenece al cliente"
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: No tienes acceso a este método de pago
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/predeterminado', verifyToken, metodoPagoClienteController.setAsDefault);

/**
 * @swagger
 * /api/metodos-pago-cliente/{id}/verificar:
 *   patch:
 *     summary: Verifica un método de pago del cliente
 *     tags: [Métodos de Pago Cliente]
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
 *         description: Método de pago verificado exitosamente
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: No tienes acceso a este método de pago
 *       401:
 *         description: No autorizado
 */
router.patch('/:id/verificar', verifyToken, metodoPagoClienteController.verifyMetodoPago);

// Rutas para administradores
/**
 * @swagger
 * /api/metodos-pago-cliente/admin/{idCliente}:
 *   get:
 *     summary: Obtiene métodos de pago de cualquier cliente (Solo Administradores)
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idCliente
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del cliente
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: verificado
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado verificado
 *       - in: query
 *         name: es_predeterminado
 *         schema:
 *           type: boolean
 *         description: Filtrar por método predeterminado
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del cliente
 *       403:
 *         description: Acceso denegado
 *       401:
 *         description: No autorizado
 */
router.get('/admin/:idCliente', [verifyToken, isAdmin], metodoPagoClienteController.getMetodosPagoByClienteAdmin);

/**
 * @swagger
 * /api/metodos-pago-cliente/admin/{id}/verificar:
 *   patch:
 *     summary: Verifica método de pago de cualquier cliente (Solo Administradores)
 *     tags: [Métodos de Pago Cliente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del método de pago del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idCliente
 *             properties:
 *               idCliente:
 *                 type: integer
 *                 description: ID del cliente propietario
 *     responses:
 *       200:
 *         description: Método de pago verificado exitosamente
 *       404:
 *         description: Método de pago no encontrado
 *       403:
 *         description: Acceso denegado
 *       401:
 *         description: No autorizado
 */
router.patch('/admin/:id/verificar', [verifyToken, isAdmin], metodoPagoClienteController.verifyMetodoPagoAdmin);

export default router;