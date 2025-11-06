# 📖 REFERENCIA RÁPIDA - ESTRUCTURA DE DATOS EN RESPUESTAS API

Este documento muestra la estructura exacta de datos que recibirá el frontend en cada endpoint, basado en los aliases configurados en Sequelize.

---

## 🔄 Mapeeo de Aliases (Cómo acceder a datos en relaciones)

**IMPORTANTE:** Después de las correcciones de alias, los datos vienen en propiedades específicas:

| Modelo | Relación | Propiedad en Response | Ejemplo |
|--------|----------|----------------------|---------|
| Usuario | → Rol | `rol` | `usuario.rol.nombre_rol` |
| Cliente | → Usuario | `usuario` | `cliente.usuario.nombre_usuario` |
| Producto | → Categoría | `categoria` | `producto.categoria.nombre_categoria` |
| Producto | → Imágenes | `imagenes` | `producto.imagenes[0].url_imagen` |
| CarritoCompras | → CarritoProductos | `productosCarrito` | `carrito.productosCarrito[0]` |
| CarritoProducto | → Producto | `producto` | `carritoProducto.producto.nombre_producto` |
| Orden | → Cliente | `cliente` | `orden.cliente.id_cliente` |
| Orden | → Dirección Envío | `direccionEnvio` | `orden.direccionEnvio.calle` |
| Orden | → Items | `items` | `orden.items[0]` |
| OrdenItem | → Producto | `producto` | `ordenItem.producto.nombre_producto` |
| Payment | → Orden | `orden` | `payment.orden.id_orden` |

---

## 📦 EJEMPLOS DE RESPUESTAS COMPLETAS

### 1. GET /api/productos/:id (Producto con todo incluido)

```json
{
  "success": true,
  "data": {
    "id_producto": 5,
    "nombre_producto": "Laptop Gaming Pro",
    "descripcion": "Laptop de alto rendimiento",
    "precio": 1299.99,
    "stock": 10,
    "activo": true,
    "fecha_creacion": "2025-11-05T10:30:00.000Z",
    "fecha_actualizacion": "2025-11-05T10:30:00.000Z",
    
    "categoria": {
      "id_categoria": 2,
      "nombre_categoria": "Electrónica",
      "descripcion": "Equipos electrónicos",
      "activo": true
    },
    
    "imagenes": [
      {
        "id_imagen": 15,
        "id_producto": 5,
        "url_imagen": "https://cdn.example.com/imagen1.jpg",
        "es_principal": true,
        "fecha_carga": "2025-11-05T10:30:00.000Z"
      },
      {
        "id_imagen": 16,
        "id_producto": 5,
        "url_imagen": "https://cdn.example.com/imagen2.jpg",
        "es_principal": false,
        "fecha_carga": "2025-11-05T10:31:00.000Z"
      }
    ]
  }
}
```

**Cómo acceder en frontend:**
```javascript
const producto = response.data;
console.log(producto.categoria.nombre_categoria);  // "Electrónica"
console.log(producto.imagenes[0].url_imagen);      // URL principal
```

---

### 2. GET /api/carrito (Carrito con productos)

```json
{
  "success": true,
  "data": {
    "id_carrito": 3,
    "id_cliente": 1,
    "estado": "activo",
    "fecha_creacion": "2025-11-05T10:00:00.000Z",
    
    "productosCarrito": [
      {
        "id_carrito_producto": 10,
        "id_carrito": 3,
        "id_producto": 5,
        "cantidad": 2,
        "precio_unitario": 1299.99,
        "fecha_agregado": "2025-11-05T10:15:00.000Z",
        
        "producto": {
          "id_producto": 5,
          "nombre_producto": "Laptop Gaming Pro",
          "descripcion": "Laptop de alto rendimiento",
          "precio": 1299.99,
          "stock": 8,
          
          "categoria": {
            "id_categoria": 2,
            "nombre_categoria": "Electrónica"
          },
          
          "imagenes": [
            {
              "id_imagen": 15,
              "url_imagen": "https://cdn.example.com/imagen1.jpg",
              "es_principal": true
            }
          ]
        }
      },
      {
        "id_carrito_producto": 11,
        "id_carrito": 3,
        "id_producto": 8,
        "cantidad": 1,
        "precio_unitario": 49.99,
        
        "producto": {
          "id_producto": 8,
          "nombre_producto": "Mouse Gamer",
          "precio": 49.99,
          "stock": 100,
          "categoria": {
            "id_categoria": 2,
            "nombre_categoria": "Accesorios"
          }
        }
      }
    ]
  }
}
```

**Cómo acceder en frontend:**
```javascript
const carrito = response.data;
carrito.productosCarrito.forEach(item => {
  console.log(item.producto.nombre_producto);     // "Laptop Gaming Pro"
  console.log(item.cantidad);                       // 2
  console.log(item.producto.precio);               // 1299.99
  const subtotal = item.cantidad * item.precio_unitario;
  console.log(subtotal);                            // 2599.98
});
```

---

### 3. GET /api/ordenes/:id (Orden completa con todo)

```json
{
  "success": true,
  "data": {
    "id_orden": 25,
    "numero_orden": "ORD-2025-00025",
    "id_cliente": 1,
    "id_direccion_envio": 5,
    "total_orden": 2699.96,
    "estado_orden": "pendiente",
    "notas_orden": "Entregar entre 10am y 6pm",
    "fecha_creacion": "2025-11-05T14:30:00.000Z",
    "fecha_actualizacion": "2025-11-05T14:30:00.000Z",
    
    "cliente": {
      "id_cliente": 1,
      "id_usuario": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "telefono": "555-1234",
      "fecha_registro": "2025-11-01T10:00:00.000Z",
      
      "usuario": {
        "id_usuario": 5,
        "nombre_usuario": "juan_perez",
        "correo_electronico": "juan@example.com"
      }
    },
    
    "direccionEnvio": {
      "id_direccion": 5,
      "id_cliente": 1,
      "calle": "Calle Principal 123",
      "ciudad": "Madrid",
      "codigo_postal": "28001",
      "pais": "España",
      "telefono": "555-1234",
      "es_principal": true
    },
    
    "items": [
      {
        "id_item": 50,
        "id_orden": 25,
        "id_producto": 5,
        "cantidad": 2,
        "precio_unitario": 1299.99,
        "fecha_creacion": "2025-11-05T14:30:00.000Z",
        
        "producto": {
          "id_producto": 5,
          "nombre_producto": "Laptop Gaming Pro",
          "precio": 1299.99,
          "descripcion": "Laptop de alto rendimiento",
          "stock": 6
        }
      },
      {
        "id_item": 51,
        "id_orden": 25,
        "id_producto": 8,
        "cantidad": 1,
        "precio_unitario": 49.99,
        
        "producto": {
          "id_producto": 8,
          "nombre_producto": "Mouse Gamer",
          "precio": 49.99
        }
      }
    ],
    
    "pagos": [
      {
        "id_pago": 12,
        "id_orden": 25,
        "monto": 2699.96,
        "metodo_pago": "tarjeta_credito",
        "estado_pago": "completado",
        "referencia_pago": "TXN-123456789",
        "fecha_creacion": "2025-11-05T14:31:00.000Z"
      }
    ]
  }
}
```

**Cómo acceder en frontend:**
```javascript
const orden = response.data;

// Datos de cliente
console.log(orden.cliente.usuario.nombre_usuario);  // "juan_perez"
console.log(orden.cliente.usuario.correo_electronico); // "juan@example.com"

// Dirección de envío
console.log(orden.direccionEnvio.calle);  // "Calle Principal 123"

// Items
orden.items.forEach(item => {
  console.log(item.producto.nombre_producto);  // "Laptop Gaming Pro"
  console.log(item.cantidad);                   // 2
});

// Pagos
const pagoPrincipal = orden.pagos[0];
console.log(pagoPrincipal.estado_pago);  // "completado"
```

---

### 4. GET /api/auth/profile (Perfil de usuario)

```json
{
  "success": true,
  "data": {
    "id_usuario": 5,
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "activo": true,
    "fecha_creacion": "2025-11-01T10:00:00.000Z",
    
    "rol": {
      "id_rol": 2,
      "nombre_rol": "cliente",
      "descripcion": "Usuario cliente",
      "permisos": {
        "ver_productos": true,
        "comprar": true,
        "crear_orden": true
      }
    }
  }
}
```

**Cómo acceder:**
```javascript
const perfil = response.data;
console.log(perfil.rol.nombre_rol);  // "cliente"
```

---

## ⚠️ ERRORES COMUNES

### ❌ Acceso incorrecto (generará undefined)
```javascript
// INCORRECTO - Usando nombres sin alias
const categoria = producto.CategoriaProducto;      // undefined
const items = orden.OrdenItems;                     // undefined
const carrito_items = carrito.CarritoProductos;    // undefined

// CORRECTO - Usando los aliases
const categoria = producto.categoria;               // ✅
const items = orden.items;                          // ✅
const carrito_items = carrito.productosCarrito;    // ✅
```

---

## 📋 CHECKLIST PARA EL FRONTEND

Al consumir cada endpoint, verifica:

- [ ] **Productos**: Accedo a `producto.categoria` y `producto.imagenes`
- [ ] **Carrito**: Accedo a `carrito.productosCarrito` y `carritoProducto.producto`
- [ ] **Órdenes**: Accedo a `orden.cliente`, `orden.items`, `orden.pagos`
- [ ] **Usuario**: Accedo a `usuario.rol`

---

## 🔗 Relación visual

```
Usuario
  ├─ rol (belongsTo Rol)
  └─ cliente (hasOne Cliente)
       ├─ usuario (belongsTo Usuario)
       ├─ direcciones (hasMany Direccion)
       ├─ carritos (hasMany CarritoCompras)
       │    └─ productosCarrito (hasMany CarritoProducto) ← ALIAS
       │         └─ producto (belongsTo Producto) ← ALIAS
       └─ ordenes (hasMany Orden)
            ├─ cliente (belongsTo Cliente) ← ALIAS
            ├─ direccionEnvio (belongsTo Direccion) ← ALIAS
            ├─ items (hasMany OrdenItem) ← ALIAS
            │    └─ producto (belongsTo Producto) ← ALIAS
            └─ pagos (hasMany Payment) ← ALIAS

Producto
  ├─ categoria (belongsTo CategoriaProducto) ← ALIAS
  └─ imagenes (hasMany ProductoImagen) ← ALIAS
```

---

**Última actualización:** 5 de Noviembre, 2025
**Estado:** ✅ Documentación actualizada con aliases correctos
