# 🚀 INICIO RÁPIDO - Sistema de Roles

## ✅ ESTADO ACTUAL

```
✅ Tabla Roles creada en la BD
✅ Relación Usuario → Rol configurada
✅ 4 Roles por defecto insertados:
   • ID 1: administrador
   • ID 2: cliente (por defecto)
   • ID 3: vendedor
   • ID 4: moderador
✅ API lista para usar
✅ Colección Postman actualizada
```

---

## 🎯 LO QUE NECESITAS SABER

### Tu Pregunta Original:
> "para crear un admin como sería?"

### Respuesta Simple:

**Para crear un USUARIO administrador:**
```json
POST http://localhost:3000/api/auth/register

{
  "nombre_usuario": "admin",
  "correo_electronico": "admin@ecommerce.com",
  "contrasena": "Admin123!",
  "id_rol": 1
}
```

**El JSON que mostraste crea un ROL (no un usuario):**
```json
POST http://localhost:3000/api/roles

{
  "nombre_rol": "vendedor",
  "descripcion": "Usuario con permisos de gestión",
  "permisos": {...}
}
```

---

## 📝 CREAR USUARIOS - COPIAR Y PEGAR

### 1. Administrador
```json
{
  "nombre_usuario": "admin",
  "correo_electronico": "admin@ecommerce.com",
  "contrasena": "Admin123!",
  "id_rol": 1
}
```

### 2. Cliente
```json
{
  "nombre_usuario": "cliente1",
  "correo_electronico": "cliente@example.com",
  "contrasena": "Cliente123!",
  "id_rol": 2
}
```

O simplemente:
```json
{
  "nombre_usuario": "cliente1",
  "correo_electronico": "cliente@example.com",
  "contrasena": "Cliente123!"
}
```
👆 Sin `id_rol` = automáticamente cliente

### 3. Vendedor
```json
{
  "nombre_usuario": "vendedor1",
  "correo_electronico": "vendedor@example.com",
  "contrasena": "Vendedor123!",
  "id_rol": 3
}
```

### 4. Moderador
```json
{
  "nombre_usuario": "moderador1",
  "correo_electronico": "moderador@example.com",
  "contrasena": "Moderador123!",
  "id_rol": 4
}
```

---

## 🔑 IDs de Roles

| ID | Rol | Descripción |
|----|-----|-------------|
| 1 | administrador | Acceso total |
| 2 | cliente | Usuario normal (por defecto) |
| 3 | vendedor | Gestiona productos |
| 4 | moderador | Modera contenido |

---

## 📚 MÁS INFORMACIÓN

- 📖 **GUIA_ROLES_USUARIOS.md** - Guía completa
- 📖 **EJEMPLOS_RAPIDOS.md** - Ejemplos para copiar
- 📖 **SISTEMA_ROLES.md** - Documentación técnica detallada

---

## ⚡ SIGUIENTE PASO

1. Abre Postman
2. Usa la colección actualizada
3. Crea tu primer admin con el JSON de arriba
4. ¡Listo!

🎉 **¡Todo configurado y funcionando!**
