# 🎯 Registro de Usuario con Creación Automática de Cliente

## ✅ Cambios Implementados

Se modificó `src/controllers/auth.controller.js` para crear automáticamente un perfil de cliente cuando un usuario se registra con rol "cliente".

### Flujo Mejorado

```
POST /api/auth/register
        ↓
  Crear Usuario
  (id_rol = 2)
        ↓
  ¿Es cliente?
   ↙        ↘
  Sí         No
   ↓          ↓
Crear Cliente  Continuar
   ↓
Retornar token
     + cliente
```

---

## 📝 Body de Solicitud

```json
{
  "nombre_usuario": "juan_perez",
  "correo_electronico": "juan@example.com",
  "contrasena": "MiPassword123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+502 1234-5678"
}
```

**Campos opcionales pero recomendados:**
- `nombre` - Nombre del cliente
- `apellido` - Apellido del cliente
- `telefono` - Teléfono de contacto

---

## 📤 Response (Éxito)

```json
{
  "status": "created",
  "message": "Usuario y cliente creados exitosamente",
  "data": {
    "id_usuario": 5,
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "id_rol": 2,
    "nombre_rol": "cliente",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cliente": {
      "id_cliente": 3,
      "id_usuario": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "telefono": "+502 1234-5678"
    }
  }
}
```

---

## 🔄 Flujo Completo (Cliente)

```javascript
// 1. REGISTRO
POST /api/auth/register
{
  "nombre_usuario": "juan_perez",
  "correo_electronico": "juan@example.com",
  "contrasena": "MiPassword123!",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+502 1234-5678"
}

↓ RESPONSE
{
  "data": {
    "id_usuario": 5,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "cliente": {
      "id_cliente": 3,
      "id_usuario": 5,
      "nombre": "Juan"
    }
  }
}

// 2. LOGIN (posterior)
POST /api/auth/login
{
  "correo_electronico": "juan@example.com",
  "contrasena": "MiPassword123!"
}

// 3. USAR CLIENTE (con token)
GET /api/clientes/perfil
Authorization: Bearer {token}

// 4. ACTUALIZAR CLIENTE
PUT /api/clientes/{id_cliente}
Authorization: Bearer {token}
{
  "nombre": "Juan Updated",
  "telefono": "+502 9999-9999"
}
```

---

## 🛡️ Manejo de Errores

### Caso 1: Falla al crear cliente
```json
{
  "status": "error",
  "message": "Error al crear el perfil de cliente. Por favor intenta de nuevo.",
  "statusCode": 400
}
```

**Qué sucede internamente:**
1. Se crea el Usuario ✅
2. Falla al crear Cliente ❌
3. Se revierte y elimina el Usuario ✅
4. Se retorna error al cliente

### Caso 2: Validación falla
```json
{
  "status": "error",
  "message": "Correo electrónico ya existe",
  "statusCode": 400
}
```

---

## ✨ Casos Especiales

### Caso A: Registrar como Administrador
```json
{
  "nombre_usuario": "admin",
  "correo_electronico": "admin@example.com",
  "contrasena": "AdminPass123!",
  "id_rol": 1
}
```

**Resultado:**
- ✅ Usuario creado
- ❌ Cliente NO creado (porque id_rol ≠ 2)

### Caso B: Campos opcionales vacíos
```json
{
  "nombre_usuario": "usuario123",
  "correo_electronico": "user@example.com",
  "contrasena": "Password123!"
}
```

**Resultado:**
- ✅ Usuario creado
- ✅ Cliente creado con nombre/apellido vacíos
- ✅ Teléfono como null

---

## 🔐 Token JWT

El token contiene:
```javascript
{
  "id_usuario": 5,
  "id_rol": 2,
  "nombre_rol": "cliente",
  "iat": 1699540800,
  "exp": 1699627200  // 24 horas
}
```

**Usar en endpoints:**
```bash
curl -X GET http://localhost:3000/api/clientes/perfil \
  -H "Authorization: Bearer {token}"
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| Pasos para crear cliente | 2 | 1 |
| Endpoints | POST /register → POST /clientes | POST /register |
| Consistencia | ❌ Riesgo de usuarios sin cliente | ✅ Garantizado |
| Seguridad | ❌ Posibles huérfanos | ✅ Transaccional |
| UX | ❌ 2 solicitudes | ✅ 1 solicitud |

---

## 🚀 Endpoint POST /api/clientes Ahora Es Opcional

Aún existe pero se usa solo para casos especiales:
- Crear cliente para usuario existente
- Registros en masa desde admin
- Migraciones de datos

**Su uso ahora requiere token:**
```bash
POST /api/clientes
Authorization: Bearer {token}
{
  "nombre": "María",
  "apellido": "García",
  "telefono": "+502 8888-8888"
}
```

El `id_usuario` se extrae del token automáticamente.

---

## ✅ Resumen

✔️ Creación automática de cliente en registro
✔️ Transaccional: si falla uno, se revierte el otro
✔️ Token incluye información del cliente
✔️ Body simplificado para el usuario
✔️ Response incluye datos del cliente creado
✔️ Compatible con flujos de login posterior

**Implementación completada y lista para usar! 🎉**
