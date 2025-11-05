# 👥 Sistema de Roles - Documentación Completa

## 📋 Descripción General

Se ha implementado un sistema completo de roles con relación a usuarios, permitiendo una gestión flexible de permisos y accesos en la API de E-commerce.

---

## 🗄️ Estructura de la Base de Datos

### Tabla: **Roles**

```sql
CREATE TABLE Roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: **Usuarios** (Actualizada)

```sql
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    correo_electronico VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL DEFAULT 2, -- 2 = cliente
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE RESTRICT
);
```

### Relación:
- **Roles → Usuarios**: Relación 1:N (Un rol puede tener muchos usuarios)
- **Usuarios → Rol**: Cada usuario tiene un rol asignado

---

## 🎭 Roles por Defecto

Al ejecutar el script SQL o sincronizar modelos, se crean 3 roles por defecto:

### 1. **Administrador** (id_rol: 1)
- **Descripción**: Usuario con permisos administrativos completos
- **Permisos**:
  ```json
  {
    "productos": ["crear", "editar", "eliminar", "ver"],
    "categorias": ["crear", "editar", "eliminar", "ver"],
    "usuarios": ["ver", "editar", "eliminar"],
    "ordenes": ["ver", "editar", "cancelar"],
    "pagos": ["ver", "editar"]
  }
  ```

### 2. **Cliente** (id_rol: 2) - Por Defecto
- **Descripción**: Usuario cliente con permisos básicos
- **Permisos**:
  ```json
  {
    "productos": ["ver"],
    "carrito": ["agregar", "editar", "eliminar", "ver"],
    "ordenes": ["crear", "ver"],
    "perfil": ["ver", "editar"]
  }
  ```

### 3. **Vendedor** (id_rol: 3)
- **Descripción**: Usuario vendedor con permisos de gestión de productos
- **Permisos**:
  ```json
  {
    "productos": ["crear", "editar", "ver"],
    "categorias": ["ver"],
    "ordenes": ["ver"]
  }
  ```

---

## 🔧 Archivos Creados/Modificados

### ✅ Archivos Nuevos:

1. **`src/models/rol.model.js`** - Modelo de Rol con Sequelize
2. **`src/services/rol.service.js`** - Servicio para operaciones CRUD de roles
3. **`src/controllers/rol.controller.js`** - Controlador de endpoints de roles
4. **`src/routes/rol.routes.js`** - Rutas de la API de roles

### ✅ Archivos Modificados:

1. **`src/models/user.model.js`** - Agregada relación con Rol
   - Eliminado campo `rol` tipo STRING
   - Agregado campo `id_rol` tipo INTEGER (foreign key)

2. **`src/models/index.js`** - Agregada asociación Rol-Usuario

3. **`src/controllers/auth.controller.js`** - Actualizado para trabajar con roles
   - Soporte para `nombre_rol` o `id_rol` en registro
   - Token JWT incluye información del rol
   - Respuestas incluyen permisos del rol

4. **`src/services/user.service.js`** - Incluye rol en consultas

5. **`src/middlewares/auth.middleware.js`** - Actualizado para nuevos campos de rol

6. **`src/routes/index.js`** - Agregada ruta `/roles`

7. **`src/script/completo.sql`** - Agregada tabla Roles e inserts por defecto

8. **`collection.json`** - Agregada sección de Roles con todos los endpoints

---

## 🚀 Endpoints de la API

### Públicos (Sin autenticación):

#### **GET** `/api/roles`
Obtiene todos los roles activos
```bash
curl http://localhost:3000/api/roles
```

#### **GET** `/api/roles/:id`
Obtiene un rol por ID
```bash
curl http://localhost:3000/api/roles/1
```

### Protegidos (Solo Administrador):

#### **POST** `/api/roles`
Crea un nuevo rol
```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_rol": "moderador",
    "descripcion": "Usuario moderador",
    "permisos": {
      "productos": ["ver", "editar"],
      "categorias": ["ver"]
    }
  }'
```

#### **PUT** `/api/roles/:id`
Actualiza un rol existente
```bash
curl -X PUT http://localhost:3000/api/roles/3 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Descripción actualizada",
    "permisos": {...}
  }'
```

#### **DELETE** `/api/roles/:id`
Desactiva un rol
```bash
curl -X DELETE http://localhost:3000/api/roles/3 \
  -H "Authorization: Bearer {token}"
```

---

## 🧪 Ejemplos de Uso

### 1. Registrar Usuario con Rol Específico

**Opción A: Usando nombre_rol**
```json
POST /api/auth/register
{
  "nombre_usuario": "adminuser",
  "correo_electronico": "admin@example.com",
  "contrasena": "admin123",
  "nombre_rol": "administrador"
}
```

**Opción B: Usando id_rol**
```json
POST /api/auth/register
{
  "nombre_usuario": "vendedor1",
  "correo_electronico": "vendedor@example.com",
  "contrasena": "vend123",
  "id_rol": 3
}
```

**Opción C: Sin especificar (usa cliente por defecto)**
```json
POST /api/auth/register
{
  "nombre_usuario": "cliente1",
  "correo_electronico": "cliente@example.com",
  "contrasena": "client123"
}
```

### 2. Respuesta del Login Incluye Permisos

```json
{
  "message": "Login exitoso",
  "user": {
    "id_usuario": 1,
    "nombre_usuario": "adminuser",
    "correo_electronico": "admin@example.com",
    "id_rol": 1,
    "nombre_rol": "administrador",
    "permisos": {
      "productos": ["crear", "editar", "eliminar", "ver"],
      "categorias": ["crear", "editar", "eliminar", "ver"],
      ...
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Token JWT Incluye Información del Rol

El token JWT ahora contiene:
```javascript
{
  id_usuario: 1,
  id_rol: 1,
  nombre_rol: "administrador",
  iat: ...,
  exp: ...
}
```

---

## 🔒 Seguridad y Permisos

### Middleware de Autorización:

El middleware `isAdmin` verifica si el usuario tiene rol de administrador:

```javascript
// Proteger ruta solo para administradores
router.post('/productos', [verifyToken, isAdmin], productoController.create);
```

### Expandir con Más Middlewares:

Puedes crear middlewares adicionales para otros roles:

```javascript
// En auth.middleware.js
export const isVendedor = (req, res, next) => {
    if (req.nombre_rol === 'vendedor' || req.nombre_rol === 'administrador') {
        next();
        return;
    }
    return res.status(403).json({ 
        message: 'Se requiere rol de Vendedor o Administrador' 
    });
};

export const hasPermission = (recurso, accion) => {
    return async (req, res, next) => {
        const user = await getUserById(req.id_usuario);
        const rol = await getRolById(user.id_rol);
        
        if (rol.permisos[recurso]?.includes(accion)) {
            next();
            return;
        }
        
        return res.status(403).json({ 
            message: 'No tienes permisos para realizar esta acción' 
        });
    };
};
```

**Uso:**
```javascript
// Solo usuarios con permiso para crear productos
router.post('/productos', 
    [verifyToken, hasPermission('productos', 'crear')], 
    productoController.create
);
```

---

## 📊 Diagrama de Relaciones

```
┌─────────────────┐
│     Roles       │
├─────────────────┤
│ id_rol (PK)     │
│ nombre_rol      │
│ descripcion     │
│ permisos (JSON) │
│ activo          │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐
│    Usuarios     │
├─────────────────┤
│ id_usuario (PK) │
│ nombre_usuario  │
│ correo_...      │
│ contrasena      │
│ id_rol (FK)     │
│ activo          │
└─────────────────┘
```

---

## 🔄 Migración/Sincronización

### Opción 1: Sincronización Automática (Recomendada)

El servidor ya está configurado para sincronizar automáticamente:

```bash
npm start
```

Esto creará la tabla `Roles` y sus relaciones automáticamente.

### Opción 2: Script SQL Manual

```bash
psql -U postgres -d ecommerce_db -f src/script/completo.sql
```

---

## ✅ Checklist de Implementación

- ✅ Tabla Roles creada en la base de datos
- ✅ Modelo Rol creado con Sequelize
- ✅ Relación Rol-Usuario configurada
- ✅ 3 Roles por defecto insertados (admin, cliente, vendedor)
- ✅ Servicio de Roles implementado
- ✅ Controlador de Roles implementado
- ✅ Rutas de API de Roles creadas
- ✅ Controlador de Auth actualizado para trabajar con roles
- ✅ Middleware de autenticación actualizado
- ✅ Token JWT incluye información de rol
- ✅ Colección de Postman actualizada con endpoints de roles
- ✅ Documentación completa generada

---

## 🎯 Próximos Pasos Sugeridos

1. ✅ **Reiniciar el servidor** para sincronizar la nueva tabla
2. ✅ **Probar endpoints de roles** en Postman
3. ✅ **Registrar usuario administrador** para gestionar roles
4. ✅ **Crear roles personalizados** según necesidades
5. ✅ **Implementar validación de permisos** en cada endpoint
6. ✅ **Agregar auditoría** de cambios de roles

---

## 📝 Notas Importantes

- Los roles **no se pueden eliminar permanentemente** para mantener integridad referencial
- El rol **cliente** (id_rol: 2) es el rol por defecto para nuevos usuarios
- Los permisos son almacenados como **JSONB** para flexibilidad
- El campo `nombre_rol` es **único** para evitar duplicados
- La eliminación de usuarios con un rol está **restringida** (ON DELETE RESTRICT)

---

¡Sistema de roles implementado exitosamente! 🎉
