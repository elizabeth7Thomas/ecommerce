# 📊 FLUJO DE DATOS - DOCUMENTACIÓN PARA FRONTEND

## 🎯 FLUJO PRINCIPAL DE LA APLICACIÓN
```
[INICIO] → [REGISTRO] → [LOGIN] → [VER PRODUCTOS] → [CARRITO] → [CHECKOUT] → [PAGO] → [FINAL]
```

---

## 📍 ETAPA 1: AUTENTICACIÓN (AuthController)

### 1.1 REGISTRO DE USUARIO
```
POST /api/auth/register
Body: {
  "nombre_usuario": "juan_perez",
  "correo_electronico": "juan@example.com",
  "contrasena": "SecurePass123",
  "nombre_rol": "cliente"  // Opcional, por defecto es "cliente"
}

Response (201): {
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id_usuario": 5,
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "id_rol": 2,
    "nombre_rol": "cliente",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Guardar el token en localStorage:**
```javascript
localStorage.setItem('token', response.data.token);
localStorage.setItem('userId', response.data.id_usuario);
```

---

### 1.2 LOGIN
```
POST /api/auth/login
Body: {
  "correo_electronico": "juan@example.com",
  "contrasena": "SecurePass123"
}

Response (200): {
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id_usuario": 5,
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "id_rol": 2,
    "nombre_rol": "cliente",
    "permisos": { /* permisos del rol */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Importante:** En TODAS las siguientes peticiones, incluye el header:
```
Authorization: Bearer {token}
```

---

### 1.3 OBTENER PERFIL (Requiere Auth)
```
GET /api/auth/profile
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id_usuario": 5,
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "rol": {
      "id_rol": 2,
      "nombre_rol": "cliente",
      "descripcion": "Usuario cliente",
      "permisos": { /* permisos */ }
    },
    "fecha_creacion": "2025-11-05T10:30:00.000Z"
  }
}
```

---

### 1.4 ACTUALIZAR PERFIL (Requiere Auth)
```
PUT /api/auth/profile
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "nombre_usuario": "nuevo_nombre"
  // NO PUEDES cambiar: correo_electronico, rol
}

Response (200): { "success": true, "message": "Perfil actualizado..." }
```

---

### 1.5 CAMBIAR CONTRASEÑA (Requiere Auth)
```
PUT /api/auth/change-password
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "contrasena_actual": "SecurePass123",
  "contrasena_nueva": "NewSecurePass456"
}

Response (204): Sin contenido (actualización exitosa)
```

---

## 📍 ETAPA 2: GESTIÓN DE PERFIL CLIENTE (ClienteController)

### 2.1 OBTENER MI PERFIL DE CLIENTE (Requiere Auth)
```
GET /api/clientes/perfil
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": {
    "id_cliente": 3,
    "id_usuario": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "555-1234",
    "fecha_registro": "2025-11-05T10:30:00.000Z"
  }
}
```

### 2.2 CREAR PERFIL DE CLIENTE (Requiere Auth)
```
POST /api/clientes
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "555-1234"
}

Response (201): { "success": true, "data": { ...perfil creado... } }
```

### 2.3 ACTUALIZAR PERFIL DE CLIENTE (Requiere Auth)
```
PUT /api/clientes/:id
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "telefono": "555-5678"
}

Response (200): { "success": true, "data": { ...perfil actualizado... } }
```

---

## 📍 ETAPA 3: GESTIÓN DE DIRECCIONES (DireccionController)

### 3.1 LISTAR MIS DIRECCIONES (Requiere Auth)
```
GET /api/direcciones
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": [
    {
      "id_direccion": 1,
      "calle": "Calle Principal 123",
      "ciudad": "Madrid",
      "codigo_postal": "28001",
      "pais": "España",
      "es_principal": true
    },
    { ...más direcciones... }
  ]
}
```

### 3.2 CREAR DIRECCIÓN (Requiere Auth)
```
POST /api/direcciones
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "calle": "Calle Principal 123",
  "ciudad": "Madrid",
  "codigo_postal": "28001",
  "pais": "España",
  "es_principal": false
}

Response (201): { "success": true, "data": { ...dirección creada... } }
```

### 3.3 ACTUALIZAR DIRECCIÓN (Requiere Auth)
```
PUT /api/direcciones/:id
Headers: { "Authorization": "Bearer {token}" }
Body: { ...datos a actualizar... }

Response (200): { "success": true, "data": { ...dirección actualizada... } }
```

### 3.4 ELIMINAR DIRECCIÓN (Requiere Auth)
```
DELETE /api/direcciones/:id
Headers: { "Authorization": "Bearer {token}" }

Response (204): Sin contenido (eliminación exitosa)
```

---

## 📍 ETAPA 4: GESTIÓN DE PRODUCTOS (ProductoController)

### 4.1 LISTAR PRODUCTOS (Público - Sin Auth)
```
GET /api/productos
Query params (opcional):
  - ?categoria={id_categoria}
  - ?minprecio={num}
  - ?maxprecio={num}

Response (200): {
  "success": true,
  "data": [
    {
      "id_producto": 1,
      "nombre": "Laptop Gaming",
      "descripcion": "Laptop de alto rendimiento",
      "precio": 1200.00,
      "stock": 5,
      "imagenes": [
        {
          "id_imagen": 1,
          "url": "http://..../imagen1.jpg",
          "es_principal": true
        }
      ],
      "categoria": {
        "id_categoria": 2,
        "nombre_categoria": "Electrónica"
      }
    },
    { ...más productos... }
  ]
}
```

### 4.2 OBTENER UN PRODUCTO (Público - Sin Auth)
```
GET /api/productos/:id

Response (200): { "success": true, "data": { ...detalles producto... } }
```

### 4.3 LISTAR CATEGORÍAS (Público - Sin Auth)
```
GET /api/categorias

Response (200): {
  "success": true,
  "data": [
    {
      "id_categoria": 1,
      "nombre_categoria": "Ropa",
      "descripcion": "Ropa y accesorios"
    },
    { ...más categorías... }
  ]
}
```

---

## 📍 ETAPA 5: GESTIÓN DEL CARRITO (CarritoController)

### 5.1 OBTENER MI CARRITO (Requiere Auth)
```
GET /api/carrito
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": {
    "id_carrito": 5,
    "id_cliente": 3,
    "estado": "activo",
    "productosCarrito": [
      {
        "id_carrito_producto": 10,
        "cantidad": 2,
        "precio_unitario": 1200.00,
        "subtotal": 2400.00,
        "producto": {
          "id_producto": 1,
          "nombre": "Laptop Gaming",
          "precio": 1200.00
        }
      },
      { ...más productos en carrito... }
    ],
    "total": 2400.00
  }
}
```

### 5.2 AGREGAR PRODUCTO AL CARRITO (Requiere Auth)
```
POST /api/carrito
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "id_producto": 1,
  "cantidad": 2
}

Response (201): { "success": true, "data": { ...producto agregado... } }
```

### 5.3 ACTUALIZAR CANTIDAD EN CARRITO (Requiere Auth)
```
PUT /api/carrito/:id_producto
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "cantidad": 5  // Nueva cantidad
}

Response (200): { "success": true, "data": { ...actualizado... } }
```

### 5.4 ELIMINAR PRODUCTO DEL CARRITO (Requiere Auth)
```
DELETE /api/carrito/:id_producto
Headers: { "Authorization": "Bearer {token}" }

Response (204): Sin contenido (eliminación exitosa)
```

### 5.5 VACIAR CARRITO (Requiere Auth)
```
DELETE /api/carrito/clear
Headers: { "Authorization": "Bearer {token}" }

Response (204): Sin contenido
```

---

## 📍 ETAPA 6: CREACIÓN DE ÓRDENES (OrdenController)

### 6.1 CREAR ORDEN DESDE CARRITO (Requiere Auth)
```
POST /api/ordenes
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "id_direccion": 1,
  "notas": "Enviar entre 10am y 6pm"  // Opcional
}

Response (201): {
  "success": true,
  "data": {
    "id_orden": 15,
    "numero_orden": "ORD-2025-00015",
    "id_cliente": 3,
    "estado_orden": "pendiente",
    "direccion": { ...datos dirección... },
    "items": [
      {
        "id_item": 20,
        "id_producto": 1,
        "nombre_producto": "Laptop Gaming",
        "cantidad": 2,
        "precio_unitario": 1200.00,
        "subtotal": 2400.00
      }
    ],
    "total": 2400.00,
    "fecha_creacion": "2025-11-05T14:30:00.000Z"
  }
}
```

**⚠️ Importante:** 
- El carrito se vacía automáticamente después de crear la orden
- La orden comienza con estado "pendiente"
- Todos los productos deben tener stock suficiente

### 6.2 LISTAR MIS ÓRDENES (Requiere Auth)
```
GET /api/ordenes
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": [
    {
      "id_orden": 15,
      "numero_orden": "ORD-2025-00015",
      "estado_orden": "completada",
      "total": 2400.00,
      "fecha_creacion": "2025-11-05T14:30:00.000Z"
    },
    { ...más órdenes... }
  ]
}
```

### 6.3 OBTENER DETALLES DE UNA ORDEN (Requiere Auth)
```
GET /api/ordenes/:id
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": {
    "id_orden": 15,
    "numero_orden": "ORD-2025-00015",
    "estado_orden": "pendiente",
    "items": [ ...items detallados... ],
    "direccion": { ...datos envío... },
    "total": 2400.00,
    "pagos": [
      {
        "id_pago": 8,
        "monto": 2400.00,
        "metodo_pago": "tarjeta_credito",
        "estado_pago": "pendiente",
        "fecha": "2025-11-05T14:31:00.000Z"
      }
    ],
    "fecha_creacion": "2025-11-05T14:30:00.000Z"
  }
}
```

---

## 📍 ETAPA 7: PROCESAMIENTO DE PAGOS (PaymentController)

### 7.1 CREAR PAGO (Requiere Auth)
```
POST /api/ordenes/:id_orden/pagos
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "monto": 2400.00,
  "metodo_pago": "tarjeta_credito",  // "tarjeta_credito" | "transferencia" | "efectivo"
  "referencia_pago": "TXN-123456789"
}

Response (201): {
  "success": true,
  "data": {
    "id_pago": 8,
    "id_orden": 15,
    "monto": 2400.00,
    "metodo_pago": "tarjeta_credito",
    "estado_pago": "pendiente",
    "fecha_creacion": "2025-11-05T14:31:00.000Z"
  }
}
```

### 7.2 LISTAR PAGOS DE UNA ORDEN (Requiere Auth)
```
GET /api/ordenes/:id_orden/pagos
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": [
    {
      "id_pago": 8,
      "monto": 2400.00,
      "metodo_pago": "tarjeta_credito",
      "estado_pago": "completado",
      "fecha_creacion": "2025-11-05T14:31:00.000Z"
    }
  ]
}
```

### 7.3 OBTENER DETALLES DE UN PAGO (Requiere Auth)
```
GET /api/ordenes/:id_orden/pagos/:id_pago
Headers: { "Authorization": "Bearer {token}" }

Response (200): {
  "success": true,
  "data": { ...detalles pago... }
}
```

---

## 📊 FLUJO DE DATOS ENTRE TABLAS
```
USUARIOS
   ↓ (1 usuario = 1 cliente)
CLIENTES ← DIRECCIONES (1 cliente puede tener múltiples direcciones)
   ↓ (1 cliente = 1 carrito activo)
CARRITO_COMPRAS ← CARRITO_PRODUCTOS ← PRODUCTOS ← CATEGORIAS
   ↓
ÓRDENES ← ORDEN_ITEMS ← PRODUCTOS
   ↓
PAGOS
```

---

## 🔒 ROLES Y PERMISOS
```
Rol: CLIENTE (id_rol: 2) [Defecto para nuevos usuarios]
- Ver productos
- Gestionar perfil
- Gestionar carrito
- Crear órdenes
- Crear pagos

Rol: ADMINISTRADOR (id_rol: 1)
- CRUD de productos
- CRUD de categorías
- CRUD de imágenes
- Gestionar estado de órdenes
- Gestionar estado de pagos
```

---

## ❌ MANEJO DE ERRORES ESTÁNDAR

Todos los errores siguen este formato:

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR",
    "message": "Descripción del error",
    "statusCode": 400 | 401 | 403 | 404 | 500
  }
}
```

**Ejemplos comunes:**

| Caso | Status | Código |
|------|--------|--------|
| Token inválido/expirado | 401 | UNAUTHORIZED |
| Sin permisos | 403 | FORBIDDEN |
| Recurso no encontrado | 404 | NOT_FOUND |
| Datos inválidos | 400 | VALIDATION_ERROR |
| Error servidor | 500 | INTERNAL_ERROR |

---

## � FLUJOS DETALLADOS DE CADA CONTROLADOR

### FLUJO 1: AuthController (Autenticación)
```
┌─────────────┐
│   USUARIO   │
└──────┬──────┘
       │ Inicia registro/login
       ↓
┌──────────────────────────┐
│   AuthController         │
│ • register()             │
│ • login()                │
│ • getProfile()           │
│ • updateProfile()        │
│ • changePassword()       │
└──────────┬───────────────┘
           │ Valida datos y llama service
           ↓
┌──────────────────────────┐
│   UserService            │
│ • createUser()           │
│ • getUserById()          │
│ • getUserByEmail()       │
│ • updateUser()           │
│ • disableUser()          │
└──────────┬───────────────┘
           │ Ejecuta queries SQL
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Usuarios        │
│   Tabla: Roles           │
└──────────────────────────┘
           │ Retorna datos
           ↑
       [TOKEN JWT]
   (Guardado en localStorage)
```

**Pasos clave:**
1. Frontend envía credenciales
2. Controller valida formato
3. Service busca/crea usuario en BD
4. Se genera JWT si es éxito
5. Frontend guarda token para futuras requests

---

### FLUJO 2: ClienteController (Gestión de Perfil Cliente)
```
┌─────────────┐
│   USUARIO   │ (Autenticado con token)
│ (Token)     │
└──────┬──────┘
       │ GET/POST/PUT /api/clientes
       ↓
┌──────────────────────────┐
│   ClienteController      │
│ • getPerfil()            │
│ • crearPerfil()          │
│ • actualizarPerfil()     │
│ • obtenerCliente()       │ (solo admin)
│ • eliminarCliente()      │ (solo admin)
└──────────┬───────────────┘
           │ Valida token + permisos
           │ Llama service
           ↓
┌──────────────────────────┐
│   ClienteService         │
│ • getClientByUserId()    │
│ • createClient()         │
│ • updateClient()         │
│ • deleteClient()         │
└──────────┬───────────────┘
           │ Ejecuta queries SQL
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Clientes        │
│   Tabla: Usuarios        │ (relación 1:1)
└──────────────────────────┘
           │ Retorna datos cliente
           ↑
      Respuesta JSON
```

**Flujo específico GET /api/clientes/perfil:**
1. Middleware verifica token → extrae id_usuario
2. ClienteController llama service
3. Service busca cliente donde id_usuario = {id_usuario}
4. Retorna perfil del cliente (nombre, apellido, teléfono, etc.)

---

### FLUJO 3: ProductoController (Catálogo de Productos)
```
┌─────────────┐
│   USUARIO   │ (No requiere autenticación para listar)
└──────┬──────┘
       │ GET /api/productos
       │ GET /api/productos/:id
       ↓
┌──────────────────────────┐
│   ProductoController     │
│ • listarProductos()      │ (público)
│ • obtenerProducto()      │ (público)
│ • crearProducto()        │ (solo admin)
│ • actualizarProducto()   │ (solo admin)
│ • eliminarProducto()     │ (solo admin)
└──────────┬───────────────┘
           │ Valida (permisos si es POST/PUT/DELETE)
           │ Llama service
           ↓
┌──────────────────────────┐
│   ProductoService        │
│ • getAll()               │
│ • getById()              │
│ • create()               │
│ • update()               │
│ • delete()               │
│ • getByCategory()        │
└──────────┬───────────────┘
           │ Ejecuta queries SQL
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Productos       │
│   Tabla: Categorias      │ (FK)
│   Tabla: ProductoImagenes│ (1:N)
└──────────────────────────┘
           │ Retorna array de productos
           ↑
      Respuesta JSON
```

**Ejemplo GET /api/productos?categoria=2&minprecio=100&maxprecio=5000:**
1. No necesita token
2. Controller recibe query params
3. Service construye WHERE con filtros
4. BD retorna productos que coincidan

---

### FLUJO 4: CarritoController (Carrito de Compras) ⭐
```
┌─────────────┐
│   USUARIO   │ (REQUIERE AUTENTICACIÓN)
│ (Token)     │
└──────┬──────┘
       │ GET /api/carrito (ver carrito)
       │ POST /api/carrito (agregar producto)
       │ PUT /api/carrito/:id_producto (cambiar cantidad)
       │ DELETE /api/carrito/:id_producto (quitar)
       ↓
┌──────────────────────────┐
│   CarritoController      │
│ • obtenerCarrito()       │
│ • agregarProducto()      │
│ • actualizarCantidad()   │
│ • eliminarProducto()     │
│ • vaciarCarrito()        │
└──────────┬───────────────┘
           │ Valida token → obtiene id_usuario
           │ Llama service
           ↓
┌──────────────────────────┐
│   ClienteService         │
│ • getClientByUserId()    │ (obtiene id_cliente)
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│   CarritoService         │
│ • obtenerCarritoActivo() │
│ • agregarProducto()      │
│ • actualizarCantidad()   │
│ • eliminarProducto()     │
│ • calcularTotal()        │
└──────────┬───────────────┘
           │ Valida:
           │ - Producto existe
           │ - Stock disponible
           │ - Carrito existe o crear nuevo
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: CarritoCompras  │
│   Tabla: CarritoProductos│
│   Tabla: Productos       │
└──────────────────────────┘
           │ Retorna carrito actualizado
           ↑
      Respuesta JSON con:
      - ID carrito
      - Lista de items
      - Subtotal de cada item
      - Total carrito
```

**Ejemplo POST /api/carrito (agregar producto):**
```
USUARIO → Controller recibe {id_producto: 5, cantidad: 2}
        → Valida token (obtiene id_usuario)
        → Llama ClienteService.getClientByUserId(id_usuario)
        → Obtiene id_cliente
        → Llama CarritoService.obtenerCarritoActivo(id_cliente)
        → Si no existe carrito → crea uno nuevo
        → Valida stock: ProductoService.verificarStock(id_producto, 2)
        → Si stock OK → agrega a tabla CarritoProductos
        → Calcula total
        → Retorna carrito actualizado
```

**Estados del carrito:**
- `activo` → usuario aún está comprando
- `completado` → orden creada, carrito archivado

---

### FLUJO 5: DireccionController (Direcciones de Envío)
```
┌─────────────┐
│   USUARIO   │ (REQUIERE AUTENTICACIÓN)
│ (Token)     │
└──────┬──────┘
       │ GET /api/direcciones
       │ POST /api/direcciones (crear nueva)
       │ PUT /api/direcciones/:id (editar)
       │ DELETE /api/direcciones/:id (borrar)
       ↓
┌──────────────────────────┐
│   DireccionController    │
│ • listarDirecciones()    │
│ • crearDireccion()       │
│ • actualizarDireccion()  │
│ • eliminarDireccion()    │
└──────────┬───────────────┘
           │ Valida token → obtiene id_usuario
           │ Busca id_cliente
           │ Llama service
           ↓
┌──────────────────────────┐
│   DireccionService       │
│ • getByCliente()         │
│ • create()               │
│ • update()               │
│ • delete()               │
│ • setMasPrincipal()      │
└──────────┬───────────────┘
           │ Valida:
           │ - Datos dirección válidos
           │ - Solo propias direcciones
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Direcciones     │
│   Tabla: Clientes        │ (FK)
└──────────────────────────┘
           │ Retorna dirección/s
           ↑
      Respuesta JSON
```

**Datos de una dirección:**
- Calle, número, apartamento
- Ciudad, código postal
- País
- Teléfono (opcional)
- Es principal (boolean)

---

### FLUJO 6: OrdenController (Crear Órdenes)
```
┌─────────────┐
│   USUARIO   │ (REQUIERE AUTENTICACIÓN)
│ (Token)     │ (Tiene carrito con items)
└──────┬──────┘
       │ POST /api/ordenes
       │ {id_direccion: 1, notas: "..."}
       ↓
┌──────────────────────────┐
│   OrdenController        │
│ • crearOrden()           │
│ • listarOrdenes()        │
│ • obtenerOrden()         │
│ • actualizarEstado()     │ (solo admin)
└──────────┬───────────────┘
           │ Valida token → id_usuario
           │ Inicia TRANSACCIÓN
           ↓
┌──────────────────────────┐
│   ClienteService         │
│ • getClientByUserId()    │
└──────────┬───────────────┘
           │ Obtiene id_cliente
           ↓
┌──────────────────────────┐
│   CarritoService         │
│ • obtenerCarritoActivo() │
└──────────┬───────────────┘
           │ Obtiene items en carrito
           ↓
┌──────────────────────────┐
│   DireccionService       │
│ • getDireccionById()     │
└──────────┬───────────────┘
           │ Valida dirección existe y pertenece al usuario
           ↓
┌──────────────────────────┐
│   OrdenService           │
│ • create()               │
│ • createItems()          │
│ • calcularTotal()        │
└──────────┬───────────────┘
           │ Para cada item:
           │ 1. Verifica stock actual
           │ 2. Descuenta stock
           │ 3. Crea orden_item
           │ 4. Calcula subtotal
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Ordenes         │
│   Tabla: OrdenItems      │
│   Tabla: Productos       │
│   (Stock se actualiza)   │
└──────────────────────────┘
           │ Marca carrito como "completado"
           │ Confirma TRANSACCIÓN
           ↑
      Respuesta JSON:
      - numero_orden (ej: ORD-2025-00015)
      - items de la orden
      - total
      - estado: "pendiente"
```

**Validaciones críticas:**
1. ✅ Usuario autenticado
2. ✅ Carrito no vacío
3. ✅ Dirección existe y pertenece al usuario
4. ✅ Stock suficiente para TODOS los items
5. ✅ Si falla algo → ROLLBACK (no se crea nada)

---

### FLUJO 7: PaymentController (Procesamiento de Pagos)
```
┌─────────────┐
│   USUARIO   │ (REQUIERE AUTENTICACIÓN)
│ (Token)     │ (Tiene orden con estado "pendiente")
└──────┬──────┘
       │ POST /api/ordenes/:id_orden/pagos
       │ {monto, metodo_pago, referencia_pago}
       ↓
┌──────────────────────────┐
│   PaymentController      │
│ • crearPago()            │
│ • listarPagos()          │
│ • obtenerPago()          │
│ • actualizarEstado()     │ (solo admin)
└──────────┬───────────────┘
           │ Valida token
           │ Inicia TRANSACCIÓN
           ↓
┌──────────────────────────┐
│   OrdenService           │
│ • getOrdenById()         │
└──────────┬───────────────┘
           │ Valida:
           │ - Orden existe
           │ - Pertenece al usuario
           │ - Estado es "pendiente"
           ↓
┌──────────────────────────┐
│   PaymentService         │
│ • create()               │
│ • validarMonto()         │
│ • procesarPago()         │
└──────────┬───────────────┘
           │ Valida:
           │ 1. Monto = total orden
           │ 2. Método pago válido
           │ 3. Integración con gateway (si existe)
           ↓
┌──────────────────────────┐
│   BD (PostgreSQL)        │
│   Tabla: Pagos           │
│   Tabla: Ordenes         │
│   (Estado se actualiza)  │
└──────────────────────────┘
           │ Crea pago con estado "completado"
           │ Actualiza estado orden a "confirmada"
           │ Confirma TRANSACCIÓN
           ↑
      Respuesta JSON:
      - id_pago
      - monto confirmado
      - metodo_pago
      - estado: "completado"
      - fecha pago
```

**Métodos de pago soportados:**
- `tarjeta_credito` → integración con gateway (futuro)
- `transferencia` → validación manual
- `efectivo` → requiere confirmación admin

**Estados del pago:**
- `pendiente` → creado pero no confirmado
- `completado` → pago exitoso
- `cancelado` → pago rechazado

---

## �💡 TIPS PARA EL FRONTEND

1. **Guardar token después de login:**
   ```javascript
   localStorage.setItem('token', response.data.token);
   ```

2. **Usar token en todas las peticiones autenticadas:**
   ```javascript
   headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
   ```

3. **Validar stock antes de comprar:**
   - Verificar `producto.stock > 0` antes de agregar al carrito

4. **Mostrar total del carrito:**
   - Sumar: `item.cantidad * item.precio_unitario` para cada item

5. **Estados de orden:** pendiente → confirmada → enviada → completada

6. **Estados de pago:** pendiente → completado → cancelado

---

## 📍 RESUMEN - QUÉ HACE CADA CONTROLADOR

| Controlador | Función Principal | Requiere Auth |
|---|---|---|
| **AuthController** | Registro, Login, Perfil, Cambio Password | Parcial |
| **ClienteController** | Gestionar perfil cliente (asociado a usuario) | ✅ Sí |
| **ProductoController** | CRUD productos (admin) y listar (todos) | Parcial |
| **CarritoController** | Agregar/remover productos, ver carrito | ✅ Sí |
| **DireccionController** | Gestionar direcciones de envío | ✅ Sí |
| **OrdenController** | Crear órdenes desde carrito, ver mis órdenes | ✅ Sí |
| **PaymentController** | Procesar pagos, actualizar estados | ✅ Sí |

---