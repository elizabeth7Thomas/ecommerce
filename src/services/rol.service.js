import { Rol } from '../models/index.js';

class RolService {
  async getAllRoles() {
    return Rol.findAll({
      where: { activo: true },
      attributes: ['id_rol', 'nombre_rol', 'descripcion', 'permisos']
    });
  }

  async getRolById(id) {
    return Rol.findByPk(id);
  }

  async getRolByNombre(nombre) {
    return Rol.findOne({ 
      where: { nombre_rol: nombre, activo: true } 
    });
  }

  async createRol(data) {
    return Rol.create(data);
  }

  async updateRol(id, updates) {
    const rol = await Rol.findByPk(id);
    if (!rol) return null;
    await rol.update(updates);
    return rol;
  }

  async deleteRol(id) {
    const rol = await Rol.findByPk(id);
    if (!rol) return null;
    rol.activo = false;
    await rol.save();
    return rol;
  }
}

export default new RolService();
