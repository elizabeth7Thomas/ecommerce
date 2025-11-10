import UserService from '../services/user.service.js';
import response from '../utils/response.js';

class UsuarioController {
  // CREATE
  async createUsuario(req, res) {
    try {
      const { nombre_usuario, correo_electronico, contrasena, id_rol } = req.body;

      if (!nombre_usuario || !correo_electronico || !contrasena) {
        return response.badRequest(res, 'Nombre de usuario, email y contraseña son requeridos');
      }

      const usuario = await UserService.createUser({
        nombre_usuario,
        correo_electronico,
        contrasena,
        id_rol
      });

      return response.created(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ - Todos los usuarios
  async getAllUsuarios(req, res) {
    try {
      const { page, limit, activo } = req.query;

      const usuarios = await UserService.getAllUsers({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        activo: activo !== 'false' // Por defecto true
      });

      return response.success(res, usuarios);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ - Por ID
  async getUsuarioById(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UserService.getUserById(id);
      if (!usuario) {
        return response.notFound(res, 'Usuario no encontrado');
      }

      return response.success(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // READ - Por email
  async getUsuarioByEmail(req, res) {
    try {
      const { email } = req.params;

      const usuario = await UserService.getUserByEmail(email);
      if (!usuario) {
        return response.notFound(res, 'Usuario no encontrado');
      }

      return response.success(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE
  async updateUsuario(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Evitar actualización de ciertos campos sensibles
      delete updateData.contrasena; // La contraseña se cambia con otro endpoint
      delete updateData.id_usuario;

      const usuario = await UserService.updateUser(id, updateData);
      return response.success(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE - Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { passwordActual, passwordNueva } = req.body;

      if (!passwordActual || !passwordNueva) {
        return response.badRequest(res, 'Contraseña actual y nueva son requeridas');
      }

      if (passwordNueva.length < 6) {
        return response.badRequest(res, 'La nueva contraseña debe tener al menos 6 caracteres');
      }

      const result = await UserService.changePassword(id, passwordActual, passwordNueva);
      return response.success(res, result);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE - Desactivar usuario
  async disableUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UserService.disableUser(id);
      return response.success(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // UPDATE - Activar usuario
  async enableUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await UserService.enableUser(id);
      return response.success(res, usuario);
    } catch (error) {
      return response.handleError(res, error);
    }
  }

  // DELETE - Eliminación física (requiere admin)
  async deleteUsuario(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.badRequest(res, 'El ID del usuario es requerido');
      }

      const usuario = await UserService.getUserById(id);
      if (!usuario) {
        return response.notFound(res, 'Usuario no encontrado');
      }

      // Verificar que no sea el último administrador
      if (usuario.rol && usuario.rol.nombre_rol === 'administrador') {
        const adminCount = await Usuario.count({ 
          where: { id_rol: usuario.id_rol, activo: true } 
        });
        if (adminCount <= 1) {
          return response.badRequest(res, 'No se puede eliminar el último administrador del sistema');
        }
      }

      await usuario.destroy();
      return response.noContent(res);
    } catch (error) {
      return response.handleError(res, error);
    }
  }
}

export default new UsuarioController();