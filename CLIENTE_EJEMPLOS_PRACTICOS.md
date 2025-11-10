# Cliente Endpoints - Ejemplos Prácticos

## 📌 Configuración Base

**Base URL**: `http://localhost:3000/api/clientes`

**Headers Comunes**:
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔑 Tipos de Tokens Necesarios

### 1. Usuario Común
```
Token generado en POST /api/auth/login con credenciales de usuario
Rol: usuario
Permisos: Ver/editar su propio perfil
```

### 2. Administrador
```
Token generado en POST /api/auth/login con credenciales de admin
Rol: admin
Permisos: Acceso completo a gestión de clientes
```

---

## 📋 Ejemplos Completos por Endpoint

### 1️⃣ AUTO-REGISTRO: Usuario crea su perfil

**Endpoint**: `POST /api/clientes`

**Escenario**: Un usuario recién registrado quiere crear su perfil de cliente

**cURL**:
```bash
curl -X POST http://localhost:3000/api/clientes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjo1LCJyb2wiOiJ1c3VhcmlvIn0.xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "+502 7777-7777",
    "fecha_nacimiento": "1990-05-15",
    "genero": "M",
    "empresa": "Tech Solutions S.A.",
    "documento_identidad": "1234567-8"
  }'
```

**JavaScript (Fetch)**:
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/clientes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '+502 7777-7777',
    fecha_nacimiento: '1990-05-15',
    genero: 'M',
    empresa: 'Tech Solutions S.A.',
    documento_identidad: '1234567-8'
  })
});

const data = await response.json();
console.log(data);
```

**Postman**:
```
Method: POST
URL: http://localhost:3000/api/clientes
Auth Tab: Bearer Token → paste token
Body (raw JSON):
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "+502 7777-7777",
  "fecha_nacimiento": "1990-05-15",
  "genero": "M",
  "empresa": "Tech Solutions S.A.",
  "documento_identidad": "1234567-8"
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "id_cliente": 1,
    "id_usuario": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+502 7777-7777",
    "fecha_nacimiento": "1990-05-15",
    "genero": "M",
    "empresa": "Tech Solutions S.A.",
    "documento_identidad": "1234567-8",
    "estado_cliente": "activo",
    "fecha_registro": "2024-01-15T10:30:00Z"
  }
}
```

**Respuesta Error - Usuario ya tiene perfil (409)**:
```json
{
  "success": false,
  "error": "El usuario ya tiene un perfil de cliente"
}
```

---

### 2️⃣ ADMIN CREATION: Admin crea cliente para usuario ⭐ NUEVO

**Endpoint**: `POST /api/clientes/admin/crear`

**Escenario**: El administrador necesita crear un perfil de cliente para un usuario que ya existe en el sistema

**cURL**:
```bash
curl -X POST http://localhost:3000/api/clientes/admin/crear \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJyb2wiOiJhZG1pbiJ9.xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": 12,
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "email": "carlos@example.com",
    "telefono": "+502 8888-8888",
    "fecha_nacimiento": "1985-03-20",
    "genero": "M",
    "empresa": "Distribuidora ABC",
    "documento_identidad": "9876543-2"
  }'
```

**JavaScript (Fetch)**:
```javascript
const adminToken = localStorage.getItem('adminToken');

const response = await fetch('http://localhost:3000/api/clientes/admin/crear', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id_usuario: 12,
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'carlos@example.com',
    telefono: '+502 8888-8888',
    fecha_nacimiento: '1985-03-20',
    genero: 'M',
    empresa: 'Distribuidora ABC',
    documento_identidad: '9876543-2'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Cliente creado:', data.data);
} else {
  console.error('Error:', data.error);
}
```

**Postman**:
```
Method: POST
URL: http://localhost:3000/api/clientes/admin/crear
Auth Tab: Bearer Token → paste admin token
Body (raw JSON):
{
  "id_usuario": 12,
  "nombre": "Carlos",
  "apellido": "Rodríguez",
  "email": "carlos@example.com",
  "telefono": "+502 8888-8888",
  "fecha_nacimiento": "1985-03-20",
  "genero": "M",
  "empresa": "Distribuidora ABC",
  "documento_identidad": "9876543-2"
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Cliente creado por admin exitosamente",
  "data": {
    "id_cliente": 2,
    "id_usuario": 12,
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "telefono": "+502 8888-8888",
    "fecha_nacimiento": "1985-03-20",
    "genero": "M",
    "empresa": "Distribuidora ABC",
    "documento_identidad": "9876543-2",
    "estado_cliente": "activo",
    "fecha_registro": "2024-01-15T11:45:00Z"
  }
}
```

**Respuesta Error - Usuario no autorizado (403)**:
```json
{
  "success": false,
  "error": "Solo administradores pueden crear clientes"
}
```

**Respuesta Error - Falta id_usuario (400)**:
```json
{
  "success": false,
  "error": "El id_usuario es requerido"
}
```

---

### 3️⃣ VER MI PERFIL: Usuario ve su perfil

**Endpoint**: `GET /api/clientes/perfil`

**cURL**:
```bash
curl -X GET http://localhost:3000/api/clientes/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjo1LCJyb2wiOiJ1c3VhcmlvIn0.xxx"
```

**JavaScript (Fetch)**:
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/clientes/perfil', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data); // Datos del perfil
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id_cliente": 1,
    "id_usuario": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+502 7777-7777",
    "fecha_nacimiento": "1990-05-15",
    "genero": "M",
    "empresa": "Tech Solutions S.A.",
    "documento_identidad": "1234567-8",
    "estado_cliente": "activo",
    "usuario": {
      "id_usuario": 5,
      "nombre_usuario": "jperez",
      "correo_electronico": "juan@example.com",
      "estado_usuario": "activo"
    }
  }
}
```

---

### 4️⃣ ACTUALIZAR MI PERFIL

**Endpoint**: `PUT /api/clientes/perfil`

**cURL**:
```bash
curl -X PUT http://localhost:3000/api/clientes/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjo1LCJyb2wiOiJ1c3VhcmlvIn0.xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Carlos",
    "apellido": "Pérez López",
    "telefono": "+502 9999-9999",
    "empresa": "New Company S.A."
  }'
```

**JavaScript (Fetch)**:
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/clientes/perfil', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Juan Carlos',
    apellido: 'Pérez López',
    telefono: '+502 9999-9999',
    empresa: 'New Company S.A.'
  })
});

const data = await response.json();
console.log(data.message); // "Perfil actualizado exitosamente"
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "id_cliente": 1,
    "nombre": "Juan Carlos",
    "apellido": "Pérez López",
    "telefono": "+502 9999-9999",
    "empresa": "New Company S.A."
  }
}
```

---

### 5️⃣ ELIMINAR MI PERFIL

**Endpoint**: `DELETE /api/clientes/perfil`

**Advertencia**: Esta acción no se puede deshacer

**cURL**:
```bash
curl -X DELETE http://localhost:3000/api/clientes/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjo1LCJyb2wiOiJ1c1VhcmlvIn0.xxx"
```

**JavaScript (Fetch)**:
```javascript
const token = localStorage.getItem('authToken');

if (confirm('¿Estás seguro de que deseas eliminar tu perfil?')) {
  const response = await fetch('http://localhost:3000/api/clientes/perfil', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.success) {
    console.log('Perfil eliminado');
    // Redirigir a login
  }
}
```

---

### 6️⃣ LISTAR TODOS LOS CLIENTES (Admin)

**Endpoint**: `GET /api/clientes`

**Parámetros**:
- `page`: número de página (default: 1)
- `limit`: registros por página (default: 10)
- `search`: búsqueda por nombre, apellido o email

**cURL**:
```bash
# Página 1, 10 resultados
curl -X GET 'http://localhost:3000/api/clientes?page=1&limit=10' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Con búsqueda
curl -X GET 'http://localhost:3000/api/clientes?page=1&limit=10&search=Juan' \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**JavaScript (Fetch)**:
```javascript
const adminToken = localStorage.getItem('adminToken');

const params = new URLSearchParams({
  page: 1,
  limit: 10,
  search: 'Juan'
});

const response = await fetch(
  `http://localhost:3000/api/clientes?${params.toString()}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
console.log(`Total clientes: ${data.total}`);
console.log(data.data); // Array de clientes
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id_cliente": 1,
      "id_usuario": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "telefono": "+502 7777-7777",
      "empresa": "Tech Solutions",
      "estado_cliente": "activo"
    },
    {
      "id_cliente": 2,
      "id_usuario": 12,
      "nombre": "Carlos",
      "apellido": "Rodríguez",
      "telefono": "+502 8888-8888",
      "empresa": "Distribuidora ABC",
      "estado_cliente": "activo"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 7️⃣ BUSCAR CLIENTES (Admin)

**Endpoint**: `GET /api/clientes/buscar`

**Parámetros**:
- `nombre`: buscar por nombre
- `email`: buscar por correo
- `telefono`: buscar por teléfono

**cURL**:
```bash
# Buscar por nombre
curl -X GET 'http://localhost:3000/api/clientes/buscar?nombre=Juan' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Buscar por email
curl -X GET 'http://localhost:3000/api/clientes/buscar?email=juan@example.com' \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Buscar por teléfono
curl -X GET 'http://localhost:3000/api/clientes/buscar?telefono=%2B502%207777-7777' \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**JavaScript (Fetch)**:
```javascript
const adminToken = localStorage.getItem('adminToken');

const params = new URLSearchParams({
  nombre: 'Juan'
});

const response = await fetch(
  `http://localhost:3000/api/clientes/buscar?${params.toString()}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
console.log(data.data); // Resultados de búsqueda
```

---

### 8️⃣ VER CLIENTE ESPECÍFICO (Admin)

**Endpoint**: `GET /api/clientes/{id}`

**cURL**:
```bash
curl -X GET 'http://localhost:3000/api/clientes/1' \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**JavaScript (Fetch)**:
```javascript
const adminToken = localStorage.getItem('adminToken');
const clienteId = 1;

const response = await fetch(
  `http://localhost:3000/api/clientes/${clienteId}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
console.log(data.data);
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "id_cliente": 1,
    "id_usuario": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+502 7777-7777",
    "fecha_nacimiento": "1990-05-15",
    "genero": "M",
    "empresa": "Tech Solutions",
    "documento_identidad": "1234567-8",
    "estado_cliente": "activo",
    "usuario": {
      "id_usuario": 5,
      "nombre_usuario": "jperez",
      "correo_electronico": "juan@example.com",
      "estado_usuario": "activo"
    }
  }
}
```

---

### 9️⃣ ACTUALIZAR CLIENTE (Admin o propietario)

**Endpoint**: `PUT /api/clientes/{id}`

**cURL**:
```bash
curl -X PUT 'http://localhost:3000/api/clientes/1' \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Carlos",
    "empresa": "New Company",
    "telefono": "+502 9999-0000"
  }'
```

**JavaScript (Fetch)**:
```javascript
const token = localStorage.getItem('authToken');
const clienteId = 1;

const response = await fetch(
  `http://localhost:3000/api/clientes/${clienteId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombre: 'Juan Carlos',
      empresa: 'New Company',
      telefono: '+502 9999-0000'
    })
  }
);

const data = await response.json();
console.log(data.message); // "Cliente actualizado exitosamente"
```

---

### 🔟 ELIMINAR CLIENTE (Admin)

**Endpoint**: `DELETE /api/clientes/{id}`

**Advertencia**: Solo administradores, acción no reversible

**cURL**:
```bash
curl -X DELETE 'http://localhost:3000/api/clientes/1' \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**JavaScript (Fetch)**:
```javascript
const adminToken = localStorage.getItem('adminToken');
const clienteId = 1;

if (confirm(`¿Eliminar cliente ${clienteId}?`)) {
  const response = await fetch(
    `http://localhost:3000/api/clientes/${clienteId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );

  const data = await response.json();
  if (data.success) {
    console.log('Cliente eliminado');
  }
}
```

---

## 🧪 Ejemplo Completo: Flujo de Registro

```javascript
// 1. Usuario se registra en el sistema
async function registrarUsuario() {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre_usuario: 'jperez',
      correo_electronico: 'juan@example.com',
      contrasena: 'password123'
    })
  });
  return await response.json();
}

// 2. Usuario inicia sesión
async function iniciarSesion() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo_electronico: 'juan@example.com',
      contrasena: 'password123'
    })
  });
  const data = await response.json();
  localStorage.setItem('authToken', data.data.token);
  return data;
}

// 3. Usuario crea su perfil de cliente
async function crearPerfilCliente() {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:3000/api/clientes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      telefono: '+502 7777-7777',
      fecha_nacimiento: '1990-05-15',
      genero: 'M'
    })
  });
  return await response.json();
}

// 4. Ejecutar flujo
async function flujoCompleto() {
  try {
    console.log('1. Registrando usuario...');
    const registro = await registrarUsuario();
    
    console.log('2. Iniciando sesión...');
    await iniciarSesion();
    
    console.log('3. Creando perfil de cliente...');
    const cliente = await crearPerfilCliente();
    
    console.log('✅ ¡Usuario y cliente creados exitosamente!');
    console.log(cliente.data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

flujoCompleto();
```

---

## 🛡️ Validaciones de Seguridad

Todas las solicitudes deben incluir:

1. **JWT válido** en header `Authorization: Bearer TOKEN`
2. **Header** `Content-Type: application/json` para POST/PUT
3. **Token de admin** para endpoints administrativos
4. **ID válido** en parámetros de ruta

Intentar acceder sin autenticación devuelve:
```json
{
  "success": false,
  "error": "No autorizado"
}
```

Intentar acceder sin permisos suficientes devuelve:
```json
{
  "success": false,
  "error": "Solo administradores pueden realizar esta acción"
}
```

