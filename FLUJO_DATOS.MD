# 📊 FLUJO DE DATOS Y LÓGICA DEL BACKEND

**Última actualización:** 12 Noviembre 2025  
**Versión:** 2.0 - Orientada a Lógica de Backend

---

## 🎯 FLUJO PRINCIPAL

```
1️⃣ AUTENTICACIÓN
   ├─ REGISTRO → Usuario nuevo + TOKEN
   ├─ LOGIN → Token de acceso
   └─ PERFIL → Datos del usuario

2️⃣ COMPRA
   ├─ VER PRODUCTOS (catálogo)
   ├─ CARRITO (agregar items)
   ├─ CHECKOUT (crear orden)
   └─ PAGO (procesar pago)

3️⃣ SEGUIMIENTO
   ├─ MIS ÓRDENES (historial)
   ├─ ESTADO ORDEN (tracking)
   ├─ ESTADO PAGO (confirmación)
   └─ MI PERFIL (datos cliente)
```

---

## 🔐 CONCEPTO CLAVE: AUTENTICACIÓN CON JWT

### ¿QUÉ ES EL TOKEN?
Un token JWT es como un "pase de acceso" que el backend emite después del login.

```
┌─────────────────────────────────────────┐
│ TOKEN JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."    │
│                                         │
│ Contiene información codificada:        │
│ • Tu ID de usuario                      │
│ • Tu rol (cliente/admin)                │
│ • Tu email                              │
│ • Fecha de expiración                   │
│ • Firma del servidor (no se puede       │
│   falsificar)                           │
└─────────────────────────────────────────┘
```

### ¿CÓMO USARLO?
Después de login/registro, **GUARDA el token** y **ENVÍALO en cada petición**:

```javascript
// En localStorage (o sessionStorage)
localStorage.setItem('token', response.data.token);

// En CADA petición autenticada
headers: {
  'Authorization': 'Bearer ' + localStorage.getItem('token')
}
```

---

## 📍 ETAPA 1: AUTENTICACIÓN

### 1.1 REGISTRO - Crear Nueva Cuenta

**¿Qué pasa en el backend?**
1. Valida que el email no exista ya
2. Encripta la contraseña (nunca se guarda en texto plano)
3. Crea usuario en BD
4. Crea rol "cliente" por defecto
5. Genera TOKEN JWT
6. Retorna token + datos del usuario

**Frontend:**
```javascript
// POST a backend
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre_usuario: "juan_perez",
    correo_electronico: "juan@example.com",
    contrasena: "SecurePass123"
  })
});

const data = await response.json();
// Response: { success: true, data: { id_usuario: 5, token: "...", ... } }

// GUARDAR token para futuras peticiones
localStorage.setItem('token', data.data.token);
localStorage.setItem('userId', data.data.id_usuario);
localStorage.setItem('nombre_usuario', data.data.nombre_usuario);
```

---

### 1.2 LOGIN - Iniciar Sesión

**¿Qué pasa en el backend?**
1. Busca usuario por email
2. Valida contraseña (compara encriptada)
3. Si es correcto → genera TOKEN JWT
4. Retorna token + datos usuario + permisos

**Frontend:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correo_electronico: "juan@example.com",
    contrasena: "SecurePass123"
  })
});

const data = await response.json();

if (data.success) {
  // GUARDAR token
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('userId', data.data.id_usuario);
  // Redirigir a home/dashboard
  window.location.href = '/dashboard';
} else {
  // Mostrar error: "Email o contraseña incorrecta"
  console.error(data.error.message);
}
```

**⚠️ IMPORTANTE:** A partir de aquí, TODAS las peticiones deben incluir el token:
```javascript
headers: {
  'Authorization': 'Bearer ' + localStorage.getItem('token')
}
```

---

### 1.3 OBTENER MI PERFIL

**¿Qué pasa en el backend?**
1. Lee token del header
2. Valida que sea válido y no esté expirado
3. Extrae id_usuario del token
4. Busca usuario en BD
5. Retorna datos del perfil

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
// Response: { 
//   data: { 
//     id_usuario: 5, 
//     nombre_usuario: "juan_perez", 
//     correo_electronico: "juan@example.com",
//     rol: { nombre_rol: "cliente", permisos: {...} }
//   } 
// }
```

---

### 1.4 CAMBIAR CONTRASEÑA

**¿Qué pasa en el backend?**
1. Valida token
2. Valida contraseña actual (debe coincidir)
3. Encripta la nueva contraseña
4. Actualiza en BD
5. No cierra sesión (token sigue siendo válido)

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/auth/change-password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    contrasena_actual: "SecurePass123",
    contrasena_nueva: "NuevaSegura456"
  })
});

if (response.ok) {
  alert('Contraseña actualizada');
  // Token sigue siendo válido, usuario puede seguir navegando
}
```

---

## 📍 ETAPA 2: PERFIL CLIENTE

### ¿QUÉ ES EL PERFIL CLIENTE?
- **Usuario** = Datos de acceso (email, contraseña, rol)
- **Cliente** = Datos personales (nombre, apellido, teléfono)
- 1 usuario = 1 cliente

**Flujo lógico:**
```
REGISTRO → Crea USUARIO → Se crea automáticamente un CLIENTE asociado
```

### 2.1 VER MI PERFIL DE CLIENTE

**¿Qué pasa en el backend?**
1. Valida token
2. Extrae id_usuario del token
3. Busca cliente asociado a ese usuario
4. Retorna datos del cliente

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/clientes/perfil', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
// Response: {
//   success: true,
//   data: {
//     id_cliente: 3,
//     nombre: "Juan",
//     apellido: "Pérez",
//     telefono: "555-1234",
//     fecha_registro: "2025-11-05T10:30:00Z"
//   }
// }

console.log(data.data.nombre); // "Juan"
```

### 2.2 ACTUALIZAR PERFIL DE CLIENTE

**¿Qué pasa en el backend?**
1. Valida token
2. Encuentra cliente asociado
3. Actualiza solo los campos permitidos
4. Retorna cliente actualizado

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/clientes/perfil', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    nombre: "Juan Carlos",
    apellido: "Pérez García",
    telefono: "555-9999"
  })
});

const data = await response.json();
// Cliente actualizado
```

---

## 📍 ETAPA 3: DIRECCIONES DE ENVÍO

### ¿POR QUÉ NECESITO DIRECCIONES?
- Puedes tener múltiples direcciones (casa, trabajo, etc.)
- Al hacer checkout, DEBES elegir a cuál dirección enviar

### 3.1 OBTENER MIS DIRECCIONES

**¿Qué pasa en el backend?**
1. Valida token
2. Obtiene id_cliente del usuario
3. Busca TODAS las direcciones de ese cliente
4. Las retorna ordenadas (principal primero)

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/direcciones', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
// Response: {
//   success: true,
//   data: [
//     {
//       id_direccion: 1,
//       calle: "Calle Principal 123",
//       ciudad: "Madrid",
//       codigo_postal: "28001",
//       pais: "España",
//       es_principal: true
//     },
//     { ... más direcciones ... }
//   ]
// }

// Usar para llenar dropdown en checkout
data.data.forEach(dir => {
  console.log(`${dir.calle}, ${dir.ciudad}`);
});
```

### 3.2 CREAR NUEVA DIRECCIÓN

**¿Qué pasa en el backend?**
1. Valida token
2. Obtiene id_cliente
3. Valida los datos (formato válido, etc.)
4. Guarda nueva dirección asociada al cliente
5. Si es_principal = true, desmarca otras direcciones principales

**Frontend:**
```javascript
const response = await fetch('/api/direcciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    calle: "Avenida Central 456",
    ciudad: "Barcelona",
    codigo_postal: "08002",
    pais: "España",
    telefono: "555-7777",
    es_principal: false
  })
});

const data = await response.json();
// Nueva dirección creada
```

### 3.3 ACTUALIZAR DIRECCIÓN

**¿Qué pasa en el backend?**
1. Valida que la dirección pertenece al usuario
2. Actualiza campos
3. Retorna dirección actualizada

**Frontend:**
```javascript
const response = await fetch('/api/direcciones/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    telefono: "555-8888",
    es_principal: true  // Marcar como principal
  })
});
```

---

## 📍 ETAPA 4: CATÁLOGO DE PRODUCTOS

### ¿POR QUÉ ESTA ETAPA NO REQUIERE TOKEN?
- Los productos son **públicos**
- Cualquiera puede ver el catálogo (autenticado o no)

### 4.1 LISTAR PRODUCTOS

**¿Qué pasa en el backend?**
1. NO requiere autenticación
2. Obtiene página de productos (con paginación)
3. Puede filtrar por categoría, precio, etc.
4. Retorna lista con detalles y fotos

**Frontend:**
```javascript
// ⚠️ SIN token - es público

// Opción 1: Ver todos
const response = await fetch('/api/productos');

// Opción 2: Con filtros
const response = await fetch('/api/productos?categoria=2&minprecio=100&maxprecio=5000');

const data = await response.json();
// Response: {
//   success: true,
//   data: [
//     {
//       id_producto: 1,
//       nombre: "Laptop Gaming",
//       descripcion: "Laptop de alto rendimiento",
//       precio: 1200.00,
//       stock: 5,
//       imagenes: [
//         {
//           id_imagen: 1,
//           url: "https://example.com/img1.jpg",
//           es_principal: true
//         }
//       ],
//       categoria: {
//         id_categoria: 2,
//         nombre_categoria: "Electrónica"
//       }
//     },
//     { ... más productos ... }
//   ]
// }

// Mostrar en tienda
data.data.forEach(producto => {
  console.log(`${producto.nombre} - $${producto.precio}`);
  console.log(`Imagen: ${producto.imagenes[0].url}`);
});
```

### 4.2 VER DETALLES DE UN PRODUCTO

**¿Qué pasa en el backend?**
1. Busca producto por ID
2. Carga todas sus imágenes
3. Retorna detalles completos

**Frontend:**
```javascript
const response = await fetch('/api/productos/1');
const data = await response.json();
// Mostrar detalles completos del producto
```

---

## 📍 ETAPA 5: CARRITO DE COMPRAS ⭐

### ¿QUÉ ES EL CARRITO?
- Es temporal (mientras estés comprando)
- Cada usuario tiene UN carrito activo
- Contiene items (productos con cantidad)
- Al crear orden, se guarda y se crea un carrito vacío nuevo

### 5.1 OBTENER MI CARRITO

**¿Qué pasa en el backend?**
1. Valida token
2. Obtiene id_cliente
3. Busca carrito ACTIVO de ese cliente
4. Carga todos los items con detalles de producto
5. Calcula total

**Frontend:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('/api/carrito', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await response.json();
// Response: {
//   success: true,
//   data: {
//     id_carrito: 5,
//     estado: "activo",
//     items: [
//       {
//         id_carrito_producto: 10,
//         id_producto: 1,
//         nombre_producto: "Laptop Gaming",
//         cantidad: 2,
//         precio_unitario: 1200.00,
//         subtotal: 2400.00  // cantidad × precio
//       },
//       { ... más items ... }
//     ],
//     total: 2400.00
//   }
// }

// Mostrar en página
console.log(`Carrito: ${data.data.items.length} items`);
console.log(`Total: $${data.data.total}`);
```

### 5.2 AGREGAR PRODUCTO AL CARRITO

**¿Qué pasa en el backend?**
1. Valida token
2. Obtiene id_cliente
3. Busca carrito activo (o crea uno si no existe)
4. **Valida que el producto existe y tiene stock**
5. Busca si el producto ya estaba en carrito
   - Si SÍ → aumenta cantidad
   - Si NO → agrega nuevo item
6. Recalcula total
7. Retorna carrito actualizado

**Frontend:**
```javascript
const response = await fetch('/api/carrito', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    id_producto: 1,
    cantidad: 2
  })
});

const data = await response.json();

if (data.success) {
  console.log('Producto agregado');
  console.log(`Carrito ahora tiene: $${data.data.total}`);
} else {
  // Error: "Sin stock" o "Producto no existe"
  console.error(data.error.message);
}
```

### 5.3 ACTUALIZAR CANTIDAD EN CARRITO

**¿Qué pasa en el backend?**
1. Valida token
2. Busca producto en carrito del usuario
3. **Valida nueva cantidad <= stock disponible**
4. Actualiza cantidad
5. Recalcula total

**Frontend:**
```javascript
// Cambiar cantidad de laptop a 5 unidades
const response = await fetch('/api/carrito/1', {  // id_producto = 1
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    cantidad: 5
  })
});

const data = await response.json();
// Carrito actualizado con nueva cantidad y total
```

### 5.4 ELIMINAR PRODUCTO DEL CARRITO

**¿Qué pasa en el backend?**
1. Valida token
2. Busca producto en carrito
3. Lo elimina
4. Recalcula total

**Frontend:**
```javascript
const response = await fetch('/api/carrito/1', {  // id_producto = 1
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

if (response.ok) {
  console.log('Producto removido del carrito');
}
```

### 5.5 VACIAR CARRITO

**¿Qué pasa en el backend?**
1. Valida token
2. Elimina TODOS los items del carrito
3. El carrito queda vacío pero sigue activo

**Frontend:**
```javascript
const response = await fetch('/api/carrito/clear', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});
```

---

## 📍 ETAPA 6: CREAR ORDEN (CHECKOUT)

### ¿QUÉ PASA AL HACER CHECKOUT?
El backend convierte los items del carrito en una ORDEN guardada permanentemente.

```
CARRITO (temporal)
    ↓ (checkout)
ORDEN (permanente + items guardados)
    ↓
Carrito se vacía (nuevo carrito activo creado)
```

### 6.1 CREAR ORDEN DESDE CARRITO

**¿Qué pasa en el backend?** ⚠️ PROCESO CRÍTICO
1. Valida token
2. Obtiene id_cliente
3. Obtiene carrito activo
   - Si está vacío → ERROR
4. Valida la dirección enviada:
   - Debe existir
   - Debe pertenecer al usuario
5. **Verificación de stock (IMPORTANTE):**
   - Para CADA item, revisa stock actual
   - Si alguno no tiene suficiente → ERROR (rollback)
6. **SI TODO OK - INICIA TRANSACCIÓN:**
   - Decrementa stock de cada producto
   - Crea ORDEN
   - Crea ORDEN_ITEMS (copia de items del carrito)
   - Marca carrito como "completado"
   - Crea carrito nuevo y activo
7. Retorna orden creada

**Frontend:**
```javascript
// Antes de hacer click en "Comprar", asegurate de:
// 1. Carrito no esté vacío
// 2. Usuario tenga direcciones
// 3. Usuario haya seleccionado dirección de envío

const directionId = 1; // ID seleccionado por usuario

const response = await fetch('/api/ordenes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    id_direccion: directionId,
    notas: "Enviar entre 10am y 6pm"  // Opcional
  })
});

const data = await response.json();

if (data.success) {
  console.log('Orden creada:', data.data);
  // Response: {
  //   id_orden: 15,
  //   numero_orden: "ORD-2025-00015",  // Número único
  //   estado_orden: "pendiente",       // Esperando pago
  //   total: 2400.00,
  //   items: [ ... ],                  // Copias de los items
  //   fecha_creacion: "2025-11-12..."
  // }
  
  // GUARDAR id_orden para siguiente paso (pago)
  localStorage.setItem('ordenId', data.data.id_orden);
  
  // Redirigir a página de pago
  window.location.href = '/checkout/pago';
} else {
  // Errores comunes:
  // - "Carrito vacío"
  // - "Dirección no encontrada"
  // - "Sin stock de producto X"
  console.error(data.error.message);
}
```

### 6.2 VER MIS ÓRDENES

**¿Qué pasa en el backend?**
1. Valida token
2. Obtiene id_cliente
3. Busca TODAS las órdenes del cliente
4. Retorna lista con estado, total, fecha

**Frontend:**
```javascript
const response = await fetch('/api/ordenes', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

const data = await response.json();
// Response: {
//   data: [
//     {
//       id_orden: 15,
//       numero_orden: "ORD-2025-00015",
//       estado_orden: "completada",
//       total: 2400.00,
//       fecha_creacion: "2025-11-12T10:30:00Z"
//     },
//     { ... más órdenes ... }
//   ]
// }

// Mostrar historial
data.data.forEach(orden => {
  console.log(`${orden.numero_orden} - $${orden.total} - ${orden.estado_orden}`);
});
```

### 6.3 VER DETALLES DE UNA ORDEN

**¿Qué pasa en el backend?**
1. Valida token
2. Busca orden por ID
3. Verifica que pertenece al usuario
4. Carga todos los items
5. Carga dirección de envío
6. Carga pagos asociados

**Frontend:**
```javascript
const ordenId = localStorage.getItem('ordenId');  // De paso anterior

const response = await fetch(`/api/ordenes/${ordenId}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

const data = await response.json();
// Response: {
//   success: true,
//   data: {
//     id_orden: 15,
//     numero_orden: "ORD-2025-00015",
//     estado_orden: "pendiente",  // Esperando pago
//     items: [
//       {
//         id_item: 20,
//         nombre_producto: "Laptop Gaming",
//         cantidad: 2,
//         precio_unitario: 1200.00,
//         subtotal: 2400.00
//       }
//     ],
//     direccion_envio: {
//       calle: "Calle Principal 123",
//       ciudad: "Madrid",
//       codigo_postal: "28001"
//     },
//     pagos: [
//       {
//         id_pago: 8,
//         monto: 2400.00,
//         metodo_pago: "tarjeta_credito",
//         estado_pago: "completado",  // ✅ Pago hecho
//         fecha: "2025-11-12T11:00:00Z"
//       }
//     ],
//     total: 2400.00
//   }
// }

// Mostrar estado
console.log(`Orden #${data.data.numero_orden}`);
console.log(`Estado: ${data.data.estado_orden}`);
console.log(`Pagos: ${data.data.pagos.length}`);
```

---

## 📍 ETAPA 7: PROCESAMIENTO DE PAGOS

### ¿QUÉ SIGNIFICA CADA ESTADO DE PAGO?

```
┌─────────────────────────────┐
│ ORDEN CREADA (estado: pendiente)   │
│ - Items guardados                  │
│ - Stock decrementado               │
│ - Esperando pago                   │
└─────────────────────────────┘
         ↓
         │ Usuario hace pago
         ↓
┌─────────────────────────────┐
│ PAGO CREADO (estado: completado)   │
│ - Dinero confirmado                │
│ - Orden → estado: confirmada       │
│ - Envío puede procesarse           │
└─────────────────────────────┘
         ↓
         │ Admin prepara envío
         ↓
┌─────────────────────────────┐
│ ORDEN ENVIADA               │
│ - Usuario recibe tracking   │
│ - Esperando entrega         │
└─────────────────────────────┘
         ↓
         │ Llega a destino
         ↓
┌─────────────────────────────┐
│ ORDEN COMPLETADA            │
│ - Usuario la recibió        │
└─────────────────────────────┘
```

### 7.1 CREAR PAGO PARA UNA ORDEN

**¿Qué pasa en el backend?** ⚠️ IMPORTANTE
1. Valida token
2. Busca orden por ID
3. Verifica que pertenece al usuario
4. **Valida:**
   - Orden existe
   - Monto = total de la orden
   - Estado orden es "pendiente"
5. Crea PAGO con estado "completado"
6. **Cambia estado orden a "confirmada"**
7. Retorna pago creado

**Frontend:**
```javascript
const ordenId = localStorage.getItem('ordenId');
const token = localStorage.getItem('token');

// Obtener total de la orden primero
const ordenResponse = await fetch(`/api/ordenes/${ordenId}`, {
  headers: { 'Authorization': 'Bearer ' + token }
});
const orden = await ordenResponse.json();
const montoTotal = orden.data.total;

// Crear pago
const response = await fetch(`/api/ordenes/${ordenId}/pagos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    monto: montoTotal,
    metodo_pago: "tarjeta_credito",  // o "transferencia", "efectivo"
    referencia_pago: "TXN-123456789"  // Tu referencia
  })
});

const data = await response.json();

if (data.success) {
  console.log('Pago creado exitosamente');
  // Response: {
  //   id_pago: 8,
  //   monto: 2400.00,
  //   metodo_pago: "tarjeta_credito",
  //   estado_pago: "completado",
  //   fecha_creacion: "2025-11-12T11:00:00Z"
  // }
  
  // La orden ahora está confirmada y lista para envío
  alert('¡Pago completado! Tu orden está confirmada.');
  
  // Redirigir a mis órdenes
  window.location.href = '/mis-ordenes';
} else {
  console.error('Error:', data.error.message);
}
```

### 7.2 VER PAGOS DE UNA ORDEN

**¿Qué pasa en el backend?**
1. Valida token y que orden pertenece al usuario
2. Obtiene TODOS los pagos de esa orden
3. Retorna lista de pagos

**Frontend:**
```javascript
const ordenId = 15;

const response = await fetch(`/api/ordenes/${ordenId}/pagos`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

const data = await response.json();
// Response: {
//   data: [
//     {
//       id_pago: 8,
//       monto: 2400.00,
//       metodo_pago: "tarjeta_credito",
//       estado_pago: "completado",
//       fecha_creacion: "2025-11-12T11:00:00Z"
//     }
//   ]
// }
```

---

## 📊 RELACIONES ENTRE TABLAS

```
┌─────────────┐
│  USUARIOS   │ (email, contraseña, rol)
└──────┬──────┘
       │ 1:1 (relación directa)
       │
       ↓
┌─────────────┐
│  CLIENTES   │ (nombre, apellido, teléfono)
└──────┬──────┘
       │ 1:∞ (un cliente, múltiples direcciones/carritos/órdenes)
       │
       ├─→ DIRECCIONES (envío)
       ├─→ CARRITO (temporal, mientras compra)
       │   └─→ CARRITO_ITEMS (productos en carrito)
       │
       └─→ ÓRDENES (permanentes)
           ├─→ ORDEN_ITEMS (productos que compró)
           ├─→ PAGOS (puede tener múltiples pagos)
           └─→ DIRECCION_ENVIO (a dónde ir)

┌─────────────┐
│  PRODUCTOS  │ (nombre, precio, stock)
└─────────────┘
       │ 1:∞ (un producto en múltiples órdenes)
       │
       ├─→ IMAGENES (fotos del producto)
       ├─→ CATEGORIAS (electrónica, ropa, etc.)
       └─→ INVENTARIO (stock en almacenes)
```

---

## 🔑 CONCEPTOS CLAVE PARA EL FRONTEND

### 1️⃣ TOKEN JWT
- **Qué es:** Credencial de autenticación (texto encriptado)
- **Dónde guardarlo:** `localStorage.setItem('token', ...)`
- **Cuándo usarlo:** En TODOS los request autenticados
- **Cómo usarlo:** `headers: { 'Authorization': 'Bearer ' + token }`
- **Expiración:** El servidor valida cada vez (si está expirado, pide nuevo login)

### 2️⃣ ID_CLIENTE
- **Generado automáticamente** cuando te registras
- **NO lo envías en requests** (se extrae del token)
- **Lo obtienes** del endpoint `/api/clientes/perfil`

### 3️⃣ TRANSACCIONES (importante en órdenes)
Si algún paso falla en CREAR ORDEN, **TODO se revierte**:
- No se decrementa stock
- No se crea orden
- No se vacía carrito
- Carrito queda como estaba

Esto garantiza que **NO puedas** tener una orden sin stock o carrito sin dinero.

### 4️⃣ ESTADO DE ORDEN
```
pendiente → confirmada → enviada → completada → (cancelada)
```

### 5️⃣ ESTADO DE PAGO
```
pendiente → completado → (cancelado)
```

### 6️⃣ CARRITO
- **Temporal** mientras compres
- **1 carrito activo** por usuario a la vez
- **Al checkout** → se archiva → se crea uno nuevo

---

## ⚠️ ERRORES COMUNES Y CÓMO EVITARLOS

| Error | Causa | Solución |
|-------|-------|----------|
| "Unauthorized" (401) | Token expirado o falta header | Validar token guardado, hacer login nuevo |
| "Token inválido" | Token corrupto | Limpiar localStorage y login nuevo |
| "Carrito vacío" | Intenta crear orden sin items | Agregar productos al carrito primero |
| "Sin stock" | No hay cantidad suficiente | Verificar stock antes o reducir cantidad |
| "Dirección no encontrada" | ID dirección incorrecto o no es tuya | Obtener IDs de GET /api/direcciones primero |
| "Monto no coincide" | Pago ≠ total de orden | Usar el monto exacto de la orden |
| 404 Not Found | Endpoint incorrecto | Verificar ruta exacta del API |
| 500 Internal Error | Error del servidor | Revisar logs del backend |

---

## 📝 TABLA DE REFERENCIA RÁPIDA

| Endpoint | Método | Token | Función |
|----------|--------|-------|---------|
| `/api/auth/register` | POST | ❌ | Crear cuenta |
| `/api/auth/login` | POST | ❌ | Iniciar sesión |
| `/api/auth/profile` | GET | ✅ | Ver perfil usuario |
| `/api/clientes/perfil` | GET | ✅ | Ver perfil cliente |
| `/api/clientes/perfil` | PUT | ✅ | Editar perfil |
| `/api/direcciones` | GET | ✅ | Ver direcciones |
| `/api/direcciones` | POST | ✅ | Crear dirección |
| `/api/direcciones/:id` | PUT | ✅ | Editar dirección |
| `/api/direcciones/:id` | DELETE | ✅ | Eliminar dirección |
| `/api/productos` | GET | ❌ | Ver catálogo |
| `/api/productos/:id` | GET | ❌ | Ver producto |
| `/api/categorias` | GET | ❌ | Ver categorías |
| `/api/carrito` | GET | ✅ | Ver carrito |
| `/api/carrito` | POST | ✅ | Agregar al carrito |
| `/api/carrito/:id` | PUT | ✅ | Cambiar cantidad |
| `/api/carrito/:id` | DELETE | ✅ | Quitar del carrito |
| `/api/carrito/clear` | DELETE | ✅ | Vaciar carrito |
| `/api/ordenes` | GET | ✅ | Ver mis órdenes |
| `/api/ordenes` | POST | ✅ | **CREAR ORDEN** |
| `/api/ordenes/:id` | GET | ✅ | Ver detalles orden |
| `/api/ordenes/:id/pagos` | GET | ✅ | Ver pagos |
| `/api/ordenes/:id/pagos` | POST | ✅ | **CREAR PAGO** |

---

## 🎯 CHECKLIST: COMPRA PASO A PASO

- [ ] Usuario se registra/login y recibe token
- [ ] Frontend guarda token en localStorage
- [ ] Usuario ve catálogo (sin token)
- [ ] Usuario agrega productos al carrito (con token)
- [ ] Usuario verifica carrito
- [ ] Usuario selecciona dirección de envío
- [ ] Frontend crea ORDEN (POST /api/ordenes)
- [ ] Backend valida stock y crea orden
- [ ] Frontend obtiene id_orden
- [ ] Usuario procesa pago
- [ ] Frontend crea PAGO (POST /api/ordenes/{id}/pagos)
- [ ] Orden cambia a estado "confirmada"
- [ ] Usuario ve confirmación

---

**Última actualización:** 12 Noviembre 2025  
**Version:** 2.0 - Orientada a Lógica de Backend

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