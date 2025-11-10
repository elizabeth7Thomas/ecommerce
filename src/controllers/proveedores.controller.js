import Proveedores from '../models/proveedores.model.js';
import * as response from '../utils/response.js';
import { Op } from 'sequelize';

class ProveedoresController {
  // Crear un nuevo proveedor
  async create(req, res) {
    try {
      const { 
        nombre_proveedor, 
        contacto, 
        email, 
        telefono, 
        direccion, 
        nit, 
        activo 
      } = req.body;

      // Validación básica
      if (!nombre_proveedor) {
        return response.error(req, res, 'El nombre del proveedor es requerido', 400);
      }

      // Validar email si se proporciona
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return response.error(req, res, 'El formato del email no es válido', 400);
        }
      }

      // Verificar si ya existe un proveedor con el mismo nombre o NIT
      const where = {
        [Op.or]: []
      };

      if (nombre_proveedor) {
        where[Op.or].push({ nombre_proveedor });
      }

      if (nit) {
        where[Op.or].push({ nit });
      }

      if (where[Op.or].length > 0) {
        const proveedorExistente = await Proveedores.findOne({ where });

        if (proveedorExistente) {
          if (proveedorExistente.nombre_proveedor === nombre_proveedor) {
            return response.error(req, res, 'Ya existe un proveedor con ese nombre', 409);
          }
          if (proveedorExistente.nit === nit) {
            return response.error(req, res, 'Ya existe un proveedor con ese NIT', 409);
          }
        }
      }

      // Crear el proveedor
      const nuevoProveedor = await Proveedores.create({
        nombre_proveedor,
        contacto,
        email,
        telefono,
        direccion,
        nit,
        activo: activo !== undefined ? activo : true
      });

      return response.success(
        req, 
        res, 
        nuevoProveedor, 
        'Proveedor creado exitosamente', 
        201
      );
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      return response.error(req, res, 'Error al crear el proveedor', 500);
    }
  }

  // Obtener todos los proveedores
  async getAll(req, res) {
    try {
      const { activo, search, limit = 100, offset = 0 } = req.query;

      // Construir filtros opcionales
      const where = {};

      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      // Búsqueda por nombre, contacto o NIT
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

      return response.success(
        req, 
        res, 
        {
          proveedores: proveedores.rows,
          total: proveedores.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        'Proveedores obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return response.error(req, res, 'Error al obtener los proveedores', 500);
    }
  }

  // Obtener un proveedor por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const proveedor = await Proveedores.findByPk(id);

      if (!proveedor) {
        return response.error(req, res, 'Proveedor no encontrado', 404);
      }

      return response.success(
        req, 
        res, 
        proveedor, 
        'Proveedor obtenido exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      return response.error(req, res, 'Error al obtener el proveedor', 500);
    }
  }

  // Buscar proveedor por NIT
  async getByNit(req, res) {
    try {
      const { nit } = req.params;

      const proveedor = await Proveedores.findOne({
        where: { nit }
      });

      if (!proveedor) {
        return response.error(req, res, 'Proveedor no encontrado', 404);
      }

      return response.success(
        req, 
        res, 
        proveedor, 
        'Proveedor obtenido exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener proveedor por NIT:', error);
      return response.error(req, res, 'Error al obtener el proveedor', 500);
    }
  }

  // Buscar proveedores por nombre (búsqueda parcial)
  async searchByName(req, res) {
    try {
      const { nombre } = req.params;
      const { activo, limit = 50 } = req.query;

      const where = {
        nombre_proveedor: { [Op.like]: `%${nombre}%` }
      };

      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      const proveedores = await Proveedores.findAll({
        where,
        order: [['nombre_proveedor', 'ASC']],
        limit: parseInt(limit)
      });

      return response.success(
        req, 
        res, 
        proveedores, 
        'Proveedores encontrados exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      return response.error(req, res, 'Error al buscar proveedores', 500);
    }
  }

  // Actualizar un proveedor
  async update(req, res) {
    try {
      const { id } = req.params;
      const { 
        nombre_proveedor, 
        contacto, 
        email, 
        telefono, 
        direccion, 
        nit, 
        activo 
      } = req.body;

      // Buscar el proveedor
      const proveedor = await Proveedores.findByPk(id);

      if (!proveedor) {
        return response.error(req, res, 'Proveedor no encontrado', 404);
      }

      // Validar email si se proporciona
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return response.error(req, res, 'El formato del email no es válido', 400);
        }
      }

      // Verificar duplicados si se cambia el nombre o NIT
      if ((nombre_proveedor && nombre_proveedor !== proveedor.nombre_proveedor) ||
          (nit && nit !== proveedor.nit)) {
        
        const where = {
          id_proveedor: { [Op.ne]: id },
          [Op.or]: []
        };

        if (nombre_proveedor && nombre_proveedor !== proveedor.nombre_proveedor) {
          where[Op.or].push({ nombre_proveedor });
        }

        if (nit && nit !== proveedor.nit) {
          where[Op.or].push({ nit });
        }

        if (where[Op.or].length > 0) {
          const proveedorExistente = await Proveedores.findOne({ where });

          if (proveedorExistente) {
            if (proveedorExistente.nombre_proveedor === nombre_proveedor) {
              return response.error(req, res, 'Ya existe otro proveedor con ese nombre', 409);
            }
            if (proveedorExistente.nit === nit) {
              return response.error(req, res, 'Ya existe otro proveedor con ese NIT', 409);
            }
          }
        }
      }

      // Actualizar campos
      await proveedor.update({
        nombre_proveedor: nombre_proveedor || proveedor.nombre_proveedor,
        contacto: contacto !== undefined ? contacto : proveedor.contacto,
        email: email !== undefined ? email : proveedor.email,
        telefono: telefono !== undefined ? telefono : proveedor.telefono,
        direccion: direccion !== undefined ? direccion : proveedor.direccion,
        nit: nit !== undefined ? nit : proveedor.nit,
        activo: activo !== undefined ? activo : proveedor.activo
      });

      return response.success(
        req, 
        res, 
        proveedor, 
        'Proveedor actualizado exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      return response.error(req, res, 'Error al actualizar el proveedor', 500);
    }
  }

  // Activar/Desactivar proveedor
  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      const proveedor = await Proveedores.findByPk(id);

      if (!proveedor) {
        return response.error(req, res, 'Proveedor no encontrado', 404);
      }

      await proveedor.update({ activo: !proveedor.activo });

      return response.success(
        req, 
        res, 
        proveedor, 
        `Proveedor ${proveedor.activo ? 'activado' : 'desactivado'} exitosamente`, 
        200
      );
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
      return response.error(req, res, 'Error al cambiar estado del proveedor', 500);
    }
  }

  // Eliminar un proveedor (soft delete - desactivar)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query; // Parámetro opcional para eliminación física

      const proveedor = await Proveedores.findByPk(id);

      if (!proveedor) {
        return response.error(req, res, 'Proveedor no encontrado', 404);
      }

      if (hard === 'true') {
        // Eliminación física
        await proveedor.destroy();
        return response.success(
          req, 
          res, 
          null, 
          'Proveedor eliminado permanentemente', 
          200
        );
      } else {
        // Soft delete - solo desactivar
        await proveedor.update({ activo: false });
        return response.success(
          req, 
          res, 
          proveedor, 
          'Proveedor desactivado exitosamente', 
          200
        );
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return response.error(req, res, 'Error al eliminar el proveedor', 500);
    }
  }

  // Obtener estadísticas de proveedores
  async getStats(req, res) {
    try {
      const totalProveedores = await Proveedores.count();
      const proveedoresActivos = await Proveedores.count({ where: { activo: true } });
      const proveedoresInactivos = await Proveedores.count({ where: { activo: false } });

      const stats = {
        total: totalProveedores,
        activos: proveedoresActivos,
        inactivos: proveedoresInactivos,
        porcentajeActivos: totalProveedores > 0 
          ? ((proveedoresActivos / totalProveedores) * 100).toFixed(2) 
          : 0
      };

      return response.success(
        req, 
        res, 
        stats, 
        'Estadísticas obtenidas exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return response.error(req, res, 'Error al obtener estadísticas', 500);
    }
  }
}

export default new ProveedoresController();
