import { Router } from 'express';
import ordenesCompraDetalleController from '../controllers/ordenesCompraDetalle.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Detalles de Órdenes de Compra
// GET /api/ordenes-compra-detalle - Obtener todos
// GET /api/ordenes-compra-detalle/:id - Obtener por ID
// GET /api/ordenes-compra-detalle/orden/:id_orden - Obtener por orden de compra
// GET /api/ordenes-compra-detalle/producto/:id_producto - Obtener por producto
// POST /api/ordenes-compra-detalle - Crear
// POST /api/ordenes-compra-detalle/orden/:id_orden - Crear múltiples para una orden
// PUT /api/ordenes-compra-detalle/:id - Actualizar
// PUT /api/ordenes-compra-detalle/:id/recibido - Registrar cantidad recibida
// DELETE /api/ordenes-compra-detalle/:id - Eliminar

export default router;
