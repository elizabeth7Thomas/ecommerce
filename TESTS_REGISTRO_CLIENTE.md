# 🧪 Prueba: Registro con Cliente Automático

## Opción 1: cURL

```bash
# REGISTRO - Crear usuario + cliente automáticamente
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "juan_perez",
    "correo_electronico": "juan@example.com",
    "contrasena": "JuanPass123!",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+502 1234-5678"
  }'
```

**Respuesta esperada:**
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

## Opción 2: Postman

### Paso 1: Crear nueva solicitud
1. Click en **"+"** para nueva tab
2. Seleccionar **POST**
3. URL: `http://localhost:3000/api/auth/register`

### Paso 2: Headers
```
Content-Type: application/json
```

### Paso 3: Body (raw JSON)
```json
{
  "nombre_usuario": "maria_garcia",
  "correo_electronico": "maria@example.com",
  "contrasena": "MariaPass123!",
  "nombre": "María",
  "apellido": "García",
  "telefono": "+502 9876-5432"
}
```

### Paso 4: Click en "Send"

**Respuesta:**
```json
{
  "status": "created",
  "message": "Usuario y cliente creados exitosamente",
  "data": {
    "id_usuario": 6,
    "nombre_usuario": "maria_garcia",
    "correo_electronico": "maria@example.com",
    "id_rol": 2,
    "nombre_rol": "cliente",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjo2LCJpZF9yb2wiOjIsIm5vbWJyZV9yb2wiOiJjbGllbnRlIiwiaWF0IjoxNjk5NTQwODAwLCJleHAiOjE2OTk2MjcyMDB9...",
    "cliente": {
      "id_cliente": 4,
      "id_usuario": 6,
      "nombre": "María",
      "apellido": "García",
      "telefono": "+502 9876-5432"
    }
  }
}
```

---

## Opción 3: JavaScript/Fetch (Frontend)

```javascript
// registro.js
async function registroClienteAutomatico() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre_usuario: 'carlos_lopez',
        correo_electronico: 'carlos@example.com',
        contrasena: 'CarlosPass123!',
        nombre: 'Carlos',
        apellido: 'López',
        telefono: '+502 5555-5555'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Registro exitoso');
      console.log('ID Usuario:', result.data.id_usuario);
      console.log('ID Cliente:', result.data.cliente.id_cliente);
      console.log('Token:', result.data.token);
      
      // Guardar token en localStorage
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('id_usuario', result.data.id_usuario);
      localStorage.setItem('id_cliente', result.data.cliente.id_cliente);
      
      // Redirigir a dashboard
      window.location.href = '/dashboard';
    } else {
      console.error('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('Error en solicitud:', error);
  }
}

// Llamar en el formulario de registro
document.getElementById('formRegistro').addEventListener('submit', (e) => {
  e.preventDefault();
  registroClienteAutomatico();
});
```

---

## ✅ Casos de Prueba

### Test 1: Registro básico exitoso
**Input:**
```json
{
  "nombre_usuario": "test_user",
  "correo_electronico": "test@example.com",
  "contrasena": "TestPass123!"
}
```

**Expected:**
- ✅ Status 201
- ✅ Usuario creado
- ✅ Cliente creado (aunque sin nombre/apellido)
- ✅ Token válido

---

### Test 2: Registro con todos los datos
**Input:**
```json
{
  "nombre_usuario": "pepe_gomez",
  "correo_electronico": "pepe@example.com",
  "contrasena": "PepePass123!",
  "nombre": "José",
  "apellido": "Gómez",
  "telefono": "+502 7777-7777"
}
```

**Expected:**
- ✅ Status 201
- ✅ Cliente creado con todos los datos
- ✅ Token con id_usuario y id_rol = 2

---

### Test 3: Email duplicado
**Input:**
```json
{
  "nombre_usuario": "otro_usuario",
  "correo_electronico": "juan@example.com",  // Ya existe
  "contrasena": "OtroPass123!"
}
```

**Expected:**
- ❌ Status 400
- ❌ Message: "Correo electrónico ya existe"
- ❌ Usuario NO creado
- ❌ Cliente NO creado

---

### Test 4: Contraseña débil
**Input:**
```json
{
  "nombre_usuario": "test_weak",
  "correo_electronico": "weak@example.com",
  "contrasena": "123"  // Muy corta
}
```

**Expected:**
- ❌ Status 400
- ❌ Message con validación de contraseña
- ❌ Usuario NO creado

---

### Test 5: Registrar como Admin (id_rol = 1)
**Input:**
```json
{
  "nombre_usuario": "new_admin",
  "correo_electronico": "admin@example.com",
  "contrasena": "AdminPass123!",
  "id_rol": 1
}
```

**Expected:**
- ✅ Status 201
- ✅ Usuario creado con id_rol = 1
- ❌ Cliente NO creado (porque no es cliente)
- ✅ Token válido

---

## 🔍 Verificar Cliente Creado

Después del registro, puedes verificar:

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo_electronico": "juan@example.com",
    "contrasena": "JuanPass123!"
  }'

# Obtienes el token...

# 2. Obtener perfil del cliente
curl -X GET http://localhost:3000/api/clientes/perfil \
  -H "Authorization: Bearer {token}"

# Resultado:
{
  "status": "success",
  "data": {
    "id_cliente": 3,
    "id_usuario": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+502 1234-5678"
  }
}
```

---

## 📋 Checklist de Verificación

- [ ] El usuario se crea correctamente
- [ ] El cliente se crea automáticamente
- [ ] El token se retorna
- [ ] El id_usuario coincide entre usuario y cliente
- [ ] El cliente tiene los datos ingresados
- [ ] Si falla cliente, se revierte el usuario
- [ ] Administradores se pueden registrar sin cliente
- [ ] Email duplicado falla correctamente
- [ ] Token es válido para las próximas solicitudes

---

**¡Lista la implementación! 🚀**
