import usuarioService from '../services/usuario.service.js';
import * as response from '../utils/response.js';

class UsuarioController {
    // Método auxiliar para formatear usuario
    formatearUsuario(usuario) {
        if (!usuario) return null;
        
        const usuarioObj = usuario.toJSON ? usuario.toJSON() : usuario;
        
        return {
            id_usuario: usuarioObj.id_usuario,
            nombre_usuario: usuarioObj.nombre_usuario,
            correo_electronico: usuarioObj.correo_electronico,
            id_rol: usuarioObj.id_rol,
            activo: usuarioObj.activo,
            fecha_creacion: usuarioObj.fecha_creacion,
            ...(usuarioObj.rol && { rol: usuarioObj.rol })
        };
    }

    async getAllUsuarios(req, res) {
        try {
            const usuarios = await usuarioService.getAllUsuarios();
            const usuariosFormateados = usuarios.map(u => this.formatearUsuario(u));
            res.status(200).json(response.success(usuariosFormateados));
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
            const usuarioFormateado = this.formatearUsuario(usuario);
            res.status(200).json(response.success(usuarioFormateado));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async createUsuario(req, res) {
        try {
            const nuevoUsuario = await usuarioService.createUsuario(req.body);
            const usuarioFormateado = this.formatearUsuario(nuevoUsuario);
            res.status(201).json(response.created(usuarioFormateado, 'Usuario creado exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioActualizado = await usuarioService.updateUsuario(id, req.body);
            const usuarioFormateado = this.formatearUsuario(usuarioActualizado);
            res.status(200).json(response.success(usuarioFormateado, 'Usuario actualizado exitosamente'));
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