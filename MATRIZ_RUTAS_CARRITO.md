# 📊 MATRIZ DE RUTAS - CARRITO PRODUCTOS

## 🎯 Matriz de Operaciones

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                      CARRITO DE PRODUCTOS - ENDPOINTS                         ║
║                           /api/carrito-productos                               ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 Tabla de Operaciones

### CREAR (POST)

| Ruta | Descripción | Parámetros | Respuesta |
|------|-------------|-----------|-----------|
| `POST /` | Agregar producto al carrito | `id_carrito`, `id_producto`, `cantidad`, `precio_unitario` | 201 + CarritoProducto |

---

### LEER (GET)

| Ruta | Descripción | Parámetros | Respuesta |
|------|-------------|-----------|-----------|
| `GET /:id` | Obtener por ID | `id` (path) | 200 + CarritoProducto |
| `GET /carrito/:idCarrito` | Listar por carrito | `idCarrito` (path) | 200 + Array[CarritoProducto] |
| `GET /carrito/:idCarrito/producto/:idProducto` | Obtener específico | `idCarrito`, `idProducto` (path) | 200 + CarritoProducto |
| `GET /:idCarrito/resumen` | Resumen con totales | `idCarrito` (path) | 200 + ResumenCarrito |
| `GET /:idCarrito/estadisticas` | Estadísticas | `idCarrito` (path) | 200 + EstadisticasCarrito |
| `GET /:idCarrito/verificar/:idProducto` | Verificar existencia | `idCarrito`, `idProducto` (path) | 200 + {existe: boolean} |

---

### ACTUALIZAR (PUT/PATCH)

| Ruta | Método | Descripción | Body | Respuesta |
|------|--------|-------------|------|-----------|
| `/:id` | `PUT` | Actualizar completo | `{cantidad, precio_unitario}` | 200 + CarritoProducto |
| `/:id/cantidad` | `PATCH` | Actualizar solo cantidad | `{cantidad}` | 200 + CarritoProducto |
| `/:id/precio` | `PATCH` | Actualizar solo precio | `{precio_unitario}` | 200 + CarritoProducto |

---

### ELIMINAR (DELETE)

| Ruta | Descripción | Parámetros | Respuesta |
|------|-------------|-----------|-----------|
| `DELETE /:id` | Eliminar por ID | `id` (path) | 200 + message |
| `DELETE /:idCarrito/producto/:idProducto` | Eliminar específico | `idCarrito`, `idProducto` (path) | 200 + message |
| `DELETE /:idCarrito/vaciar` | Vaciar carrito | `idCarrito` (path) | 200 + message |

---

## 🔍 Matriz de Parámetros

### Path Parameters

```
:id                    → ID del carrito_producto (Entero)
:idCarrito             → ID del carrito (Entero)
:idProducto            → ID del producto (Entero)
```

### Body Parameters (POST/PUT/PATCH)

```
id_carrito             → ID del carrito (Entero, Requerido)
id_producto            → ID del producto (Entero, Requerido)
cantidad               → Cantidad de unidades (Entero ≥ 1, Requerido)
precio_unitario        → Precio por unidad (Decimal ≥ 0, Requerido)
```

### Query Parameters

```
Ninguno implementado actualmente
```

---

## 🛡️ Seguridad

### Headers Requeridos

```
Header                  Valor                           Requerido
─────────────────────────────────────────────────────────────────
Authorization          Bearer {token}                  Sí
Content-Type           application/json                Sí (POST/PUT/PATCH)
X-API-Version          v1 (opcional)                   No
```

### Autenticación

✅ Todos los endpoints requieren autenticación  
✅ Token Bearer en Authorization header  
✅ Validación en middleware `verifyToken`  

---

## 📊 Matriz de Respuestas

### Códigos de Éxito

```
Código   Método      Significado
──────   ──────      ───────────────────────────────
200      GET/PUT/    OK - Operación completada
         PATCH
201      POST        Created - Recurso creado
         DELETE
```

### Códigos de Error

```
Código   Significado              Causas
──────   ───────────────────────  ────────────────────────────────
400      Bad Request              • Datos inválidos
                                  • Campos requeridos faltantes
                                  • Formato incorrecto

401      Unauthorized             • Token no proporcionado
                                  • Token expirado
                                  • Token inválido

404      Not Found                • Carrito no existe
                                  • Producto no existe
                                  • Item no encontrado

409      Conflict                 • Producto ya en carrito
                                  • Estado inconsistente

500      Server Error             • Error interno del servidor
                                  • Error de BD
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Compra Básica
```
1. POST   /                       → Agregar producto
2. GET    /carrito/:id            → Listar contenido
3. GET    /:id/resumen            → Ver total
4. DELETE /:id/vaciar             → Limpiar después de comprar
```

### Flujo 2: Modificar Cantidad
```
1. GET    /:id/verificar/:pid     → Verificar si existe
2. PATCH  /:id/cantidad           → Cambiar cantidad
3. GET    /:id/resumen            → Ver nuevo total
```

### Flujo 3: Gestión de Precios
```
1. GET    /carrito/:id/producto/:pid → Ver precio actual
2. PATCH  /:id/precio             → Actualizar precio
3. GET    /:id/estadisticas       → Ver estadísticas
```

---

## 📈 Estructura de Datos

### Request CarritoProducto (POST)

```javascript
{
  "id_carrito": 5,           // Entero, Requerido
  "id_producto": 10,         // Entero, Requerido
  "cantidad": 2,             // Entero ≥ 1, Requerido
  "precio_unitario": 1299.99 // Decimal ≥ 0, Requerido
}
```

### Response CarritoProducto (GET/POST/PUT)

```javascript
{
  "success": true,
  "data": {
    "id_carrito_producto": 1,
    "id_carrito": 5,
    "id_producto": 10,
    "cantidad": 2,
    "precio_unitario": 1299.99,
    "producto": {
      "id_producto": 10,
      "nombre_producto": "Laptop Gaming Pro",
      "precio": 1299.99,
      "categoria": {
        "id_categoria": 1,
        "nombre_categoria": "Electrónica"
      }
    }
  },
  "message": "Producto agregado al carrito exitosamente"
}
```

### Response ResumenCarrito (GET)

```javascript
{
  "success": true,
  "data": {
    "totalProductos": 2,      // Productos únicos
    "totalCantidad": 3,       // Unidades totales
    "subtotal": 2199.97,      // Sin IVA
    "iva": 329.996,           // 19% del subtotal
    "total": 2529.966,        // Subtotal + IVA
    "productos": [...]        // Array de items
  }
}
```

### Response EstadisticasCarrito (GET)

```javascript
{
  "success": true,
  "data": {
    "totalItems": 2,
    "totalCantidad": 3,
    "montoTotal": 2529.966,
    "promedioPorProducto": 1264.98,
    "productoMasCaro": {
      "id_carrito_producto": 1,
      "precio_unitario": 1299.99
    },
    "productoMasBarato": {
      "id_carrito_producto": 2,
      "precio_unitario": 599.99
    }
  }
}
```

---

## ✅ Validaciones

### Validación de Entrada

```
Campo               Tipo      Rango      Requerido
─────────────────────────────────────────────────────
id_carrito          Entero    > 0        Sí
id_producto         Entero    > 0        Sí
cantidad            Entero    ≥ 1        Sí
precio_unitario     Decimal   ≥ 0        Sí
```

### Validación de Negocio

```
✓ Carrito debe existir
✓ Producto debe existir
✓ Cantidad debe ser positiva
✓ Precio no puede ser negativo
✓ Solo se permite 1 entrada por producto por carrito
✓ La cantidad máxima depende del stock
```

---

## 🚀 Ejemplos de Integración

### JavaScript/Fetch

```javascript
// Agregar producto
fetch('/api/carrito-productos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id_carrito: 5,
    id_producto: 10,
    cantidad: 2,
    precio_unitario: 1299.99
  })
}).then(r => r.json()).then(console.log);

// Ver resumen
fetch('/api/carrito-productos/5/resumen', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

### cURL

```bash
# Agregar
curl -X POST http://localhost:3000/api/carrito-productos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_carrito":5,"id_producto":10,"cantidad":2,"precio_unitario":1299.99}'

# Ver resumen
curl http://localhost:3000/api/carrito-productos/5/resumen \
  -H "Authorization: Bearer TOKEN"

# Actualizar cantidad
curl -X PATCH http://localhost:3000/api/carrito-productos/1/cantidad \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad":5}'
```

---

## 📝 Notas Importantes

1. **IVA Automático**: Se calcula automáticamente al 19% en el resumen
2. **Token Obligatorio**: Todos los endpoints requieren autenticación
3. **Validación Estricta**: Los datos se validan antes de procesarse
4. **Cascada de Eliminación**: Al vaciar carrito se eliminan todos los items
5. **Integridad Referencial**: Se valida la existencia de carrito y producto
6. **Respuestas Consistentes**: Todas usan el mismo formato de response

---

**Documentación generada:** 10 de Noviembre, 2025  
**Versión:** 1.0  
**Estado:** ✅ Completa y documentada
