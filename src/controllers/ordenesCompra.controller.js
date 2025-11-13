import OrdenesCompraService from '../services/ordenesCompra.service.js';
import * as response from '../utils/response.js';

class OrdenesCompraController {
  
  // CREATE - Crear nueva orden de compra
  async create(req, res) {
    try {
      const {
        id_proveedor,
        id_almacen,
        id_usuario,
        numero_orden,
        total_orden,
        fecha_entrega_esperada,
        notas_orden
      } = req.body;

      if (!id_proveedor || !id_almacen || !id_usuario || !total_orden) {
        return response.error(
          req,
          res,
          'Campos requeridos: id_proveedor, id_almacen, id_usuario, total_orden',
          400
        );
      }

      if (total_orden <= 0) {
        return response.error(req, res, 'El total debe ser mayor a 0', 400);
      }

      const orden = await OrdenesCompraService.createOrden({
        id_proveedor,
        id_almacen,
        id_usuario,
        numero_orden,
        total_orden,
        fecha_entrega_esperada,
        notas_orden,
        estado: 'pendiente',
        fecha_orden: new Date()
      });

      return response.success(req, res, orden, 'Orden de compra creada exitosamente', 201);
    } catch (error) {
      console.error('Error al crear orden:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // READ - Obtener todas las órdenes
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        estado,
        id_proveedor,
        id_almacen,
        id_usuario,
        numero_orden,
        fecha_inicio,
        fecha_fin,
        order = 'fecha_orden',
        sort = 'DESC'
      } = req.query;

      const opciones = {
        page: parseInt(page),
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        estado: estado || undefined,
        id_proveedor: id_proveedor || undefined,
        id_almacen: id_almacen || undefined,
        id_usuario: id_usuario || undefined,
        numero_orden: numero_orden || undefined,
        fecha_inicio: fecha_inicio || undefined,
        fecha_fin: fecha_fin || undefined,
        order,
        sort
      };

      const ordenes = await OrdenesCompraService.getAllOrdenes(opciones);
      return response.success(req, res, ordenes, 'Órdenes de compra obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener orden por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const orden = await OrdenesCompraService.getOrdenById(id);
      return response.success(req, res, orden, 'Orden de compra obtenida exitosamente');
    } catch (error) {
      console.error('Error al obtener orden:', error);
      return response.error(req, res, error.message, 404);
    }
  }

  // READ - Obtener órdenes por proveedor
  async getByProveedor(req, res) {
    try {
      const { id_proveedor } = req.params;

      if (!id_proveedor) {
        return response.error(req, res, 'El ID del proveedor es requerido', 400);
      }

      const ordenes = await OrdenesCompraService.getOrdenesByProveedor(id_proveedor);
      return response.success(req, res, ordenes, 'Órdenes del proveedor obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener órdenes por proveedor:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener órdenes por estado
  async getByEstado(req, res) {
    try {
      const { estado } = req.params;

      if (!estado) {
        return response.error(req, res, 'El estado es requerido', 400);
      }

      const estadosValidos = ['pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada'];
      if (!estadosValidos.includes(estado)) {
        return response.error(
          req,
          res,
          `Estado inválido. Válidos: ${estadosValidos.join(', ')}`,
          400
        );
      }

      const ordenes = await OrdenesCompraService.getOrdenesByEstado(estado);
      return response.success(req, res, ordenes, `Órdenes con estado '${estado}' obtenidas exitosamente`);
    } catch (error) {
      console.error('Error al obtener órdenes por estado:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UPDATE - Actualizar orden
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const orden = await OrdenesCompraService.updateOrden(id, updateData);
      return response.success(req, res, orden, 'Orden de compra actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // DELETE - Eliminar orden
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      await OrdenesCompraService.deleteOrden(id);
      return response.success(req, res, { id }, 'Orden de compra eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Cambiar estado de la orden
  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { nuevoEstado } = req.body;

      if (!id) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      if (!nuevoEstado) {
        return response.error(req, res, 'El nuevo estado es requerido', 400);
      }

      const estadosValidos = ['pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada'];
      if (!estadosValidos.includes(nuevoEstado)) {
        return response.error(
          req,
          res,
          `Estado inválido. Válidos: ${estadosValidos.join(', ')}`,
          400
        );
      }

      const orden = await OrdenesCompraService.cambiarEstado(id, nuevoEstado);
      return response.success(req, res, orden, `Estado de la orden cambiado a '${nuevoEstado}' exitosamente`);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return response.error(req, res, error.message, 400);
    }
  }

  // UPDATE - Registrar entrega
  async registrarEntrega(req, res) {
    try {
      const { id } = req.params;
      const { fecha_entrega_real } = req.body;

      if (!id) {
        return response.error(req, res, 'El ID de la orden es requerido', 400);
      }

      const orden = await OrdenesCompraService.marcarRecibida(id, fecha_entrega_real || new Date());
      return response.success(req, res, orden, 'Entrega registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      return response.error(req, res, error.message, 400);
    }
  }
}

export default new OrdenesCompraController();
