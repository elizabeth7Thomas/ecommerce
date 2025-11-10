import { Router } from 'express';
import oportunidadesController from '../controllers/oportunidades.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Oportunidades de Venta (CRM)
// GET /api/oportunidades - Obtener todas
// GET /api/oportunidades/:id - Obtener por ID
// GET /api/oportunidades/cliente/:id_cliente - Obtener por cliente
// GET /api/oportunidades/usuario/:id_usuario - Obtener por usuario responsable
// GET /api/oportunidades/estado/:estado - Obtener por estado (prospecto/calificado/negociación/propuesta/ganada/perdida)
// GET /api/oportunidades/etapa/:etapa - Obtener por etapa
// POST /api/oportunidades - Crear
// PUT /api/oportunidades/:id - Actualizar
// PUT /api/oportunidades/:id/estado - Cambiar estado
// PUT /api/oportunidades/:id/etapa - Cambiar etapa
// DELETE /api/oportunidades/:id - Eliminar

export default router;
