import Proveedores from '../models/proveedores.model.js';
import { Op } from 'sequelize';

class ProveedoresService {
  // Crear un nuevo proveedor
  async create(data) {
    const { nombre_proveedor, nit } = data;

    // Verificar duplicados
    const where = {
      [Op.or]: []
    };

    if (nombre_proveedor) where[Op.or].push({ nombre_proveedor });
    if (nit) where[Op.or].push({ nit });

    if (where[Op.or].length > 0) {
      const proveedorExistente = await Proveedores.findOne({ where });

      if (proveedorExistente) {
        if (proveedorExistente.nombre_proveedor === nombre_proveedor) {
          throw new Error('Ya existe un proveedor con ese nombre');
        }
        if (proveedorExistente.nit === nit) {
          throw new Error('Ya existe un proveedor con ese NIT');
        }
      }
    }

    // Crear
    const nuevoProveedor = await Proveedores.create({
      ...data,
      activo: data.activo ?? true
    });

    return nuevoProveedor;
  }

  // Obtener todos
  async getAll({ activo, search, limit = 100, offset = 0 }) {
    const where = {};

    if (activo !== undefined) {
      where.activo = activo === 'true' || activo === true;
    }

    if (search) {
      where[Op.or] = [
        { nombre_proveedor: { [Op.like]: `%${search}%` } },
        { contacto: { [Op.like]: `%${search}%` } },
        { nit: { [Op.like]: `%${search}%` } }
      ];
    }

    const proveedores = await Proveedores.findAndCountAll({
      where,
      order: [['nombre_proveedor', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      proveedores: proveedores.rows,
      total: proveedores.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  // Obtener por ID
  async getById(id) {
    const proveedor = await Proveedores.findByPk(id);
    if (!proveedor) throw new Error('Proveedor no encontrado');
    return proveedor;
  }

  // Actualizar
  async update(id, data) {
    const proveedor = await Proveedores.findByPk(id);
    if (!proveedor) throw new Error('Proveedor no encontrado');

    // Validar duplicados si cambia nombre o NIT
    if ((data.nombre_proveedor && data.nombre_proveedor !== proveedor.nombre_proveedor) ||
        (data.nit && data.nit !== proveedor.nit)) {
      const where = {
        id_proveedor: { [Op.ne]: id },
        [Op.or]: []
      };

      if (data.nombre_proveedor) where[Op.or].push({ nombre_proveedor: data.nombre_proveedor });
      if (data.nit) where[Op.or].push({ nit: data.nit });

      if (where[Op.or].length > 0) {
        const proveedorExistente = await Proveedores.findOne({ where });
        if (proveedorExistente) {
          if (proveedorExistente.nombre_proveedor === data.nombre_proveedor) {
            throw new Error('Ya existe otro proveedor con ese nombre');
          }
          if (proveedorExistente.nit === data.nit) {
            throw new Error('Ya existe otro proveedor con ese NIT');
          }
        }
      }
    }

    await proveedor.update(data);
    return proveedor;
  }

  // Activar o desactivar
  async toggleActive(id) {
    const proveedor = await Proveedores.findByPk(id);
    if (!proveedor) throw new Error('Proveedor no encontrado');

    proveedor.activo = !proveedor.activo;
    await proveedor.save();
    return proveedor;
  }

  // Eliminar (soft o hard)
  async delete(id, hard = false) {
    const proveedor = await Proveedores.findByPk(id);
    if (!proveedor) throw new Error('Proveedor no encontrado');

    if (hard) {
      await proveedor.destroy();
      return null;
    }

    proveedor.activo = false;
    await proveedor.save();
    return proveedor;
  }

  // Estadísticas
  async getStats() {
    const total = await Proveedores.count();
    const activos = await Proveedores.count({ where: { activo: true } });
    const inactivos = await Proveedores.count({ where: { activo: false } });

    return {
      total,
      activos,
      inactivos,
      porcentajeActivos: total > 0 ? ((activos / total) * 100).toFixed(2) : 0
    };
  }
}

export default new ProveedoresService();
