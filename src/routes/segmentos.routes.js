import { Router } from 'express';
import segmentosController from '../controllers/segmentos.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Segmentos de Cliente (CRM)
// GET /api/segmentos - Obtener todos
// GET /api/segmentos/:id - Obtener por ID
// GET /api/segmentos/cliente/:id_cliente - Obtener segmentos de un cliente
// GET /api/segmentos/activos - Obtener segmentos activos
// POST /api/segmentos - Crear
// POST /api/segmentos/:id/clientes - Agregar clientes a segmento
// PUT /api/segmentos/:id - Actualizar
// PUT /api/segmentos/:id/activar - Activar segmento
// PUT /api/segmentos/:id/desactivar - Desactivar segmento
// DELETE /api/segmentos/:id - Eliminar
// DELETE /api/segmentos/:id/clientes/:id_cliente - Remover cliente de segmento

export default router;
