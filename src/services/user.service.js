import { Usuario, Rol } from '../models/index.js';
import bcrypt from 'bcrypt';

class UserService {
  /**
   * Obtiene todos los usuarios con sus roles
   */
  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 50, activo = true } = options;
      const offset = (page - 1) * limit;

      const { count, rows } = await Usuario.findAndCountAll({
        where: { activo },
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol', 'permisos']
        }],
        attributes: { exclude: ['contrasena'] },
        limit: parseInt(limit),
        offset: offset
      });

      return {
        usuarios: rows,
        total: count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * Obtiene usuario por ID
   */
  async getUserById(id) {
    try {
      const usuario = await Usuario.findByPk(id, {
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol', 'descripcion', 'permisos']
        }],
        attributes: { exclude: ['contrasena'] }
      });
      
      if (!usuario) throw new Error('Usuario no encontrado');
      return usuario;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene usuario por email
   */
  async getUserByEmail(email) {
    try {
      return Usuario.findOne({ 
        where: { correo_electronico: email },
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol', 'descripcion', 'permisos']
        }]
      });
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  /**
   * Crea nuevo usuario
   */
  async createUser(data) {
    try {
      if (!data.correo_electronico || !data.contrasena) {
        throw new Error('Email y contraseña son requeridos');
      }

      const usuario = await Usuario.create(data);
      const usuarioJSON = usuario.toJSON();
      delete usuarioJSON.contrasena;
      return usuarioJSON;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('El email o nombre de usuario ya existe');
      }
      throw error;
    }
  }

  /**
   * Actualiza usuario (sin tocar contraseña)
   */
  async updateUser(id, updates) {
    try {
      const usuario = await this.getUserById(id);
      
      // Evitar actualización de contraseña
      if (updates.contrasena) {
        delete updates.contrasena;
      }
      
      await usuario.update(updates);
      return usuario;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desactiva usuario (soft delete)
   */
  async disableUser(id) {
    try {
      const usuario = await this.getUserById(id);
      await usuario.update({ activo: false });
      return usuario;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activa usuario
   */
  async enableUser(id) {
    try {
      const usuario = await this.getUserById(id);
      await usuario.update({ activo: true });
      return usuario;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia contraseña de usuario
   */
  async changePassword(id, passwordActual, passwordNueva) {
    try {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) throw new Error('Usuario no encontrado');

      const passwordValida = await bcrypt.compare(passwordActual, usuario.contrasena);
      if (!passwordValida) throw new Error('Contraseña actual incorrecta');

      usuario.contrasena = passwordNueva; // El hook del modelo hasheará
      await usuario.save();
      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
