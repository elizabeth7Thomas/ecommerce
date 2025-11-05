# 🚀 Ejemplos Rápidos - Crear Usuarios con Roles

## ✅ Los roles ya están creados en tu base de datos:

1. **Administrador** (ID: 1)
2. **Cliente** (ID: 2) - Por defecto
3. **Vendedor** (ID: 3)
4. **Moderador** (ID: 4)

---

## 👤 Crear Usuarios - Copiar y Pegar en Postman

### 1️⃣ Crear Administrador

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "nombre_usuario": "admin",
  "correo_electronico": "admin@ecommerce.com",
  "contrasena": "Admin123!",
  "id_rol": 1
}
```

---

### 2️⃣ Crear Cliente (Opción 1 - Con id_rol)

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "nombre_usuario": "cliente1",
  "correo_electronico": "cliente@example.com",
  "contrasena": "Cliente123!",
  "id_rol": 2
}
```

---

### 2️⃣ Crear Cliente (Opción 2 - Sin especificar rol)

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "nombre_usuario": "juanperez",
  "correo_electronico": "juan@example.com",
  "contrasena": "password123"
}
```

**Nota:** Si no especificas `id_rol`, automáticamente será cliente (ID: 2)

---

### 3️⃣ Crear Vendedor

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "nombre_usuario": "vendedor1",
  "correo_electronico": "vendedor@ecommerce.com",
  "contrasena": "Vendedor123!",
  "id_rol": 3
}
```

---

### 4️⃣ Crear Moderador

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "nombre_usuario": "moderador1",
  "correo_electronico": "moderador@ecommerce.com",
  "contrasena": "Moderador123!",
  "id_rol": 4
}
```

---

## 🎭 Crear Nuevos Roles Personalizados

### Ejemplo: Crear Rol "Soporte"

```
POST http://localhost:3000/api/roles
Content-Type: application/json
Authorization: Bearer {tu_token_aqui}
```

```json
{
  "nombre_rol": "soporte",
  "descripcion": "Personal de atención al cliente",
  "permisos": {
    "clientes": ["ver", "editar"],
    "ordenes": ["ver", "editar"],
    "productos": ["ver"],
    "pagos": ["ver"]
  }
}
```

**Respuesta:**
```json
{
  "message": "Rol creado exitosamente",
  "rol": {
    "id_rol": 5,
    "nombre_rol": "soporte",
    "descripcion": "Personal de atención al cliente",
    "permisos": {...}
  }
}
```

**Luego crear usuario con ese rol:**
```json
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "soporte1",
  "correo_electronico": "soporte@ecommerce.com",
  "contrasena": "Soporte123!",
  "id_rol": 5
}
```

---

## 🔑 Login con Diferentes Usuarios

### Login como Administrador

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "correo_electronico": "admin@ecommerce.com",
  "contrasena": "Admin123!"
}
```

### Login como Cliente

```json
{
  "correo_electronico": "juan@example.com",
  "contrasena": "password123"
}
```

### Login como Vendedor

```json
{
  "correo_electronico": "vendedor@ecommerce.com",
  "contrasena": "Vendedor123!"
}
```

---

## 📋 Ver Todos los Roles

```
GET http://localhost:3000/api/roles
Authorization: Bearer {token_admin}
```

---

## 📊 Ver Información de un Rol Específico

```
GET http://localhost:3000/api/roles/1
Authorization: Bearer {token_admin}
```

---

## ✏️ Actualizar Permisos de un Rol

```
PUT http://localhost:3000/api/roles/3
Authorization: Bearer {token_admin}
Content-Type: application/json
```

```json
{
  "permisos": {
    "productos": ["crear", "editar", "ver", "eliminar"],
    "categorias": ["crear", "ver"],
    "imagenes": ["crear", "editar", "eliminar", "ver"],
    "ordenes": ["ver", "gestionar"]
  }
}
```

---

## 🗑️ Desactivar un Rol

```
DELETE http://localhost:3000/api/roles/4
Authorization: Bearer {token_admin}
```

---

## 📝 Notas Importantes

1. ✅ **Los roles ya están creados** - Ejecutaste: `npm run setup:roles`
2. ✅ **Primer admin no requiere token** - Puedes crear el primer administrador sin autenticación
3. ✅ **Cliente es el rol por defecto** - Si no especificas `id_rol`, será cliente (ID: 2)
4. ⚠️ **Después del primer admin** - Para crear más admins necesitas token de administrador
5. 🔐 **Guarda el token** - Postman lo guarda automáticamente en las variables de colección

---

## 🎯 Flujo Recomendado

```
1. npm run setup:roles          ← Ya lo hiciste ✅
2. Crear primer administrador   ← Siguiente paso
3. Login como admin
4. Crear otros usuarios
5. Probar endpoints
```

---

## 🆘 ¿Necesitas Reinsertar los Roles?

Si necesitas volver a crear los roles, simplemente ejecuta:

```bash
npm run setup:roles
```

El script verificará si ya existen y no los duplicará.

---

¡Listo para crear usuarios! 🎉
