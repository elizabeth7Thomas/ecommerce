import express from 'express';
import CotizacionesItemsController from '../controllers/cotizacionesItems.controller.js';

const router = express.Router();

// Rutas independientes para Items de Cotización
router.post('/', CotizacionesItemsController.agregarItemACotizacion);
router.get('/', CotizacionesItemsController.getItemsByCotizacion); // Usar query params
router.get('/producto/:idProducto', CotizacionesItemsController.getCotizacionesByProducto);
router.get('/productos-mas-cotizados', CotizacionesItemsController.getProductosMasCotizados);
router.get('/calcular/subtotal', CotizacionesItemsController.calcularSubtotal);
router.get('/calcular/descuento', CotizacionesItemsController.calcularDescuentoMoneda);
router.post('/duplicar', CotizacionesItemsController.duplicarItemsCotizacion);

// Rutas específicas por ID de item
router.get('/:id', CotizacionesItemsController.getItemById);
router.put('/:id', CotizacionesItemsController.updateCotizacionItem);
router.patch('/:id/cantidad', CotizacionesItemsController.actualizarCantidad);
router.patch('/:id/precio', CotizacionesItemsController.actualizarPrecio);
router.patch('/:id/descuento', CotizacionesItemsController.actualizarDescuento);
router.delete('/:id', CotizacionesItemsController.eliminarItem);

// Rutas de verificación
router.get('/:idCotizacion/verificar/:idProducto', CotizacionesItemsController.verificarProductoEnCotizacion);

export default router;