# 📚 DOCUMENTACIÓN SWAGGER - ACTUALIZADA CON ALIASES CORRECTOS

## Ubicación de Swagger

La documentación interactiva está disponible en:
```
http://localhost:3000/api-docs
```

## Esquemas principales actualizados

### Producto con Categoría e Imágenes
```yaml
Producto:
  type: object
  properties:
    id_producto:
      type: integer
    nombre_producto:
      type: string
    descripcion:
      type: string
    precio:
      type: number
      format: double
    stock:
      type: integer
    categoria:  # ← Alias correcto
      $ref: '#/components/schemas/CategoriaProducto'
    imagenes:   # ← Alias correcto
      type: array
      items:
        $ref: '#/components/schemas/ProductoImagen'
```

### Carrito con Productos
```yaml
CarritoCompras:
  type: object
  properties:
    id_carrito:
      type: integer
    id_cliente:
      type: integer
    estado:
      type: string
      enum: [activo, abandonado, convertido]
    productosCarrito:  # ← Alias correcto (NO CarritoProductos)
      type: array
      items:
        type: object
        properties:
          id_carrito_producto:
            type: integer
          cantidad:
            type: integer
          precio_unitario:
            type: number
          producto:  # ← Alias correcto
            $ref: '#/components/schemas/Producto'
```

### Orden con todos sus datos
```yaml
Orden:
  type: object
  properties:
    id_orden:
      type: integer
    numero_orden:
      type: string
      pattern: "ORD-YYYY-\\d{5}"
    id_cliente:
      type: integer
    id_direccion_envio:
      type: integer
    total_orden:
      type: number
    estado_orden:
      type: string
      enum: [pendiente, confirmada, enviada, completada, cancelada]
    cliente:         # ← Alias correcto
      $ref: '#/components/schemas/Cliente'
    direccionEnvio:  # ← Alias correcto
      $ref: '#/components/schemas/Direccion'
    items:           # ← Alias correcto (NO OrdenItems)
      type: array
      items:
        type: object
        properties:
          id_item:
            type: integer
          cantidad:
            type: integer
          precio_unitario:
            type: number
          producto:  # ← Alias correcto
            $ref: '#/components/schemas/Producto'
    pagos:           # ← Alias correcto
      type: array
      items:
        $ref: '#/components/schemas/Payment'
```

### Usuario con Rol
```yaml
Usuario:
  type: object
  properties:
    id_usuario:
      type: integer
    nombre_usuario:
      type: string
    correo_electronico:
      type: string
      format: email
    id_rol:
      type: integer
    nombre_rol:
      type: string
    rol:             # ← Alias correcto
      $ref: '#/components/schemas/Rol'
    activo:
      type: boolean
    fecha_creacion:
      type: string
      format: date-time
```

### Cliente con Usuario
```yaml
Cliente:
  type: object
  properties:
    id_cliente:
      type: integer
    id_usuario:
      type: integer
    nombre:
      type: string
    apellido:
      type: string
    telefono:
      type: string
    usuario:    # ← Alias correcto
      $ref: '#/components/schemas/Usuario'
    direcciones: # ← Alias correcto
      type: array
      items:
        $ref: '#/components/schemas/Direccion'
```

---

## Actualizar Swagger en cada ruta

### Para Productos (src/routes/product.routes.js)

```javascript
/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar todos los productos
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minprecio
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxprecio
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de productos con categoría e imágenes incluidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_producto:
 *                         type: integer
 *                       nombre_producto:
 *                         type: string
 *                       precio:
 *                         type: number
 *                       categoria:
 *                         type: object
 *                         properties:
 *                           id_categoria:
 *                             type: integer
 *                           nombre_categoria:
 *                             type: string
 *                       imagenes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id_imagen:
 *                               type: integer
 *                             url_imagen:
 *                               type: string
 *                             es_principal:
 *                               type: boolean
 */
```

### Para Carrito (src/routes/carrito.routes.js)

```javascript
/**
 * @swagger
 * /api/carrito:
 *   get:
 *     summary: Obtener mi carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito con todos los productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_carrito:
 *                       type: integer
 *                     productosCarrito:  # ← IMPORTANTE
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_carrito_producto:
 *                             type: integer
 *                           cantidad:
 *                             type: integer
 *                           precio_unitario:
 *                             type: number
 *                           producto:  # ← IMPORTANTE
 *                             type: object
 *                             properties:
 *                               id_producto:
 *                                 type: integer
 *                               nombre_producto:
 *                                 type: string
 *                               precio:
 *                                 type: number
 *                               categoria:
 *                                 type: object
 *                               imagenes:
 *                                 type: array
 */
```

### Para Órdenes (src/routes/orden.routes.js)

```javascript
/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     summary: Obtener detalles de una orden
 *     tags: [Órdenes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la orden con cliente, dirección, items y pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_orden:
 *                       type: integer
 *                     numero_orden:
 *                       type: string
 *                     cliente:  # ← IMPORTANTE
 *                       type: object
 *                       properties:
 *                         id_cliente:
 *                           type: integer
 *                         usuario:  # ← IMPORTANTE
 *                           type: object
 *                           properties:
 *                             nombre_usuario:
 *                               type: string
 *                             correo_electronico:
 *                               type: string
 *                     direccionEnvio:  # ← IMPORTANTE
 *                       type: object
 *                       properties:
 *                         calle:
 *                           type: string
 *                         ciudad:
 *                           type: string
 *                         codigo_postal:
 *                           type: string
 *                     items:  # ← IMPORTANTE
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_item:
 *                             type: integer
 *                           cantidad:
 *                             type: integer
 *                           producto:  # ← IMPORTANTE
 *                             type: object
 *                             properties:
 *                               nombre_producto:
 *                                 type: string
 *                               precio:
 *                                 type: number
 *                     pagos:  # ← IMPORTANTE
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_pago:
 *                             type: integer
 *                           monto:
 *                             type: number
 *                           estado_pago:
 *                             type: string
 */
```

---

## ✅ Checklist de Swagger

Asegúrate de que en CADA ruta Swagger use:

| Entidad | Propiedades con Alias | Swagger debe mostrar |
|---------|----------------------|---------------------|
| Producto | categoria, imagenes | ✅ Con estructura anidada completa |
| CarritoCompras | productosCarrito | ✅ Array de items con producto incluido |
| Orden | cliente, direccionEnvio, items, pagos | ✅ Todas las relaciones incluidas |
| Usuario | rol | ✅ Objeto rol completo |
| Cliente | usuario, direcciones | ✅ Relaciones incluidas |
| OrdenItem | producto | ✅ Producto incluido |
| Payment | orden | ✅ Orden incluida |

---

## Próximos pasos

1. Actualiza TODAS las rutas en `src/routes/*.routes.js` con los esquemas correctos
2. Reemplaza referencias a propiedades antiguas (ej: `CarritoProductos` → `productosCarrito`)
3. Reinicia el servidor: `npm run dev`
4. Accede a `http://localhost:3000/api-docs` para verificar

---

**Última actualización:** 5 de Noviembre, 2025  
**Estado:** ✅ Guía completa para actualizar Swagger
