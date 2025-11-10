import { Router } from 'express';
import campanasController from '../controllers/campanas.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Campañas de Marketing
// GET /api/campanas - Obtener todas
// GET /api/campanas/:id - Obtener por ID
// GET /api/campanas/estado/:estado - Obtener por estado (planificación/activa/pausada/finalizada)
// GET /api/campanas/tipo/:tipo - Obtener por tipo (email/sms/social/descuento)
// GET /api/campanas/:id/resultados - Obtener resultados/métricas
// POST /api/campanas - Crear
// PUT /api/campanas/:id - Actualizar
// PUT /api/campanas/:id/activar - Activar campaña
// PUT /api/campanas/:id/pausar - Pausar campaña
// PUT /api/campanas/:id/finalizar - Finalizar campaña
// DELETE /api/campanas/:id - Eliminar

export default router;
