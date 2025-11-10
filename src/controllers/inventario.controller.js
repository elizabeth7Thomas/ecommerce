import Inventario from '../models/inventario.model.js';
import * as response from '../utils/response.js';
import { Op, sequelize } from 'sequelize';

class InventarioController {
  // Crear un nuevo registro de inventario
  async create(req, res) {
    try {
      const { 
        id_producto, 
        id_almacen, 
        cantidad_actual, 
        cantidad_minima, 
        cantidad_maxima, 
        ubicacion_fisica 
      } = req.body;

      // Validación básica
      if (!id_producto || !id_almacen) {
        return response.error(req, res, 'El producto y almacén son requeridos', 400);
      }

      // Verificar si ya existe inventario para este producto en este almacén
      const inventarioExistente = await Inventario.findOne({ 
        where: { 
          id_producto, 
          id_almacen 
        } 
      });

      if (inventarioExistente) {
        return response.error(
          req, 
          res, 
          'Ya existe un registro de inventario para este producto en este almacén', 
          409
        );
      }

      // Validar cantidades
      if (cantidad_minima && cantidad_maxima && cantidad_minima > cantidad_maxima) {
        return response.error(
          req, 
          res, 
          'La cantidad mínima no puede ser mayor que la cantidad máxima', 
          400
        );
      }

      // Crear el inventario
      const nuevoInventario = await Inventario.create({
        id_producto,
        id_almacen,
        cantidad_actual: cantidad_actual || 0,
        cantidad_minima,
        cantidad_maxima,
        ubicacion_fisica
      });

      return response.success(
        req, 
        res, 
        nuevoInventario, 
        'Inventario creado exitosamente', 
        201
      );
    } catch (error) {
      console.error('Error al crear inventario:', error);
      return response.error(req, res, 'Error al crear el inventario', 500);
    }
  }

  // Obtener todos los registros de inventario
  async getAll(req, res) {
    try {
      const { id_almacen, id_producto, bajo_stock } = req.query;

      // Construir filtros opcionales
      const where = {};
      
      if (id_almacen) {
        where.id_almacen = id_almacen;
      }
      
      if (id_producto) {
        where.id_producto = id_producto;
      }

      // Filtrar productos con stock bajo (cantidad_actual <= cantidad_minima)
      if (bajo_stock === 'true') {
        where.cantidad_actual = {
          [Op.lte]: sequelize.col('cantidad_minima')
        };
      }

      const inventarios = await Inventario.findAll({ 
        where,
        order: [['fecha_actualizacion', 'DESC']]
      });

      return response.success(
        req, 
        res, 
        inventarios, 
        'Inventarios obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener inventarios:', error);
      return response.error(req, res, 'Error al obtener los inventarios', 500);
    }
  }

  // Obtener un inventario por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const inventario = await Inventario.findByPk(id);

      if (!inventario) {
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      return response.success(
        req, 
        res, 
        inventario, 
        'Inventario obtenido exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      return response.error(req, res, 'Error al obtener el inventario', 500);
    }
  }

  // Obtener inventario por producto y almacén
  async getByProductoAlmacen(req, res) {
    try {
      const { id_producto, id_almacen } = req.params;

      const inventario = await Inventario.findOne({
        where: { id_producto, id_almacen }
      });

      if (!inventario) {
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      return response.success(
        req, 
        res, 
        inventario, 
        'Inventario obtenido exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      return response.error(req, res, 'Error al obtener el inventario', 500);
    }
  }

  // Actualizar un inventario
  async update(req, res) {
    try {
      const { id } = req.params;
      const { 
        cantidad_actual, 
        cantidad_minima, 
        cantidad_maxima, 
        ubicacion_fisica 
      } = req.body;

      // Buscar el inventario
      const inventario = await Inventario.findByPk(id);

      if (!inventario) {
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      // Validar que cantidad_actual no sea negativa
      if (cantidad_actual !== undefined && cantidad_actual < 0) {
        return response.error(req, res, 'La cantidad actual no puede ser negativa', 400);
      }

      // Validar cantidades mínima y máxima
      const nuevaCantidadMin = cantidad_minima !== undefined ? cantidad_minima : inventario.cantidad_minima;
      const nuevaCantidadMax = cantidad_maxima !== undefined ? cantidad_maxima : inventario.cantidad_maxima;

      if (nuevaCantidadMin > nuevaCantidadMax) {
        return response.error(
          req, 
          res, 
          'La cantidad mínima no puede ser mayor que la cantidad máxima', 
          400
        );
      }

      // Actualizar campos
      await inventario.update({
        cantidad_actual: cantidad_actual !== undefined ? cantidad_actual : inventario.cantidad_actual,
        cantidad_minima: cantidad_minima !== undefined ? cantidad_minima : inventario.cantidad_minima,
        cantidad_maxima: cantidad_maxima !== undefined ? cantidad_maxima : inventario.cantidad_maxima,
        ubicacion_fisica: ubicacion_fisica !== undefined ? ubicacion_fisica : inventario.ubicacion_fisica,
        fecha_actualizacion: new Date()
      });

      return response.success(
        req, 
        res, 
        inventario, 
        'Inventario actualizado exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      return response.error(req, res, 'Error al actualizar el inventario', 500);
    }
  }

  // Ajustar cantidad (incrementar o decrementar)
  async ajustarCantidad(req, res) {
    try {
      const { id } = req.params;
      const { cantidad, tipo } = req.body; // tipo: 'entrada' o 'salida'

      if (!cantidad || !tipo) {
        return response.error(req, res, 'La cantidad y el tipo son requeridos', 400);
      }

      if (tipo !== 'entrada' && tipo !== 'salida') {
        return response.error(req, res, 'El tipo debe ser "entrada" o "salida"', 400);
      }

      const inventario = await Inventario.findByPk(id);

      if (!inventario) {
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      let nuevaCantidad;
      if (tipo === 'entrada') {
        nuevaCantidad = inventario.cantidad_actual + cantidad;
      } else {
        nuevaCantidad = inventario.cantidad_actual - cantidad;
      }

      if (nuevaCantidad < 0) {
        return response.error(req, res, 'No hay suficiente stock disponible', 400);
      }

      await inventario.update({
        cantidad_actual: nuevaCantidad,
        fecha_actualizacion: new Date()
      });

      return response.success(
        req, 
        res, 
        inventario, 
        `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`, 
        200
      );
    } catch (error) {
      console.error('Error al ajustar cantidad:', error);
      return response.error(req, res, 'Error al ajustar la cantidad', 500);
    }
  }

  // Obtener productos con stock bajo
  async getStockBajo(req, res) {
    try {
      const { id_almacen } = req.query;

      const where = {
        cantidad_actual: {
          [Op.lte]: sequelize.col('cantidad_minima')
        }
      };

      if (id_almacen) {
        where.id_almacen = id_almacen;
      }

      const inventarios = await Inventario.findAll({ 
        where,
        order: [['cantidad_actual', 'ASC']]
      });

      return response.success(
        req, 
        res, 
        inventarios, 
        'Productos con stock bajo obtenidos exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al obtener stock bajo:', error);
      return response.error(req, res, 'Error al obtener productos con stock bajo', 500);
    }
  }

  // Eliminar un inventario
  async delete(req, res) {
    try {
      const { id } = req.params;

      const inventario = await Inventario.findByPk(id);

      if (!inventario) {
        return response.error(req, res, 'Inventario no encontrado', 404);
      }

      await inventario.destroy();
      
      return response.success(
        req, 
        res, 
        null, 
        'Inventario eliminado exitosamente', 
        200
      );
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      return response.error(req, res, 'Error al eliminar el inventario', 500);
    }
  }
}

export default new InventarioController();