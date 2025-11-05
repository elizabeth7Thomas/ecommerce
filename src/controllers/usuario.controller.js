import usuarioService from '../services/usuario.service.js';
import * as response from '../utils/response.js';

class UsuarioController {
    async getAllUsuarios(req, res) {
        try {
            const usuarios = await usuarioService.getAllUsuarios();
            res.status(200).json(response.success(usuarios));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async getUsuarioById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuarioService.getUsuarioById(id);
            if (!usuario) {
                return res.status(404).json(response.notFound('Usuario no encontrado'));
            }
            res.status(200).json(response.success(usuario));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async createUsuario(req, res) {
        try {
            const nuevoUsuario = await usuarioService.createUsuario(req.body);
            res.status(201).json(response.created(nuevoUsuario, 'Usuario creado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioActualizado = await usuarioService.updateUsuario(id, req.body);
            res.status(200).json(response.success(usuarioActualizado, 'Usuario actualizado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            await usuarioService.deleteUsuario(id);
            res.status(200).json(response.noContent('Usuario desactivado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
}

export default new UsuarioController();