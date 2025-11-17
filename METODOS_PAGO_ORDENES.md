# 📋 Guía de Métodos de Pago y Órdenes

## 📑 Tabla de Contenidos

1. [Flujo General](#flujo-general)
2. [Métodos de Pago del Sistema](#métodos-de-pago-del-sistema)
3. [Métodos de Pago del Cliente](#métodos-de-pago-del-cliente)
4. [Crear Órdenes](#crear-órdenes)
5. [Validaciones](#validaciones)
6. [Implementación en Frontend](#implementación-en-frontend)

---

## 🔄 Flujo General

### Flujo Completo para Generar una Orden

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE INICIA SESIÓN                     │
│                   POST /api/auth/login                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
            ┌────────────────────────┐
            │ ¿Perfil de cliente?    │
            └────────┬──────────┬────┘
                  No │          │ Sí
                     ↓          ↓
         ┌──────────────────┐  Continuar
         │ Crear perfil     │
         │ POST /clientes   │
         └────────┬─────────┘
                  ↓
        ┌──────────────────────────────┐
        │ AGREGAR PRODUCTOS AL CARRITO │
        │ POST /api/carrito            │
        └────────┬─────────────────────┘
                 ↓
        ┌──────────────────────────────┐
        │  GESTIONAR DIRECCIONES       │
        │  GET /api/direcciones        │
        │  POST /api/direcciones (opt) │
        └────────┬─────────────────────┘
                 ↓
        ┌──────────────────────────────┐
        │  GESTIONAR MÉTODOS DE PAGO   │
        │  GET /api/metodos-pago-cl    │
        │  POST /api/metodos-pago-cl   │
        │  PATCH /verificar (opcional) │
        └────────┬─────────────────────┘
                 ↓
        ┌──────────────────────────────┐
        │   RESUMEN DE COMPRA          │
        │   (Mostrar al cliente)       │
        └────────┬─────────────────────┘
                 ↓
        ┌──────────────────────────────┐
        │  ¿CONFIRMAR ORDEN?           │
        │         SÍ / NO              │
        └────────┬──────────┬──────────┘
              Sí │          │ No
                 ↓          └─→ Volver al carrito
         ┌──────────────────┐
         │  CREAR ORDEN     │
         │ POST /api/ordenes│
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │ ORDEN CREADA ✅  │
         │ ORD-2025-001234  │
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │ CARRITO VACIADO  │
         │ EMAIL ENVIADO    │
         │ CONFIRMACIÓN     │
         └──────────────────┘
```

---

## 💳 Métodos de Pago del Sistema

Los métodos de pago del sistema son predefinidos y contienen la información de qué tipos de pago están disponibles.

### Listar todos los métodos

```http
GET /api/metodos-pago
```

### Listar solo métodos activos

```http
GET /api/metodos-pago/activos
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id_metodo_pago": 1,
      "nombre_metodo": "Visa",
      "tipo_metodo": "tarjeta_credito",
      "descripcion": "Tarjeta de crédito Visa",
      "icono_url": "/icons/visa.png",
      "requiere_verificacion": false,
      "comision_porcentaje": "2.90",
      "comision_fija": "0.00",
      "activo": true,
      "disponible_online": true,
      "disponible_tienda": true,
      "orden_visualizacion": 1
    }
  ]
}
```

### Listar métodos disponibles online

```http
GET /api/metodos-pago/online
```

### Listar métodos disponibles en tienda

```http
GET /api/metodos-pago/tienda
```

### Listar métodos por tipo

```http
GET /api/metodos-pago/tipo/:tipo

# Ejemplos:
GET /api/metodos-pago/tipo/tarjeta_credito
GET /api/metodos-pago/tipo/billetera_digital
GET /api/metodos-pago/tipo/transferencia_bancaria
GET /api/metodos-pago/tipo/criptomoneda
GET /api/metodos-pago/tipo/efectivo
```

### Obtener un método específico

```http
GET /api/metodos-pago/:id

# Ejemplo:
GET /api/metodos-pago/1
```

### Tipos de Métodos Disponibles

| ID | Tipo | Nombre | Descripción |
|----|------|--------|-------------|
| 1 | tarjeta_credito | Visa | Tarjeta de crédito Visa |
| 2 | tarjeta_credito | Mastercard | Tarjeta de crédito Mastercard |
| 3 | tarjeta_credito | American Express | Tarjeta de crédito AmEx |
| 4 | tarjeta_debito | Tarjeta de Débito | Tarjeta de débito bancaria |
| 5 | billetera_digital | PayPal | Pago mediante PayPal |
| 6 | transferencia_bancaria | Transferencia Bancaria | Transferencia o depósito bancario |
| 7 | efectivo | Efectivo | Pago en efectivo contra entrega |
| 8 | criptomoneda | Bitcoin | Pago con Bitcoin |

---

## 👤 Métodos de Pago del Cliente

Los métodos de pago del cliente son los métodos registrados específicamente por cada usuario.

### 1. CREAR Método de Pago

```http
POST /api/metodos-pago-cliente
Authorization: Bearer {token}
Content-Type: application/json
```

#### Body - Estructura Universal

```javascript
{
  "id_metodo_pago": number,              // ID del tipo de método (requerido)
  "alias": string,                        // Nombre descriptivo (requerido)
  "es_predeterminado": boolean,           // Marcar como predeterminado (opcional)
  
  // Campos específicos por tipo (ver abajo)
}
```

#### Body por Tipo de Método

**A) Tarjetas (Visa, Mastercard, Amex, Débito)**

```json
{
  "id_metodo_pago": 1,
  "alias": "Mi Visa Principal",
  "numero_tarjeta_ultimos_4": "1234",
  "nombre_titular": "Juan Pérez",
  "fecha_expiracion": "2025-12-31",
  "tipo_tarjeta": "visa",
  "banco": "Banco Nacional",
  "es_predeterminado": true
}
```

**B) PayPal / Billeteras Digitales**

```json
{
  "id_metodo_pago": 5,
  "alias": "Mi PayPal",
  "email_billetera": "juan@gmail.com",
  "telefono_billetera": "+56912345678",
  "es_predeterminado": false
}
```

**C) Transferencia Bancaria**

```json
{
  "id_metodo_pago": 6,
  "alias": "Mi cuenta Banco Nacional",
  "numero_cuenta": "1234567890",
  "banco": "Banco Nacional",
  "nombre_titular": "Juan Pérez",
  "es_predeterminado": false
}
```

**D) Criptomoneda (Bitcoin, Ethereum, etc.)**

```json
{
  "id_metodo_pago": 8,
  "alias": "Mi billetera Bitcoin",
  "identificador_externo": "1A1z7agoat2Bt8kkN6tgLA5oXrsi7p1XB",
  "es_predeterminado": false
}
```

#### Respuesta (201 Created)

```json
{
  "success": true,
  "message": "Método de pago registrado exitosamente",
  "data": {
    "id_metodo_pago_cliente": 5,
    "id_cliente": 4,
    "id_metodo_pago": 1,
    "alias": "Mi Visa Principal",
    "numero_tarjeta_ultimos_4": "1234",
    "nombre_titular": "Juan Pérez",
    "fecha_expiracion": "2025-12-31",
    "tipo_tarjeta": "visa",
    "banco": "Banco Nacional",
    "es_predeterminado": true,
    "activo": true,
    "verificado": false,
    "requiere_verificacion": true,
    "fecha_verificacion": null,
    "fecha_creacion": "2025-11-14T12:30:00.000Z",
    "metodoPago": {
      "id_metodo_pago": 1,
      "nombre_metodo": "Visa",
      "tipo_metodo": "tarjeta_credito",
      "icono_url": "/icons/visa.png"
    }
  }
}
```

---

### 2. LISTAR / BUSCAR Métodos de Pago

#### Listar todos mis métodos

```http
GET /api/metodos-pago-cliente
Authorization: Bearer {token}
```

#### Obtener método predeterminado

```http
GET /api/metodos-pago-cliente/predeterminado
Authorization: Bearer {token}
```

#### Obtener un método específico por ID

```http
GET /api/metodos-pago-cliente/:id
Authorization: Bearer {token}

# Ejemplo:
GET /api/metodos-pago-cliente/1
```

---

### 3. ACTUALIZAR Método de Pago

```http
PUT /api/metodos-pago-cliente/:id
Authorization: Bearer {token}
Content-Type: application/json

# Ejemplo:
PUT /api/metodos-pago-cliente/1
```

#### Body - Solo campos que quieres actualizar

```javascript
{
  "alias": "Nuevo nombre del método",
  "nombre_titular": "Nuevo Nombre",
  "banco": "Nuevo Banco"
  // Solo incluye los campos que quieras cambiar
}
```

#### Restricciones al Editar

⚠️ **NO se pueden editar:**
- `numero_tarjeta_ultimos_4`
- `id_metodo_pago`
- `email_billetera`
- `fecha_expiracion`
- `identificador_externo`

✅ **SÍ se pueden editar:**
- `alias`
- `nombre_titular`
- `banco`
- `numero_cuenta`
- `es_predeterminado`

---

### 4. ELIMINAR Método de Pago

```http
DELETE /api/metodos-pago-cliente/:id
Authorization: Bearer {token}

# Ejemplo:
DELETE /api/metodos-pago-cliente/1
```

#### Restricciones al Eliminar

⚠️ **No se puede eliminar:**
- El único método de pago si hay órdenes pendientes
- Métodos que están siendo usados en órdenes activas

---

### 5. ACCIONES ESPECIALES

#### Marcar como Predeterminado

```http
PATCH /api/metodos-pago-cliente/:id/predeterminado
Authorization: Bearer {token}

# Ejemplo:
PATCH /api/metodos-pago-cliente/1/predeterminado
```

#### Verificar Método de Pago

```http
PATCH /api/metodos-pago-cliente/:id/verificar
Authorization: Bearer {token}
Content-Type: application/json

# Ejemplo:
PATCH /api/metodos-pago-cliente/1/verificar

{
  "codigo_verificacion": "123456"
}
```

#### Desactivar Método (sin eliminar)

```http
PATCH /api/metodos-pago-cliente/:id/desactivar
Authorization: Bearer {token}

# Ejemplo:
PATCH /api/metodos-pago-cliente/1/desactivar
```

---

## 📦 Crear Órdenes

### Endpoint para Crear Orden

```http
POST /api/ordenes
Authorization: Bearer {token}
Content-Type: application/json
```

### Body Esperado

```javascript
{
  "id_metodo_pago_cliente": number,  // ID del método de pago del cliente (requerido)
  "id_direccion": number,             // ID de la dirección de envío (requerido)
  "notas_orden": string              // Notas especiales (opcional)
}
```

### Ejemplo

```json
{
  "id_metodo_pago_cliente": 5,
  "id_direccion": 3,
  "notas_orden": "Entregar después de las 18:00"
}
```

### Respuesta Exitosa (201)

```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id_orden": 15,
    "numero_orden": "ORD-2025-001234",
    "id_cliente": 4,
    "fecha_orden": "2025-11-14T12:30:00.000Z",
    "estado_orden": "pendiente",
    "total_orden": 150.75,
    "cantidad_productos": 3,
    "id_metodo_pago_cliente": 5,
    "metodo_pago": {
      "nombre_metodo": "Visa",
      "alias": "Mi tarjeta principal"
    },
    "id_direccion": 3,
    "direccion_envio": {
      "calle": "Calle Principal 123",
      "numero": "123",
      "apartamento": "Apt 4B",
      "ciudad": "Santiago",
      "provincia": "RM",
      "codigo_postal": "8320000",
      "pais": "Chile",
      "es_principal": true
    },
    "detalles_orden": [
      {
        "id_detalle_orden": 25,
        "id_producto": 1,
        "nombre_producto": "Laptop",
        "cantidad": 2,
        "precio_unitario": 99.99,
        "subtotal": 199.98
      },
      {
        "id_detalle_orden": 26,
        "id_producto": 3,
        "nombre_producto": "Mouse",
        "cantidad": 1,
        "precio_unitario": 25.38,
        "subtotal": 25.38
      }
    ],
    "notas_orden": "Entregar después de las 18:00"
  }
}
```

### Errores Posibles

**400 - Carrito Vacío**
```json
{
  "success": false,
  "message": "El carrito está vacío. Agrega productos antes de crear una orden",
  "code": "CARRITO_VACIO"
}
```

**400 - Método de Pago No Verificado**
```json
{
  "success": false,
  "message": "El método de pago debe estar verificado para crear órdenes",
  "code": "METODO_NO_VERIFICADO"
}
```

**404 - Dirección No Encontrada**
```json
{
  "success": false,
  "message": "La dirección no existe o no te pertenece",
  "code": "DIRECCION_NO_ENCONTRADA"
}
```

**400 - Stock Insuficiente**
```json
{
  "success": false,
  "message": "Stock insuficiente para Laptop",
  "code": "STOCK_INSUFICIENTE"
}
```

**401 - No Autenticado**
```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "code": "NO_AUTENTICADO"
}
```

### Comportamientos Automáticos

✅ **El backend automáticamente:**
1. Obtiene los items del carrito del cliente autenticado
2. Valida que el carrito no esté vacío
3. Verifica stock de cada producto
4. Calcula el total automáticamente
5. Copia items del carrito a detalles_orden
6. **Vacía el carrito automáticamente**
7. Retorna la orden creada

❌ **El frontend NO debe:**
- Enviar los items del carrito en el body
- Enviar el total (se calcula automáticamente)
- Llamar a DELETE /api/carrito después (backend lo hace)

---

## ✅ Validaciones

### Validación de Método de Pago Verificado

El método de pago debe estar verificado:
- `verificado: true`
- `fecha_verificacion: [fecha]`

Si no está verificado, la orden falla con código `METODO_NO_VERIFICADO`.

### Validación de Carrito

- Debe tener al menos 1 producto
- Cada producto debe tener cantidad > 0
- El stock debe ser suficiente

### Validación de Inventario

Se verifica ANTES de crear la orden:
- Cada producto tiene stock registrado
- Se valida que haya stock suficiente
- Si hay stock insuficiente, la orden falla

### Validación de Total

- Se calcula automáticamente en el backend
- No se confía en el cálculo del frontend
- Se suma cada subtotal de producto

### Validación de Propiedad

- La dirección debe pertenecer al cliente autenticado
- El método de pago debe pertenecer al cliente autenticado
- Se valida mediante id_usuario en el token JWT

---

## 💻 Implementación en Frontend

### Clase para Métodos de Pago

```javascript
class MetodoPagoService {
  constructor(token) {
    this.token = token;
    this.baseURL = '/api/metodos-pago-cliente';
  }

  // 1. CREAR
  async crear(datosMetodo) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosMetodo)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al crear método');
    }

    return data.data;
  }

  // 2. LISTAR TODOS
  async listarTodos() {
    const response = await fetch(this.baseURL, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al listar métodos');
    }

    return data.data;
  }

  // 3. BUSCAR UNO
  async obtenerPorId(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Método no encontrado');
    }

    return data.data;
  }

  // 4. OBTENER PREDETERMINADO
  async obtenerPredeterminado() {
    const response = await fetch(`${this.baseURL}/predeterminado`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'No hay método predeterminado');
    }

    return data.data;
  }

  // 5. ACTUALIZAR
  async actualizar(id, datosParciales) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosParciales)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar método');
    }

    return data.data;
  }

  // 6. ELIMINAR
  async eliminar(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al eliminar método');
    }

    return true;
  }

  // 7. MARCAR COMO PREDETERMINADO
  async marcarPredeterminado(id) {
    const response = await fetch(`${this.baseURL}/${id}/predeterminado`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al marcar predeterminado');
    }

    return data.data;
  }

  // 8. VERIFICAR
  async verificar(id, codigo) {
    const response = await fetch(`${this.baseURL}/${id}/verificar`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codigo_verificacion: codigo })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al verificar método');
    }

    return data.data;
  }

  // 9. DESACTIVAR
  async desactivar(id) {
    const response = await fetch(`${this.baseURL}/${id}/desactivar`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al desactivar método');
    }

    return data.data;
  }
}
```

### Clase para Crear Órdenes

```javascript
class CheckoutService {
  constructor(token) {
    this.token = token;
  }

  async crearOrden(idMetodoPago, idDireccion, notas = '') {
    try {
      // 1. Validaciones locales
      if (!idMetodoPago || !idDireccion) {
        throw new Error('Faltan datos requeridos');
      }

      // 2. Mostrar indicador de carga
      this.mostrarLoading(true);

      // 3. Hacer petición POST
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_metodo_pago_cliente: idMetodoPago,
          id_direccion: idDireccion,
          notas_orden: notas
        })
      });

      const data = await response.json();

      // 4. Validar respuesta
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al crear orden');
      }

      // 5. Mostrar confirmación
      this.mostrarConfirmacion(data.data);

      // 6. Esperar y redirigir
      await this.esperar(3000);
      window.location.href = `/ordenes/${data.data.id_orden}`;

      return data.data;

    } catch (error) {
      console.error('Error creando orden:', error);
      this.mostrarError(error.message);
      throw error;
    } finally {
      this.mostrarLoading(false);
    }
  }

  mostrarLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = show ? 'block' : 'none';
    }
  }

  mostrarConfirmacion(orden) {
    alert(`✅ Orden creada: ${orden.numero_orden}\nTotal: $${orden.total_orden.toFixed(2)}`);
  }

  mostrarError(mensaje) {
    alert('❌ Error: ' + mensaje);
  }

  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Uso Completo

```javascript
const token = localStorage.getItem('token');
const metodoService = new MetodoPagoService(token);
const checkout = new CheckoutService(token);

// Crear una tarjeta de crédito
(async () => {
  try {
    const nuevoMetodo = await metodoService.crear({
      id_metodo_pago: 1,
      alias: "Mi Visa",
      numero_tarjeta_ultimos_4: "1234",
      nombre_titular: "Juan Pérez",
      fecha_expiracion: "2025-12-31",
      tipo_tarjeta: "visa",
      banco: "Banco Nacional",
      es_predeterminado: true
    });
    
    console.log('✅ Método creado:', nuevoMetodo);
    
    // Si requiere verificación
    if (nuevoMetodo.requiere_verificacion) {
      const codigo = prompt('Ingresa el código de verificación:');
      await metodoService.verificar(
        nuevoMetodo.id_metodo_pago_cliente,
        codigo
      );
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

// Crear orden
document.getElementById('btn-confirmar').addEventListener('click', async () => {
  const idMetodo = document.getElementById('select-metodo').value;
  const idDireccion = document.getElementById('select-direccion').value;
  const notas = document.getElementById('textarea-notas').value;
  
  await checkout.crearOrden(
    parseInt(idMetodo),
    parseInt(idDireccion),
    notas
  );
});
```

---

## 📊 Tabla Resumen de Endpoints

### Métodos de Pago del Cliente

| Operación | Método | Endpoint | Requiere Body |
|-----------|--------|----------|---------------|
| Crear | POST | `/api/metodos-pago-cliente` | ✅ Completo |
| Listar | GET | `/api/metodos-pago-cliente` | ❌ No |
| Buscar uno | GET | `/api/metodos-pago-cliente/:id` | ❌ No |
| Predeterminado | GET | `/api/metodos-pago-cliente/predeterminado` | ❌ No |
| Actualizar | PUT | `/api/metodos-pago-cliente/:id` | ✅ Parcial |
| Eliminar | DELETE | `/api/metodos-pago-cliente/:id` | ❌ No |
| Marcar predeterminado | PATCH | `/api/metodos-pago-cliente/:id/predeterminado` | ❌ No |
| Verificar | PATCH | `/api/metodos-pago-cliente/:id/verificar` | ✅ Código |
| Desactivar | PATCH | `/api/metodos-pago-cliente/:id/desactivar` | ❌ No |

### Órdenes

| Operación | Método | Endpoint |
|-----------|--------|----------|
| Crear | POST | `/api/ordenes` |
| Listar | GET | `/api/ordenes` |
| Obtener uno | GET | `/api/ordenes/:id` |
| Actualizar estado | PATCH | `/api/ordenes/:id/estado` |

---

## ⚠️ Requisitos Previos para Crear Orden

Antes de generar una orden, el cliente DEBE tener:

- ✅ Estar autenticado (tener token válido)
- ✅ Perfil de cliente creado
- ✅ Carrito con productos (mínimo 1 item)
- ✅ Dirección de envío registrada o creada
- ✅ Método de pago registrado
- ✅ Método de pago verificado
- ✅ Stock disponible para los productos

---

## 🔐 Seguridad

### Autenticación

Todos los endpoints de cliente requieren token JWT en el header:

```
Authorization: Bearer {token}
```

### Autorización

- Los clientes solo ven sus propios métodos de pago
- Los clientes solo usan sus propias direcciones
- Los clientes solo ver sus propias órdenes

### Validaciones de Seguridad

- No se confía en los totales enviados por cliente
- No se pueden editar datos sensibles (números de tarjeta)
- Se valida propiedad de métodos y direcciones
- Se valida inventario antes de crear orden

---

## 📞 Soporte

Para más información sobre otros endpoints, consulta:
- [endpoints.MD](endpoints.MD)
- [FLUJO_DATOS.MD](FLUJO_DATOS.MD)
- [GUIA_ERRORES_BEST_PRACTICES.js](GUIA_ERRORES_BEST_PRACTICES.js)
