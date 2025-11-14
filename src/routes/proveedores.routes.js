import { Router } from 'express';
import proveedoresController from '../controllers/proveedores.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

 // opcional, si usas auth

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: Gestión de proveedores del sistema
 */

// Crear un proveedor
router.post('/', verifyToken, proveedoresController.create);

// Obtener todos los proveedores (puedes usar filtros como ?activo=true&search=texto)
router.get('/', verifyToken, proveedoresController.getAll);

// Obtener un proveedor por ID
router.get('/:id', verifyToken, proveedoresController.getById);

// Actualizar proveedor
router.put('/:id', verifyToken, proveedoresController.update);

// Activar/desactivar proveedor
router.patch('/:id/toggle', verifyToken, proveedoresController.toggleActive);

// Eliminar proveedor (soft delete por defecto, o ?hard=true para eliminar completamente)
router.delete('/:id', verifyToken, proveedoresController.delete);

// Estadísticas
router.get('/stats/info', verifyToken, proveedoresController.getStats);

export default router;
