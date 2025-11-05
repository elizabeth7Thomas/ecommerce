/**
 * UTILIDAD DE RESPUESTAS HTTP ESTANDARIZADAS
 * ==========================================
 * 
 * Este módulo proporciona funciones para estandarizar todas las respuestas
 * HTTP de la API, asegurando consistencia en:
 * - Estructura de datos
 * - Códigos de estado HTTP
 * - Mensajes de error
 * - Formato de respuestas exitosas
 */

/**
 * Respuesta exitosa genérica (200 OK)
 * @param {*} data - Los datos a enviar
 * @param {string} message - Mensaje opcional
 * @returns {object} {success: true, data, message}
 */
export const success = (data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
};

/**
 * Respuesta de recurso creado (201 Created)
 * @param {*} data - El recurso creado
 * @param {string} message - Mensaje opcional
 * @returns {object} {success: true, data, message}
 */
export const created = (data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
};

/**
 * Respuesta de operación exitosa sin datos (204 No Content)
 * @param {string} message - Mensaje opcional
 * @returns {object} {success: true, message}
 */
export const noContent = (message = null) => {
  const response = { success: true };
  if (message) response.message = message;
  return response;
};

/**
 * Respuesta de error - Solicitud inválida (400 Bad Request)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const badRequest = (message) => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 400
  };
};

/**
 * Respuesta de error - No autenticado (401 Unauthorized)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const unauthorized = (message = 'No autenticado') => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 401
  };
};

/**
 * Respuesta de error - Acceso denegado (403 Forbidden)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const forbidden = (message = 'Acceso denegado') => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 403
  };
};

/**
 * Respuesta de error - Recurso no encontrado (404 Not Found)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const notFound = (message = 'Recurso no encontrado') => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 404
  };
};

/**
 * Respuesta de error - Conflicto (409 Conflict)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const conflict = (message) => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 409
  };
};

/**
 * Respuesta de error - Error interno (500 Internal Server Error)
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error}
 */
export const internalError = (message = 'Error interno del servidor') => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode: 500
  };
};

/**
 * Respuesta genérica de error con código de estado personalizado
 * @param {number} statusCode - Código de estado HTTP
 * @param {string|Error} message - Mensaje de error
 * @returns {object} {success: false, error, statusCode}
 */
export const customError = (statusCode, message) => {
  return {
    success: false,
    error: message instanceof Error ? message.message : message,
    statusCode
  };
};

/**
 * Mapear un Error a la respuesta HTTP apropiada
 * @param {Error} error - El error a procesar
 * @returns {object} {success: false, error, statusCode}
 */
export const handleError = (error) => {
  const message = error?.message || 'Error desconocido';

  // Detectar el tipo de error automáticamente
  if (message.includes('no encontrado')) return notFound(message);
  if (message.includes('ya existe')) return conflict(message);
  if (message.includes('requerido') || message.includes('inválido')) return badRequest(message);
  if (message.includes('insuficiente')) return badRequest(message);
  if (message.includes('Acceso denegado')) return forbidden(message);
  if (message.includes('No autenticado')) return unauthorized(message);

  // Error genérico
  return internalError(message);
};

export default {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
  customError,
  handleError
};
