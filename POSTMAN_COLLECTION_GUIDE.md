# 📮 POSTMAN COLLECTION - Guía de Uso

**Archivo:** `Postman_Collection_Metodos_Pago.json`  
**Fecha:** 17 de Noviembre de 2025  
**Versión:** 1.0

---

## 🚀 INSTALACIÓN Y CONFIGURACIÓN

### Paso 1: Descargar la Colección

El archivo `Postman_Collection_Metodos_Pago.json` está en la raíz del proyecto.

### Paso 2: Importar en Postman

1. Abre Postman
2. Click en **"Import"** (botón superior izquierdo)
3. Selecciona **"Upload Files"**
4. Busca y selecciona: `Postman_Collection_Metodos_Pago.json`
5. Click en **"Import"**

✅ La colección estará disponible en el panel izquierdo

---

## ⚙️ CONFIGURAR VARIABLES

La colección usa variables para facilitar las pruebas:

### Variables Disponibles

```
base_url      → URL del servidor (default: http://localhost:3000)
token         → Token JWT genérico
client_token  → Token JWT de cliente autenticado
admin_token   → Token JWT de admin/administrador
```

### Cómo Configurar las Variables

**Opción 1: Desde Postman (Recomendado)**

1. Click en la colección → **"Edit"**
2. Tab: **"Variables"**
3. Actualizar valores:

```
base_url:     http://localhost:3000
token:        <token JWT aquí>
client_token: <token JWT de cliente aquí>
admin_token:  <token JWT de admin aquí>
```

4. Click **"Update"**

**Opción 2: Desde el Request Individual**

1. Abrir cualquier request
2. En el header `Authorization`, cambiar `{{client_token}}` por tu token real
3. Ej: `Authorization: Bearer eyJhbGc...`

---

## 🔑 OBTENER TOKENS JWT

### Para Cliente:

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "cliente@ejemplo.com",
  "password": "password123"
}
```

Copiar el `token` de la respuesta y pegar en `client_token`

### Para Admin:

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@ejemplo.com",
  "password": "admin123"
}
```

Copiar el `token` de la respuesta y pegar en `admin_token`

---

## 📋 ESTRUCTURA DE LA COLECCIÓN

### 1️⃣ **MÉTODOS DE PAGO SISTEMA** (Admin Only)

Endpoints para gestionar los tipos de métodos de pago:

- ✅ GET - Obtener todos los métodos de pago
- ✅ GET - Obtener métodos activos
- ✅ GET - Obtener métodos online
- ✅ GET - Obtener métodos tienda
- ✅ GET - Obtener métodos por tipo
- ✅ POST - Crear método de pago (Admin)
- ✅ PUT - Actualizar método de pago (Admin)
- ✅ DELETE - Eliminar método de pago (Admin)
- ✅ PATCH - Activar/Desactivar método (Admin)
- ✅ PATCH - Actualizar configuración (Admin)

### 2️⃣ **MÉTODOS DE PAGO CLIENTE**

Endpoints para que clientes gestionen sus métodos:

- ✅ POST - Crear método de pago (Cliente)
- ✅ GET - Obtener mis métodos de pago
- ✅ GET - Obtener métodos con filtros
- ✅ GET - Obtener método predeterminado
- ✅ GET - Obtener método específico
- ✅ PUT - Actualizar método de pago
- ✅ DELETE - Eliminar método de pago
- ✅ PATCH - Establecer como predeterminado
- ✅ PATCH - Verificar método de pago

### 3️⃣ **ADMIN - MÉTODOS DE PAGO CLIENTE**

Endpoints administrativos:

- ✅ GET - Obtener métodos de cualquier cliente (Admin)
- ✅ PATCH - Verificar método para cliente (Admin)

### 4️⃣ **TEST SCENARIOS**

Escenarios de prueba listos para usar:

- ✅ Escenario 1 - Crear Tarjeta de Crédito
- ✅ Escenario 2 - Crear PayPal
- ✅ Escenario 3 - Crear Transferencia Bancaria
- ✅ Escenario 4 - Crear Bitcoin
- ✅ Escenario 5 - Crear Efectivo
- ✅ Escenario 6 - Cambiar método predeterminado
- ✅ Escenario 7 - Listar todos los métodos

---

## 🧪 FLUJO DE PRUEBA RECOMENDADO

### 1. Comenzar con Métodos de Pago del Sistema

```
1️⃣  GET - Obtener todos los métodos de pago
    └─ Verifica qué ID usar para cada tipo

2️⃣  GET - Obtener métodos activos
    └─ Confirma métodos disponibles

3️⃣  GET - Obtener métodos online
    └─ Métodos disponibles para compra online
```

### 2. Crear Métodos de Pago (Cliente)

Usa los ID obtenidos en el paso anterior:

```
1️⃣  POST - Escenario 1: Crear Tarjeta de Crédito
    Body: { id_metodo_pago: 1, ... }
    
2️⃣  POST - Escenario 2: Crear PayPal
    Body: { id_metodo_pago: 2, ... }
    
3️⃣  POST - Escenario 3: Crear Transferencia
    Body: { id_metodo_pago: 3, ... }
```

### 3. Listar y Verificar

```
1️⃣  GET - Obtener mis métodos de pago
    └─ Verifica que se crearon todos

2️⃣  GET - Obtener método predeterminado
    └─ Confirma el método predeterminado

3️⃣  GET - Obtener método específico (ID: 1)
    └─ Detalle de un método individual
```

### 4. Operaciones Adicionales

```
1️⃣  PATCH - Establecer como predeterminado
    └─ Cambia método predeterminado

2️⃣  PUT - Actualizar método de pago
    └─ Modifica alias o banco

3️⃣  DELETE - Eliminar método de pago
    └─ Soft delete (desactiva)
```

---

## 📊 RESPUESTAS ESPERADAS

### ✅ Éxito (201 Created)

```json
{
  "success": true,
  "message": "Método de pago guardado exitosamente",
  "data": {
    "id_metodo_pago_cliente": 1,
    "alias": "Mi Visa Principal",
    "numero_tarjeta_ultimos_4": "4567",
    "nombre_titular": "Juan Pérez",
    "fecha_expiracion": "2025-12-31",
    "tipo_tarjeta": "visa",
    "banco": "Banco Nacional",
    "verificado": false,
    "es_predeterminado": true,
    "creado_en": "2025-11-17T12:30:00.000Z"
  }
}
```

### ❌ Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Datos inválidos",
  "code": "VALIDACION_ERROR"
}
```

### ❌ Error (401 Unauthorized)

```json
{
  "success": false,
  "message": "Token inválido",
  "code": "NO_AUTENTICADO"
}
```

### ❌ Error (409 Conflict)

```json
{
  "success": false,
  "message": "Este método de pago ya está registrado",
  "code": "DUPLICADO"
}
```

---

## 🔍 VALIDACIONES AUTOMÁTICAS

La colección incluye validaciones en los body de ejemplo. Si quieres cambiar valores:

### Para Tarjeta de Crédito:
- `numero_tarjeta_ultimos_4`: 4 dígitos (ej: "4567")
- `fecha_expiracion`: Formato YYYY-MM-DD (ej: "2025-12-31")
- `tipo_tarjeta`: visa, mastercard, amex, discover, otro

### Para PayPal:
- `email_billetera`: Email válido (ej: "usuario@gmail.com")

### Para Transferencia:
- `numero_cuenta`: Cualquier string (ej: "1234567890")
- `nombre_titular`: Nombre completo (ej: "Juan Pérez García")

### Para Bitcoin:
- `identificador_externo`: Dirección Bitcoin válida

### Para Efectivo:
- `identificador_externo`: "contra_entrega"

---

## 🎯 CASOS DE PRUEBA

### Caso 1: Crear método con datos inválidos

```bash
POST /api/metodos-pago-cliente
{
  "id_metodo_pago": 999,  # ID no existe
  "alias": "Mi Método"
}

✗ Respuesta: 400 VALIDACION_ERROR
```

### Caso 2: Crear método duplicado

```bash
# Primera vez
POST /api/metodos-pago-cliente
{ "id_metodo_pago": 1, "alias": "Mi Visa", ... }

✓ Respuesta: 201 Created

# Segunda vez (igual)
POST /api/metodos-pago-cliente
{ "id_metodo_pago": 1, "alias": "Mi Visa", ... }

✗ Respuesta: 409 DUPLICADO
```

### Caso 3: Sin autenticación

```bash
GET /api/metodos-pago-cliente
(Sin Authorization header)

✗ Respuesta: 401 NO_AUTENTICADO
```

### Caso 4: Sin permiso de admin

```bash
DELETE /api/metodos-pago/1
Authorization: Bearer {{client_token}}

✗ Respuesta: 403 ACCESO_DENEGADO
```

---

## 📝 NOTAS IMPORTANTES

1. **Variables:** Siempre configurar tokens válidos primero
2. **Base URL:** Asegurar que servidor esté corriendo (`npm start`)
3. **Headers:** Authorization y Content-Type se incluyen automáticamente
4. **IDs:** Cambiar IDs según datos reales de tu base de datos
5. **Tokens:** Los tokens JWT expiran, obten uno nuevo si es necesario

---

## 🆘 TROUBLESHOOTING

### Error: "Could not resolve variable base_url"
✓ Solución: Asegurar variables están configuradas en la colección

### Error: "Bearer undefined" en Authorization
✓ Solución: Pegar el token JWT en la variable correspondiente

### Error: "Connection refused"
✓ Solución: Verificar que servidor está corriendo (`npm start`)

### Error: "401 Unauthorized"
✓ Solución: Verificar que el token no esté expirado

### Error: "409 Duplicado"
✓ Solución: Método ya existe, cambiar alias o usar diferente id_metodo_pago

---

## 📚 REFERENCIA RÁPIDA

| Método | Endpoint | Requiere Auth | Solo Admin |
|--------|----------|---------------|-----------|
| GET | /metodos-pago | ✅ | ❌ |
| GET | /metodos-pago/activos | ✅ | ❌ |
| POST | /metodos-pago | ✅ | ✅ |
| POST | /metodos-pago-cliente | ✅ | ❌ |
| GET | /metodos-pago-cliente | ✅ | ❌ |
| PATCH | /metodos-pago-cliente/:id/predeterminado | ✅ | ❌ |
| DELETE | /metodos-pago-cliente/:id | ✅ | ❌ |

---

## 🎁 BONUS: Exportar Colección

Para compartir la colección con tu equipo:

1. Click derecho en la colección
2. Click en **"Export"**
3. Seleccionar formato: **JSON**
4. Guardar archivo
5. Compartir con el equipo

---

**Última actualización:** 17 de Noviembre de 2025  
**Status:** ✅ Listo para usar

¡Comienza a probar los endpoints ahora!
