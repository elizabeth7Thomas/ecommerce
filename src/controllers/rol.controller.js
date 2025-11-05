import rolService from '../services/rol.service.js';
import * as response from '../utils/response.js';

const rolController = {
    // Obtener todos los roles
    async getAllRoles(req, res) {
        try {
            const roles = await rolService.getAllRoles();
            res.status(200).json(response.success(roles));
        } catch (error) {
            console.error('Error en getAllRoles:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    },

    // Obtener rol por ID
    async getRolById(req, res) {
        try {
            const { id } = req.params;
            const rol = await rolService.getRolById(id);
            
            if (!rol) {
                return res.status(404).json(response.notFound('Rol no encontrado'));
            }

            res.status(200).json(response.success(rol));
        } catch (error) {
            console.error('Error en getRolById:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    },

    // Crear nuevo rol (solo admin)
    async createRol(req, res) {
        try {
            const { nombre_rol, descripcion, permisos } = req.body;

            if (!nombre_rol) {
                return res.status(400).json(response.badRequest('El nombre del rol es requerido'));
            }

            const newRol = await rolService.createRol({
                nombre_rol,
                descripcion,
                permisos: permisos || {}
            });

            res.status(201).json(response.created(newRol, 'Rol creado exitosamente'));
        } catch (error) {
            console.error('Error en createRol:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    },

    // Actualizar rol (solo admin)
    async updateRol(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedRol = await rolService.updateRol(id, updates);

            res.status(200).json(response.success(updatedRol, 'Rol actualizado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            if (err.statusCode === 404) {
                return res.status(404).json(err);
            }
            console.error('Error en updateRol:', error);
            res.status(err.statusCode || 400).json(err);
        }
    },

    // Eliminar rol (desactivar) (solo admin)
    async deleteRol(req, res) {
        try {
            const { id } = req.params;
            const deletedRol = await rolService.deleteRol(id);

            res.status(200).json(response.noContent('Rol desactivado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            if (err.statusCode === 404) {
                return res.status(404).json(err);
            }
            console.error('Error en deleteRol:', error);
            res.status(err.statusCode || 500).json(err);
        }
    }
};

export default rolController;
