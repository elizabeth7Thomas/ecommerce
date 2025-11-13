import OrdenesCompraDetalleService from '../services/ordenesCompraDetalle.service.js';
import * as response from '../utils/response.js';

class OrdenesCompraDetalleController {

  // CREATE - Crear detalle de orden de compra
  async create(req, res) {
    try {
      const {
        id_orden_compra,
        id_producto,
        cantidad_ordenada,
        precio_unitario,
        subtotal,
        cantidad_recibida,
        notas_detalle
      } = req.body;

      if (!id_orden_compra || !id_producto || !cantidad_ordenada || !precio_unitario) {
        return response.error(
          req,
          res,
          'Campos requeridos: id_orden_compra, id_producto, cantidad_ordenada, precio_unitario',
          400
        );
      }

      if (cantidad_ordenada < 1 || precio_unitario < 0) {
        return response.error(
          req,
          res,
          'Cantidad debe ser mayor a 0 y precio no puede ser negativo',
          400
        );
      }

      const detalle = await OrdenesCompraDetalleService.createDetalle({
        id_orden_compra,
        id_producto,
        cantidad_ordenada,
        precio_unitario,
        subtotal,
        cantidad_recibida: cantidad_recibida || 0,
        notas_detalle
      });

      return response.success(req, res, detalle, 'Detalle de orden creado exitosamente', 201);
    } catch (error) {
      console.error('Error al crear detalle:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // READ - Obtener todos los detalles
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        id_orden_compra,
        id_producto,
        recibido_completo
      } = req.query;

      const opciones = {
        page: parseInt(page),
        limit: parseInt(limit),
        id_orden_compra: id_orden_compra || undefined,
        id_producto: id_producto || undefined,
        recibido_completo: recibido_completo === 'true' ? true : undefined
      };

      const detalles = await OrdenesCompraDetalleService.getAllDetalles(opciones);
      return response.success(req, res, detalles, 'Detalles de órdenes obtenidos exitosamente');
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener detalle por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      const detalle = await OrdenesCompraDetalleService.getDetalleById(id);
      return response.success(req, res, detalle, 'Detalle obtenido exitosamente');
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      return response.error(req, res, error.message, 404);
    }
  }

  // READ - Obtener detalles por orden de compra
  async getByOrdenCompra(req, res) {
    try {
      const { id_orden_compra } = req.params;

      if (!id_orden_compra) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const detalles = await OrdenesCompraDetalleService.getDetallesByOrden(id_orden_compra);
      return response.success(req, res, detalles, 'Detalles de la orden obtenidos exitosamente');
    } catch (error) {
      console.error('Error al obtener detalles de la orden:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UPDATE - Actualizar detalle
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      const detalle = await OrdenesCompraDetalleService.updateDetalle(id, updateData);
      return response.success(req, res, detalle, 'Detalle actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar detalle:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // DELETE - Eliminar detalle
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      await OrdenesCompraDetalleService.deleteDetalle(id);
      return response.success(req, res, { id }, 'Detalle eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Registrar cantidad recibida
  async registrarCantidadRecibida(req, res) {
    try {
      const { id } = req.params;
      const { cantidadRecibida } = req.body;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      if (cantidadRecibida === undefined || cantidadRecibida < 0) {
        return response.error(req, res, 'La cantidad recibida debe ser un número no negativo', 400);
      }

      const detalle = await OrdenesCompraDetalleService.registrarCantidadRecibida(
        id,
        cantidadRecibida
      );

      return response.success(req, res, detalle, 'Cantidad recibida registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar cantidad recibida:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Registrar recepción parcial
  async registrarRecepcionParcial(req, res) {
    try {
      const { id } = req.params;
      const { cantidadAdicional } = req.body;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      if (cantidadAdicional === undefined || cantidadAdicional <= 0) {
        return response.error(req, res, 'La cantidad adicional debe ser mayor a 0', 400);
      }

      const detalle = await OrdenesCompraDetalleService.registrarRecepcionParcial(
        id,
        cantidadAdicional
      );

      return response.success(req, res, detalle, 'Recepción parcial registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar recepción parcial:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar detalle como completamente recibido
  async marcarComoRecibido(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID del detalle es requerido', 400);
      }

      const detalle = await OrdenesCompraDetalleService.marcarComoRecibido(id);
      return response.success(req, res, detalle, 'Detalle marcado como recibido exitosamente');
    } catch (error) {
      console.error('Error al marcar como recibido:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Marcar todos los detalles de una orden como recibidos
  async marcarOrdenComoRecibida(req, res) {
    try {
      const { id_orden_compra } = req.params;

      if (!id_orden_compra) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const detalles = await OrdenesCompraDetalleService.marcarOrdenComoRecibida(id_orden_compra);
      return response.success(req, res, detalles, 'Orden marcada como completamente recibida');
    } catch (error) {
      console.error('Error al marcar orden como recibida:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // READ - Obtener detalles pendientes de recibir
  async getDetallesPendientes(req, res) {
    try {
      const { id_orden_compra } = req.query;

      const detalles = await OrdenesCompraDetalleService.getDetallesPendientes(
        id_orden_compra || null
      );

      return response.success(req, res, detalles, 'Detalles pendientes obtenidos exitosamente');
    } catch (error) {
      console.error('Error al obtener detalles pendientes:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Calcular total de una orden
  async calcularTotalOrden(req, res) {
    try {
      const { id_orden_compra } = req.params;

      if (!id_orden_compra) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const total = await OrdenesCompraDetalleService.calcularTotalOrden(id_orden_compra);
      return response.success(req, res, total, 'Total de la orden calculado exitosamente');
    } catch (error) {
      console.error('Error al calcular total:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener estadísticas de recepción
  async getEstadisticasRecepcion(req, res) {
    try {
      const { id_orden_compra } = req.params;

      if (!id_orden_compra) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const estadisticas = await OrdenesCompraDetalleService.getEstadisticasRecepcion(
        id_orden_compra
      );

      return response.success(req, res, estadisticas, 'Estadísticas de recepción obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Verificar si recepción está completa
  async verificarRecepcionCompleta(req, res) {
    try {
      const { id_orden_compra } = req.params;

      if (!id_orden_compra) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const resultado = await OrdenesCompraDetalleService.verificarRecepcionCompleta(
        id_orden_compra
      );

      return response.success(req, res, resultado, 'Verificación completada');
    } catch (error) {
      console.error('Error al verificar recepción:', error);
      return response.error(req, res, error.message, 500);
    }
  }
}

export default new OrdenesCompraDetalleController();
