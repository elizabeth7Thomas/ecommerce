import Almacenes from '../models/Almacenes.js';
import * as response from '../utils/response.js';

class AlmacenesController {
  // Crear un nuevo almacén
  async create(req, res) {
    try {
      const { nombre_almacen, direccion, telefono, responsable, activo } = req.body;

      // Validación básica
      if (!nombre_almacen) {
        return response.error(req, res, 'El nombre del almacén es requerido', 400);
      }

      // Verificar si ya existe un almacén con ese nombre
      const almacenExistente = await Almacenes.findOne({ 
        where: { nombre_almacen } 
      });

      if (almacenExistente) {
        return response.error(req, res, 'Ya existe un almacén con ese nombre', 409);
      }

      // Crear el almacén
      const nuevoAlmacen = await Almacenes.create({
        nombre_almacen,
        direccion,
        telefono,
        responsable,
        activo: activo !== undefined ? activo : true
      });

      return response.success(req, res, nuevoAlmacen, 'Almacén creado exitosamente', 201);
    } catch (error) {
      console.error('Error al crear almacén:', error);
      return response.error(req, res, 'Error al crear el almacén', 500);
    }
  }

  // Obtener todos los almacenes
  async getAll(req, res) {
    try {
      const { activo } = req.query;

      // Construir filtros opcionales
      const where = {};
      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      const almacenes = await Almacenes.findAll({ 
        where,
        order: [['nombre_almacen', 'ASC']]
      });

      return response.success(req, res, almacenes, 'Almacenes obtenidos exitosamente', 200);
    } catch (error) {
      console.error('Error al obtener almacenes:', error);
      return response.error(req, res, 'Error al obtener los almacenes', 500);
    }
  }

  // Obtener un almacén por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const almacen = await Almacenes.findByPk(id);

      if (!almacen) {
        return response.error(req, res, 'Almacén no encontrado', 404);
      }

      return response.success(req, res, almacen, 'Almacén obtenido exitosamente', 200);
    } catch (error) {
      console.error('Error al obtener almacén:', error);
      return response.error(req, res, 'Error al obtener el almacén', 500);
    }
  }

  // Actualizar un almacén
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre_almacen, direccion, telefono, responsable, activo } = req.body;

      // Buscar el almacén
      const almacen = await Almacenes.findByPk(id);

      if (!almacen) {
        return response.error(req, res, 'Almacén no encontrado', 404);
      }

      // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
      if (nombre_almacen && nombre_almacen !== almacen.nombre_almacen) {
        const almacenExistente = await Almacenes.findOne({ 
          where: { nombre_almacen } 
        });

        if (almacenExistente) {
          return response.error(req, res, 'Ya existe otro almacén con ese nombre', 409);
        }
      }

      // Actualizar campos
      await almacen.update({
        nombre_almacen: nombre_almacen || almacen.nombre_almacen,
        direccion: direccion !== undefined ? direccion : almacen.direccion,
        telefono: telefono !== undefined ? telefono : almacen.telefono,
        responsable: responsable !== undefined ? responsable : almacen.responsable,
        activo: activo !== undefined ? activo : almacen.activo
      });

      return response.success(req, res, almacen, 'Almacén actualizado exitosamente', 200);
    } catch (error) {
      console.error('Error al actualizar almacén:', error);
      return response.error(req, res, 'Error al actualizar el almacén', 500);
    }
  }

  // Eliminar un almacén (soft delete - desactivar)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query; // Parámetro opcional para eliminación física

      const almacen = await Almacenes.findByPk(id);

      if (!almacen) {
        return response.error(req, res, 'Almacén no encontrado', 404);
      }

      if (hard === 'true') {
        // Eliminación física
        await almacen.destroy();
        return response.success(req, res, null, 'Almacén eliminado permanentemente', 200);
      } else {
        // Soft delete - solo desactivar
        await almacen.update({ activo: false });
        return response.success(req, res, almacen, 'Almacén desactivado exitosamente', 200);
      }
    } catch (error) {
      console.error('Error al eliminar almacén:', error);
      return response.error(req, res, 'Error al eliminar el almacén', 500);
    }
  }
}

export default new AlmacenesController();