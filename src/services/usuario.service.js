import Usuario from '../models/user.model.js';

class UsuarioService {
    /**
     * Obtiene todos los usuarios excluyendo la contraseña.
     * @returns {Promise<Array>} Lista de usuarios.
     */
    async getAllUsuarios() {
        try {
            const usuarios = await Usuario.findAll({
                attributes: { exclude: ['contrasena'] } // Excluimos el campo contraseña
            });
            return usuarios;
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    /**
     * Obtiene un usuario por su ID.
     * @param {number} id - El ID del usuario.
     * @returns {Promise<Object>} El usuario encontrado.
     */
    async getUsuarioById(id) {
        try {
            const usuario = await Usuario.findByPk(id, {
                attributes: { exclude: ['contrasena'] }
            });
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            return usuario;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crea un nuevo usuario. La contraseña se hashea automáticamente por el hook del modelo.
     * @param {Object} userData - Los datos del usuario a crear.
     * @returns {Promise<Object>} El usuario creado.
     */
    async createUsuario(userData) {
        try {
            const nuevoUsuario = await Usuario.create(userData);
            // El hook 'afterCreate' no es ideal para esto, mejor lo hacemos explícito.
            const usuarioJSON = nuevoUsuario.toJSON();
            delete usuarioJSON.contrasena;
            return usuarioJSON;
        } catch (error) {
            // Manejo de errores de validación de Sequelize
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('El nombre de usuario o correo electrónico ya existe.');
            }
            throw new Error(`Error al crear el usuario: ${error.message}`);
        }
    }

    /**
     * Actualiza un usuario por su ID.
     * @param {number} id - El ID del usuario a actualizar.
     * @param {Object} updateData - Los datos para actualizar.
     * @returns {Promise<Object>} El usuario actualizado.
     */
    async updateUsuario(id, updateData) {
        try {
            const usuario = await this.getUsuarioById(id); // Reutilizamos para verificar que existe

            // No permitir que se actualice la contraseña desde este método.
            // La contraseña debería tener su propio endpoint/servicio (ej: /change-password)
            if (updateData.contrasena) {
                delete updateData.contrasena;
            }

            await usuario.update(updateData);
            return usuario;
        } catch (error) {
            throw error;
        }
    }

    /**
     * "Elimina" un usuario (eliminación lógica).
     * @param {number} id - El ID del usuario a desactivar.
     * @returns {Promise<boolean>} True si se desactivó correctamente.
     */
    async deleteUsuario(id) {
        try {
            const usuario = await this.getUsuarioById(id);
            // Eliminación lógica: cambiamos el estado a inactivo
            await usuario.update({ activo: false });
            return true;
        } catch (error) {
            throw error;
        }
    }
}

export default new UsuarioService();