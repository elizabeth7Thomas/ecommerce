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
    if (!rol) throw new Error('Rol no encontrado');
    await rol.update(updates);
    return rol;
  }

  async deleteRol(id) {
    const rol = await Rol.findByPk(id);
    if (!rol) throw new Error('Rol no encontrado');
    rol.activo = false;
    await rol.save();
    return rol;
  }
}

export default new RolService();
