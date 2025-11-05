import usuarioService from '../services/usuario.service.js';

class UsuarioController {
    async getAllUsuarios(req, res) {
        try {
            const usuarios = await usuarioService.getAllUsuarios();
            res.status(200).json(usuarios);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getUsuarioById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuarioService.getUsuarioById(id);
            res.status(200).json(usuario);
        } catch (error) {
            // Si el servicio lanza 'Usuario no encontrado', respondemos con 404
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async createUsuario(req, res) {
        try {
            const nuevoUsuario = await usuarioService.createUsuario(req.body);
            res.status(201).json({ message: 'Usuario creado exitosamente', usuario: nuevoUsuario });
        } catch (error) {
            // Si es un error de duplicado, respondemos con 409 (Conflicto)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioActualizado = await usuarioService.updateUsuario(id, req.body);
            res.status(200).json({ message: 'Usuario actualizado exitosamente', usuario: usuarioActualizado });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            await usuarioService.deleteUsuario(id);
            res.status(200).json({ message: 'Usuario desactivado exitosamente' });
        } catch (error) {
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }
}

export default new UsuarioController();