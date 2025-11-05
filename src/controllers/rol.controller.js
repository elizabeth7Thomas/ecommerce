import rolService from '../services/rol.service.js';

const rolController = {
    // Obtener todos los roles
    async getAllRoles(req, res) {
        try {
            const roles = await rolService.getAllRoles();
            res.json(roles);
        } catch (error) {
            console.error('Error en getAllRoles:', error);
            res.status(500).json({ 
                error: 'Error al obtener roles' 
            });
        }
    },

    // Obtener rol por ID
    async getRolById(req, res) {
        try {
            const { id } = req.params;
            const rol = await rolService.getRolById(id);
            
            if (!rol) {
                return res.status(404).json({ 
                    error: 'Rol no encontrado' 
                });
            }

            res.json(rol);
        } catch (error) {
            console.error('Error en getRolById:', error);
            res.status(500).json({ 
                error: 'Error al obtener rol' 
            });
        }
    },

    // Crear nuevo rol (solo admin)
    async createRol(req, res) {
        try {
            const { nombre_rol, descripcion, permisos } = req.body;

            if (!nombre_rol) {
                return res.status(400).json({ 
                    error: 'El nombre del rol es requerido' 
                });
            }

            const newRol = await rolService.createRol({
                nombre_rol,
                descripcion,
                permisos: permisos || {}
            });

            res.status(201).json({
                message: 'Rol creado exitosamente',
                rol: newRol
            });
        } catch (error) {
            console.error('Error en createRol:', error);
            res.status(400).json({ 
                error: error.message || 'Error al crear rol' 
            });
        }
    },

    // Actualizar rol (solo admin)
    async updateRol(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedRol = await rolService.updateRol(id, updates);

            if (!updatedRol) {
                return res.status(404).json({ 
                    error: 'Rol no encontrado' 
                });
            }

            res.json({
                message: 'Rol actualizado exitosamente',
                rol: updatedRol
            });
        } catch (error) {
            console.error('Error en updateRol:', error);
            res.status(400).json({ 
                error: error.message || 'Error al actualizar rol' 
            });
        }
    },

    // Eliminar rol (desactivar) (solo admin)
    async deleteRol(req, res) {
        try {
            const { id } = req.params;
            const deletedRol = await rolService.deleteRol(id);

            if (!deletedRol) {
                return res.status(404).json({ 
                    error: 'Rol no encontrado' 
                });
            }

            res.json({
                message: 'Rol desactivado exitosamente'
            });
        } catch (error) {
            console.error('Error en deleteRol:', error);
            res.status(500).json({ 
                error: 'Error al eliminar rol' 
            });
        }
    }
};

export default rolController;
