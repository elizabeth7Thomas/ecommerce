# 👥 Guía Completa: Roles y Usuarios

## 📋 Tabla de Contenidos
1. [Roles Disponibles](#roles-disponibles)
2. [Cómo Crear Roles](#cómo-crear-roles)
3. [Cómo Crear Usuarios](#cómo-crear-usuarios)
4. [Insertar Roles por Defecto](#insertar-roles-por-defecto)
5. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🎭 Roles Disponibles

### 1. **Administrador** (ID: 1)
- ✅ Acceso total al sistema
- ✅ Gestión de todos los módulos
- ✅ Crear/editar/eliminar cualquier recurso

### 2. **Cliente** (ID: 2) - **Por Defecto**
- ✅ Comprar productos
- ✅ Gestionar su carrito
- ✅ Crear órdenes
- ✅ Ver y editar su perfil

### 3. **Vendedor** (ID: 3)
- ✅ Crear y editar productos
- ✅ Gestionar imágenes de productos
- ✅ Ver órdenes
- ✅ Ver clientes

### 4. **Moderador** (ID: 4)
- ✅ Moderar productos y categorías
- ✅ Gestionar órdenes
- ✅ Ver usuarios y clientes

---

## 🚀 Insertar Roles por Defecto

### Opción 1: Ejecutar el Script Automático (Recomendado)

```bash
node src/script/roles_default.js
```

Este script insertará automáticamente los 4 roles básicos.

### Opción 2: Crear Roles Manualmente vía API

#### 1. **Crear Rol Administrador**
```json
POST http://localhost:3000/api/roles
Content-Type: application/json

{
  "nombre_rol": "administrador",
  "descripcion": "Acceso total al sistema",
  "permisos": {
    "productos": ["crear", "editar", "eliminar", "ver"],
    "categorias": ["crear", "editar", "eliminar", "ver"],
    "usuarios": ["crear", "editar", "eliminar", "ver"],
    "clientes": ["crear", "editar", "eliminar", "ver"],
    "ordenes": ["crear", "editar", "eliminar", "ver", "gestionar"],
    "pagos": ["crear", "ver", "gestionar"],
    "roles": ["crear", "editar", "eliminar", "ver"]
  }
}
```

#### 2. **Crear Rol Cliente**
```json
POST http://localhost:3000/api/roles

{
  "nombre_rol": "cliente",
  "descripcion": "Usuario estándar con permisos de compra",
  "permisos": {
    "productos": ["ver"],
    "categorias": ["ver"],
    "carrito": ["crear", "editar", "eliminar", "ver"],
    "ordenes": ["crear", "ver"],
    "pagos": ["crear", "ver"],
    "direcciones": ["crear", "editar", "eliminar", "ver"]
  }
}
```

#### 3. **Crear Rol Vendedor**
```json
POST http://localhost:3000/api/roles

{
  "nombre_rol": "vendedor",
  "descripcion": "Usuario con permisos de gestión de productos",
  "permisos": {
    "productos": ["crear", "editar", "ver"],
    "categorias": ["ver"],
    "imagenes": ["crear", "editar", "ver"],
    "ordenes": ["ver"],
    "clientes": ["ver"]
  }
}
```

#### 4. **Crear Rol Moderador**
```json
POST http://localhost:3000/api/roles

{
  "nombre_rol": "moderador",
  "descripcion": "Usuario con permisos de moderación",
  "permisos": {
    "productos": ["ver", "editar"],
    "categorias": ["ver", "editar"],
    "usuarios": ["ver"],
    "ordenes": ["ver", "gestionar"],
    "pagos": ["ver"]
  }
}
```

---

## 👤 Cómo Crear Usuarios

### 1. **Crear Usuario Administrador**

```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "nombre_usuario": "admin",
  "correo_electronico": "admin@ecommerce.com",
  "contrasena": "Admin123!",
  "id_rol": 1
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id_usuario": 1,
    "nombre_usuario": "admin",
    "correo_electronico": "admin@ecommerce.com",
    "id_rol": 1,
    "Rol": {
      "nombre_rol": "administrador",
      "descripcion": "Acceso total al sistema"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. **Crear Usuario Cliente** (Por Defecto)

```json
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "juanperez",
  "correo_electronico": "juan@example.com",
  "contrasena": "password123"
}
```

**Nota:** Si no especificas `id_rol`, el sistema asigna automáticamente `id_rol: 2` (cliente).

### 3. **Crear Usuario Vendedor**

```json
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "vendedor1",
  "correo_electronico": "vendedor@ecommerce.com",
  "contrasena": "Vendedor123!",
  "id_rol": 3
}
```

### 4. **Crear Usuario Moderador**

```json
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "moderador1",
  "correo_electronico": "moderador@ecommerce.com",
  "contrasena": "Moderador123!",
  "id_rol": 4
}
```

---

## 📝 Ejemplos Prácticos

### Escenario 1: Configuración Inicial del Sistema

```bash
# Paso 1: Insertar roles por defecto
node src/script/roles_default.js

# Paso 2: Iniciar el servidor
npm start
```

Luego en Postman:

```json
# Paso 3: Crear el primer administrador
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "superadmin",
  "correo_electronico": "admin@tuempresa.com",
  "contrasena": "SuperSecure123!",
  "id_rol": 1
}

# Paso 4: Crear usuarios de prueba
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "cliente_test",
  "correo_electronico": "cliente@test.com",
  "contrasena": "test123"
}
```

### Escenario 2: Crear un Rol Personalizado

```json
# Paso 1: Crear el rol personalizado
POST http://localhost:3000/api/roles
Authorization: Bearer {token_admin}

{
  "nombre_rol": "soporte",
  "descripcion": "Personal de soporte al cliente",
  "permisos": {
    "clientes": ["ver", "editar"],
    "ordenes": ["ver", "editar"],
    "pagos": ["ver"],
    "productos": ["ver"]
  }
}

# Respuesta:
{
  "message": "Rol creado exitosamente",
  "rol": {
    "id_rol": 5,
    "nombre_rol": "soporte",
    "descripcion": "Personal de soporte al cliente",
    "permisos": {...}
  }
}

# Paso 2: Crear usuario con ese rol
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "soporte1",
  "correo_electronico": "soporte@empresa.com",
  "contrasena": "Soporte123!",
  "id_rol": 5
}
```

---

## 🔒 Verificación de Permisos

El sistema verifica automáticamente los permisos en los middlewares:

```javascript
// En las rutas protegidas
router.post('/productos', [verifyToken, isAdmin], productoController.create);
```

Los permisos se verifican mediante:
- `verifyToken` - Verifica que el usuario esté autenticado
- `isAdmin` - Verifica que el rol tenga el nombre "administrador"
- `hasRole(['vendedor', 'administrador'])` - Verifica múltiples roles

---

## 📊 Ver Roles Existentes

```json
GET http://localhost:3000/api/roles
Authorization: Bearer {token_admin}
```

**Respuesta:**
```json
[
  {
    "id_rol": 1,
    "nombre_rol": "administrador",
    "descripcion": "Acceso total al sistema",
    "permisos": {...},
    "activo": true
  },
  {
    "id_rol": 2,
    "nombre_rol": "cliente",
    "descripcion": "Usuario estándar",
    "permisos": {...},
    "activo": true
  }
]
```

---

## ⚙️ Actualizar Permisos de un Rol

```json
PUT http://localhost:3000/api/roles/3
Authorization: Bearer {token_admin}

{
  "permisos": {
    "productos": ["crear", "editar", "ver", "eliminar"],
    "categorias": ["ver", "editar"],
    "ordenes": ["ver", "gestionar"]
  }
}
```

---

## 🎯 Resumen Rápido

| Acción | Endpoint | Requiere | Body |
|--------|----------|----------|------|
| **Crear rol** | `POST /api/roles` | Token Admin | `{nombre_rol, descripcion, permisos}` |
| **Ver roles** | `GET /api/roles` | Token Admin | - |
| **Crear usuario** | `POST /api/auth/register` | - | `{nombre_usuario, correo_electronico, contrasena, id_rol}` |
| **Login** | `POST /api/auth/login` | - | `{correo_electronico, contrasena}` |
| **Crear admin** | `POST /api/auth/register` | - | `{..., id_rol: 1}` |
| **Crear cliente** | `POST /api/auth/register` | - | `{..., id_rol: 2}` o sin especificar |

---

## 🚨 Notas Importantes

1. ⚠️ **Ejecuta primero el script de roles** antes de crear usuarios
2. ⚠️ El **primer usuario administrador** puede crearse sin autenticación
3. ⚠️ Después del primer admin, solo admins pueden crear otros admins
4. ⚠️ Los permisos se almacenan en formato JSONB (PostgreSQL)
5. ⚠️ El rol **cliente** (ID: 2) es el rol por defecto

---

¡Listo para gestionar roles y usuarios! 🎉
