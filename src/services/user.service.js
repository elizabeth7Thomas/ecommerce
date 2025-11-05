import { Usuario, Rol } from '../models/index.js';

class UserService {
  async createUser(data) {
    return Usuario.create(data);
  }

  async getUserById(id) {
    return Usuario.findByPk(id, {
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id_rol', 'nombre_rol', 'descripcion', 'permisos']
      }]
    });
  }

  async getUserByEmail(email) {
    return Usuario.findOne({ 
      where: { correo_electronico: email },
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id_rol', 'nombre_rol', 'descripcion', 'permisos']
      }]
    });
  }

  async updateUser(id, updates) {
    const user = await Usuario.findByPk(id);
    if (!user) throw new Error('Usuario no encontrado');
    await user.update(updates);
    return user;
  }

  async disableUser(id) {
    const user = await Usuario.findByPk(id);
    if (!user) throw new Error('Usuario no encontrado');
    user.activo = false;
    await user.save();
    return user;
  }
}

export default new UserService();
