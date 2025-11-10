import { Router } from 'express';
import tareasController from '../controllers/tareas.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas para Tareas CRM
// GET /api/tareas - Obtener todas
// GET /api/tareas/:id - Obtener por ID
// GET /api/tareas/usuario/:id_usuario - Obtener por usuario asignado
// GET /api/tareas/cliente/:id_cliente - Obtener por cliente
// GET /api/tareas/estado/:estado - Obtener por estado (pendiente/en progreso/completada/cancelada)
// GET /api/tareas/prioridad/:prioridad - Obtener por prioridad (baja/media/alta/urgente)
// POST /api/tareas - Crear
// PUT /api/tareas/:id - Actualizar
// PUT /api/tareas/:id/estado - Cambiar estado
// PUT /api/tareas/:id/completar - Marcar como completada
// PUT /api/tareas/:id/asignar - Reasignar tarea
// DELETE /api/tareas/:id - Eliminar

export default router;
