import metodoPagoClienteService from '../services/metodoPagoCliente.service.js';
import * as response from '../utils/response.js';

/**
 * Validar que el body contenga los campos requeridos
 */
function validarBodyMetodoPago(body) {
  const errores = [];

  // Campo requerido: id_metodo_pago
  if (!body.id_metodo_pago) {
    errores.push('El tipo de método de pago (id_metodo_pago) es requerido');
  }

  // Campo requerido: alias
  if (!body.alias || body.alias.trim() === '') {
    errores.push('El alias del método de pago es requerido y no puede estar vacío');
  }

  // Validar campos específicos según el tipo
  const id_metodo = body.id_metodo_pago;

  // TARJETA DE CRÉDITO/DÉBITO (id_metodo_pago = 1)
  if (id_metodo === 1) {
    if (!body.numero_tarjeta && !body.numero_tarjeta_ultimos_4) {
      errores.push('Para tarjeta de crédito/débito, se requiere el número de tarjeta o los últimos 4 dígitos');
    }
    if (!body.nombre_titular || body.nombre_titular.trim() === '') {
      errores.push('El nombre del titular de la tarjeta es requerido');
    }
    if (!body.fecha_expiracion) {
      errores.push('La fecha de expiración de la tarjeta es requerida');
    }
  }

  // PAYPAL (id_metodo_pago = 2)
  if (id_metodo === 2) {
    if (!body.email_paypal && !body.email_billetera) {
      errores.push('Para PayPal, se requiere el email asociado a la cuenta');
    }
  }

  // TRANSFERENCIA BANCARIA (id_metodo_pago = 3)
  if (id_metodo === 3) {
    if (!body.banco_origen && !body.banco) {
      errores.push('Para transferencia bancaria, se requiere el banco de origen');
    }
    if (!body.numero_transaccion && !body.identificador_externo) {
      errores.push('Para transferencia bancaria, se requiere el número de transacción');
    }
  }

  // CRIPTOMONEDA (id_metodo_pago = 4)
  if (id_metodo === 4) {
    if (!body.wallet_address && !body.identificador_externo) {
      errores.push('Para criptomoneda, se requiere la dirección de billetera (wallet)');
    }
  }

  // EFECTIVO (id_metodo_pago = 5)
  if (id_metodo === 5) {
    // Efectivo generalmente no requiere campos adicionales más allá del alias
    if (!body.alias || body.alias.trim() === '') {
      errores.push('Se requiere un identificador para el método de efectivo');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Normalizar body del frontend al formato del backend
 * Mapea campos específicos de cada tipo de método de pago
 */
function normalizarBodyMetodoPago(body) {
  const bodyNormalizado = { ...body };

  // Eliminar el campo save_method (no necesario en backend)
  delete bodyNormalizado.save_method;

  // Mapear campos según el tipo de método
  
  // TARJETA DE CRÉDITO/DÉBITO
  if (body.numero_tarjeta) {
    // Si viene el número completo, extraer solo los últimos 4 dígitos
    const ultimosCuatro = body.numero_tarjeta.replace(/\s/g, '').slice(-4);
    bodyNormalizado.numero_tarjeta_ultimos_4 = ultimosCuatro;
    delete bodyNormalizado.numero_tarjeta;
    
    // No se envía CVV al backend, solo se valida en frontend
    delete bodyNormalizado.cvv;

    // Convertir fecha de "12/25" a "2025-12-31"
    if (body.fecha_expiracion && body.fecha_expiracion.includes('/')) {
      const [mes, anio] = body.fecha_expiracion.split('/');
      const anioCompleto = '20' + anio;
      bodyNormalizado.fecha_expiracion = `${anioCompleto}-${mes}-01`;
    }
  }

  // BILLETERA DIGITAL (PAYPAL)
  if (body.email_paypal) {
    bodyNormalizado.email_billetera = body.email_paypal;
    delete bodyNormalizado.email_paypal;
  }

  // TRANSFERENCIA BANCARIA
  if (body.numero_transaccion) {
    bodyNormalizado.identificador_externo = body.numero_transaccion;
    delete bodyNormalizado.numero_transaccion;
  }

  if (body.banco_origen) {
    bodyNormalizado.banco = body.banco_origen;
    delete bodyNormalizado.banco_origen;
  }

  if (body.titular_cuenta) {
    bodyNormalizado.nombre_titular = body.titular_cuenta;
    delete bodyNormalizado.titular_cuenta;
  }

  // CRIPTOMONEDA (BITCOIN)
  if (body.wallet_address) {
    bodyNormalizado.identificador_externo = body.wallet_address;
    delete bodyNormalizado.wallet_address;
  }

  // EFECTIVO (CONTRA ENTREGA)
  if (body.entrega) {
    bodyNormalizado.identificador_externo = body.entrega;
    delete bodyNormalizado.entrega;
  }

  return bodyNormalizado;
}

class MetodoPagoClienteController {
  
  async createMetodoPagoCliente(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      // Validar que el body no esté vacío
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El cuerpo de la solicitud no puede estar vacío',
          code: 'BODY_VACIO'
        });
      }

      // Validar campos requeridos
      const validacion = validarBodyMetodoPago(req.body);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          message: 'Validación de datos fallida',
          code: 'VALIDACION_FALLIDA',
          errores: validacion.errores
        });
      }

      // Normalizar campos del frontend al formato del backend
      const body = normalizarBodyMetodoPago(req.body);

      const metodoPagoCliente = await metodoPagoClienteService.createMetodoPagoCliente(body, req.user.id_cliente);
      res.status(201).json(response.created(metodoPagoCliente, 'Método de pago guardado exitosamente'));
    } catch (error) {
      console.error('Error en createMetodoPagoCliente:', error);
      
      // Errores específicos
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación en la base de datos',
          code: 'VALIDACION_BD',
          errores: error.errors.map(e => e.message)
        });
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un método de pago con los mismos datos',
          code: 'DUPLICADO',
          detalle: 'Verifica que el método de pago no esté registrado previamente'
        });
      }

      if (error.message && error.message.includes('No existe')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Error al crear el método de pago',
        code: 'ERROR_CREAR_METODO'
      });
    }
  }

  async getMetodosPagoByCliente(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { activo, verificado, es_predeterminado } = req.query;
      
      // Validar parámetros de query
      const filtrosValidos = { 'true': true, 'false': false };
      if (activo && !['true', 'false'].includes(activo.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro "activo" debe ser true o false',
          code: 'PARAMETRO_INVALIDO'
        });
      }
      
      const options = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        verificado: verificado !== undefined ? verificado === 'true' : undefined,
        es_predeterminado: es_predeterminado !== undefined ? es_predeterminado === 'true' : undefined
      };

      const metodosPago = await metodoPagoClienteService.getMetodosPagoByCliente(req.user.id_cliente, options);
      
      res.status(200).json(response.success(metodosPago, metodosPago.length > 0 ? 'Métodos de pago obtenidos exitosamente' : 'No hay métodos de pago registrados'));
    } catch (error) {
      console.error('Error en getMetodosPagoByCliente:', error);
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error al obtener los métodos de pago',
        code: 'ERROR_OBTENER_METODOS'
      });
    }
  }

  async getMetodoPagoClienteById(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { id } = req.params;

      // Validar parámetro id
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_INVALIDO'
        });
      }

      const metodoPagoCliente = await metodoPagoClienteService.getMetodoPagoClienteById(id);
      
      if (!metodoPagoCliente) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      // Verificar que el método de pago pertenece al cliente autenticado
      if (metodoPagoCliente.id_cliente !== req.user.id_cliente) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este método de pago',
          code: 'ACCESO_DENEGADO'
        });
      }

      res.status(200).json(response.success(metodoPagoCliente));
    } catch (error) {
      console.error('Error en getMetodoPagoClienteById:', error);
      
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error al obtener el método de pago',
        code: 'ERROR_OBTENER_METODO'
      });
    }
  }

  async updateMetodoPagoCliente(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { id } = req.params;

      // Validar parámetro id
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_INVALIDO'
        });
      }

      // Validar que el body no esté vacío
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El cuerpo de la solicitud no puede estar vacío',
          code: 'BODY_VACIO'
        });
      }

      // Normalizar campos del frontend al formato del backend
      const body = normalizarBodyMetodoPago(req.body);

      const metodoPagoCliente = await metodoPagoClienteService.updateMetodoPagoCliente(id, body, req.user.id_cliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago actualizado exitosamente'));
    } catch (error) {
      console.error('Error en updateMetodoPagoCliente:', error);
      
      if (error.message && error.message.includes('No tienes acceso')) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este método de pago',
          code: 'ACCESO_DENEGADO'
        });
      }

      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación en los datos',
          code: 'VALIDACION_FALLIDA',
          errores: error.errors.map(e => e.message)
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 400).json({
        success: false,
        message: 'Error al actualizar el método de pago',
        code: 'ERROR_ACTUALIZAR_METODO'
      });
    }
  }

  async deleteMetodoPagoCliente(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { id } = req.params;

      // Validar parámetro id
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_INVALIDO'
        });
      }

      await metodoPagoClienteService.deleteMetodoPagoCliente(id, req.user.id_cliente);
      res.status(200).json(response.success(null, 'Método de pago eliminado exitosamente'));
    } catch (error) {
      console.error('Error en deleteMetodoPagoCliente:', error);
      
      if (error.message && error.message.includes('No tienes acceso')) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este método de pago',
          code: 'ACCESO_DENEGADO'
        });
      }

      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      if (error.message && error.message.includes('predeterminado')) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el método de pago predeterminado. Asigna otro como predeterminado primero.',
          code: 'METODO_PREDETERMINADO',
          detalle: 'Establece otro método de pago como predeterminado antes de eliminar este'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error al eliminar el método de pago',
        code: 'ERROR_ELIMINAR_METODO'
      });
    }
  }

  async getDefaultMetodoPago(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const metodoPago = await metodoPagoClienteService.getDefaultMetodoPago(req.user.id_cliente);
      
      if (!metodoPago) {
        return res.status(404).json({
          success: false,
          message: 'No tienes un método de pago predeterminado configurado',
          code: 'SIN_METODO_PREDETERMINADO',
          detalle: 'Registra un método de pago y establécelo como predeterminado'
        });
      }

      res.status(200).json(response.success(metodoPago));
    } catch (error) {
      console.error('Error en getDefaultMetodoPago:', error);
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error al obtener el método de pago predeterminado',
        code: 'ERROR_OBTENER_METODO_PREDETERMINADO'
      });
    }
  }

  async setAsDefault(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { id } = req.params;

      // Validar parámetro id
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_INVALIDO'
        });
      }

      const metodoPagoCliente = await metodoPagoClienteService.setAsDefault(id, req.user.id_cliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago establecido como predeterminado'));
    } catch (error) {
      console.error('Error en setAsDefault:', error);
      
      if (error.message && error.message.includes('No tienes acceso')) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cambiar este método de pago',
          code: 'ACCESO_DENEGADO'
        });
      }

      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 400).json({
        success: false,
        message: 'Error al establecer el método de pago como predeterminado',
        code: 'ERROR_ESTABLECER_PREDETERMINADO'
      });
    }
  }

  async verifyMetodoPago(req, res) {
    try {
      // Verificar que el usuario tiene perfil de cliente
      if (!req.user || !req.user.id_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Acceso denegado: El usuario no tiene un perfil de cliente asociado',
          code: 'CLIENTE_NO_AUTENTICADO'
        });
      }

      const { id } = req.params;

      // Validar parámetro id
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_INVALIDO'
        });
      }

      const metodoPagoCliente = await metodoPagoClienteService.verifyMetodoPago(id, req.user.id_cliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago verificado exitosamente'));
    } catch (error) {
      console.error('Error en verifyMetodoPago:', error);
      
      if (error.message && error.message.includes('No tienes acceso')) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para verificar este método de pago',
          code: 'ACCESO_DENEGADO'
        });
      }

      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado',
          code: 'METODO_NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 400).json({
        success: false,
        message: 'Error al verificar el método de pago',
        code: 'ERROR_VERIFICAR_METODO'
      });
    }
  }

  // Endpoint para administradores - obtener métodos de pago de cualquier cliente
  async getMetodosPagoByClienteAdmin(req, res) {
    try {
      const { idCliente } = req.params;
      
      // Validar que se proporcione idCliente
      if (!idCliente || isNaN(idCliente)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del cliente debe ser un número válido',
          code: 'ID_CLIENTE_INVALIDO'
        });
      }

      const { activo, verificado, es_predeterminado } = req.query;
      
      const options = {
        activo: activo !== undefined ? activo === 'true' : undefined,
        verificado: verificado !== undefined ? verificado === 'true' : undefined,
        es_predeterminado: es_predeterminado !== undefined ? es_predeterminado === 'true' : undefined
      };

      const metodosPago = await metodoPagoClienteService.getMetodosPagoByCliente(idCliente, options);
      res.status(200).json(response.success(metodosPago));
    } catch (error) {
      console.error('Error en getMetodosPagoByClienteAdmin:', error);
      
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
          code: 'CLIENTE_NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error al obtener los métodos de pago del cliente',
        code: 'ERROR_OBTENER_METODOS_ADMIN'
      });
    }
  }

  // Endpoint para administradores - verificar método de pago de cualquier cliente
  async verifyMetodoPagoAdmin(req, res) {
    try {
      const { id } = req.params;
      const { idCliente } = req.body;

      // Validar parámetros
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del método de pago debe ser un número válido',
          code: 'ID_METODO_INVALIDO'
        });
      }

      if (!idCliente || isNaN(idCliente)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del cliente en el body debe ser un número válido',
          code: 'ID_CLIENTE_INVALIDO'
        });
      }

      const metodoPagoCliente = await metodoPagoClienteService.verifyMetodoPago(id, idCliente);
      res.status(200).json(response.success(metodoPagoCliente, 'Método de pago verificado exitosamente'));
    } catch (error) {
      console.error('Error en verifyMetodoPagoAdmin:', error);
      
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago o cliente no encontrado',
          code: 'NO_ENCONTRADO'
        });
      }

      const err = response.handleError(error);
      res.status(err.statusCode || 400).json({
        success: false,
        message: 'Error al verificar el método de pago',
        code: 'ERROR_VERIFICAR_METODO_ADMIN'
      });
    }
  }
}

export default new MetodoPagoClienteController();