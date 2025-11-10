import { Router } from 'express';
import interaccionesController from '../controllers/interacciones.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Interacciones de Cliente (CRM)
// GET /api/interacciones - Obtener todas
// GET /api/interacciones/:id - Obtener por ID
// GET /api/interacciones/cliente/:id_cliente - Obtener por cliente
// GET /api/interacciones/usuario/:id_usuario - Obtener por usuario responsable
// GET /api/interacciones/tipo/:tipo - Obtener por tipo (llamada/email/chat/reunión)
// POST /api/interacciones - Crear
// PUT /api/interacciones/:id - Actualizar
// PUT /api/interacciones/:id/completar - Marcar como completada
// DELETE /api/interacciones/:id - Eliminar

export default router;
