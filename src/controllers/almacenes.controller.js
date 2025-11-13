import Almacenes from '../models/almacenes.model.js';
import * as response from '../utils/response.js';

class AlmacenesController {
  // Crear un nuevo almacén
  async create(req, res) {
    try {
      const { nombre_almacen, direccion, telefono, responsable, activo } = req.body;

      if (!nombre_almacen) {
        return response.sendError(req, res, 'El nombre del almacén es requerido', 400);
      }

      const almacenExistente = await Almacenes.findOne({ where: { nombre_almacen } });
      if (almacenExistente) {
        return response.sendError(req, res, 'Ya existe un almacén con ese nombre', 409);
      }

      const nuevoAlmacen = await Almacenes.create({
        nombre_almacen,
        direccion,
        telefono,
        responsable,
        activo: activo !== undefined ? activo : true
      });

      return response.sendCreated(req, res, nuevoAlmacen, 'Almacén creado exitosamente');
    } catch (error) {
      console.error('Error al crear almacén:', error);
      return response.sendError(req, res, 'Error al crear el almacén', 500);
    }
  }

  // Obtener todos los almacenes
  async getAll(req, res) {
    try {
      const { activo } = req.query;
      const where = {};

      if (activo !== undefined) {
        where.activo = activo === 'true';
      }

      const almacenes = await Almacenes.findAll({
        where,
        order: [['nombre_almacen', 'ASC']]
      });

      return response.sendSuccess(req, res, almacenes, 'Almacenes obtenidos exitosamente', 200);
    } catch (error) {
      console.error('Error al obtener almacenes:', error);
      return response.sendError(req, res, 'Error al obtener los almacenes', 500);
    }
  }

  // Obtener un almacén por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const almacen = await Almacenes.findByPk(id);

      if (!almacen) {
        return response.sendError(req, res, 'Almacén no encontrado', 404);
      }

      return response.sendSuccess(req, res, almacen, 'Almacén obtenido exitosamente', 200);
    } catch (error) {
      console.error('Error al obtener almacén:', error);
      return response.sendError(req, res, 'Error al obtener el almacén', 500);
    }
  }

  // Actualizar un almacén
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre_almacen, direccion, telefono, responsable, activo } = req.body;

      const almacen = await Almacenes.findByPk(id);
      if (!almacen) {
        return response.sendError(req, res, 'Almacén no encontrado', 404);
      }

      if (nombre_almacen && nombre_almacen !== almacen.nombre_almacen) {
        const existe = await Almacenes.findOne({ where: { nombre_almacen } });
        if (existe) {
          return response.sendError(req, res, 'Ya existe otro almacén con ese nombre', 409);
        }
      }

      await almacen.update({
        nombre_almacen: nombre_almacen || almacen.nombre_almacen,
        direccion: direccion ?? almacen.direccion,
        telefono: telefono ?? almacen.telefono,
        responsable: responsable ?? almacen.responsable,
        activo: activo ?? almacen.activo
      });

      return response.sendSuccess(req, res, almacen, 'Almacén actualizado exitosamente', 200);
    } catch (error) {
      console.error('Error al actualizar almacén:', error);
      return response.sendError(req, res, 'Error al actualizar el almacén', 500);
    }
  }

  // Eliminar un almacén
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      const almacen = await Almacenes.findByPk(id);
      if (!almacen) {
        return response.sendError(req, res, 'Almacén no encontrado', 404);
      }

      if (hard === 'true') {
        await almacen.destroy();
        return response.sendSuccess(req, res, null, 'Almacén eliminado permanentemente', 200);
      } else {
        await almacen.update({ activo: false });
        return response.sendSuccess(req, res, almacen, 'Almacén desactivado exitosamente', 200);
      }
    } catch (error) {
      console.error('Error al eliminar almacén:', error);
      return response.sendError(req, res, 'Error al eliminar el almacén', 500);
    }
  }
}

export default new AlmacenesController();
