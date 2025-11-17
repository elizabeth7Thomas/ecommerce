# 🔄 AJUSTES NECESARIOS - Frontend vs Backend

**Fecha:** 17 de Noviembre de 2025  
**Estado:** ⚠️ REQUIERE CAMBIOS ANTES DE INTEGRACIÓN  
**Para:** Equipo Frontend

---

## 📌 RESUMEN EJECUTIVO

El backend ha sido actualizado para normalizar automáticamente los campos que envía el frontend. Sin embargo, el frontend debe hacer algunos **cambios menores** en los campos que envía para cada tipo de método de pago.

---

## ✅ LO QUE ESTÁ BIEN

- ✅ Estructura general del body es correcta
- ✅ `id_metodo_pago` está bien 
- ✅ `alias` está bien
- ✅ `es_predeterminado` está bien
- ✅ Validaciones frontend son apropiadas
- ✅ El flujo general es correcto

---

## 🔴 CAMBIOS REQUERIDOS POR TIPO DE MÉTODO

### 1️⃣ TARJETA DE CRÉDITO/DÉBITO

#### Cambios necesarios:

| Cambio | Detalles |
|--------|----------|
| **NO enviar número completo** | El backend NO guarda `numero_tarjeta` por seguridad |
| **Enviar solo últimos 4 dígitos** | Como `numero_tarjeta_ultimos_4: "9010"` |
| **NO enviar CVV** | Solo valida en frontend, no se envía al backend |
| **Convertir fecha** | De `"12/25"` a `"2025-12-31"` (formato YYYY-MM-DD) |
| **Remover `save_method`** | No es necesario, se guarda automáticamente |

#### Body ANTES (incorrecto):
```json
{
  "id_metodo_pago": 1,
  "alias": "Mi Visa Principal",
  "numero_tarjeta": "4532 1234 5678 9010",
  "nombre_titular": "Juan Perez García",
  "fecha_expiracion": "12/25",
  "cvv": "123",
  "tipo_tarjeta": "visa",
  "banco": "Banco Nacional",
  "es_predeterminado": false,
  "save_method": true
}
```

#### Body DESPUÉS (correcto):
```json
{
  "id_metodo_pago": 1,
  "alias": "Mi Visa Principal",
  "numero_tarjeta_ultimos_4": "9010",
  "nombre_titular": "Juan Perez García",
  "fecha_expiracion": "2025-12-31",
  "tipo_tarjeta": "visa",
  "banco": "Banco Nacional",
  "es_predeterminado": false
}
```

#### Código JavaScript sugerido:
```javascript
const crearBodyTarjeta = (formData) => {
  // 1. Validar en frontend
  const numeroLimpio = formData.numero_tarjeta.replace(/\s/g, '');
  const cvv = formData.cvv; // Validar aquí
  
  // 2. Extraer últimos 4 dígitos
  const ultimosCuatro = numeroLimpio.slice(-4);
  
  // 3. Convertir fecha
  const [mes, anio] = formData.fecha_expiracion.split('/');
  const fechaISO = `20${anio}-${mes}-01`;
  
  // 4. Construir body sin CVV ni número completo
  return {
    id_metodo_pago: formData.id_metodo_pago,
    alias: formData.alias,
    numero_tarjeta_ultimos_4: ultimosCuatro,
    nombre_titular: formData.nombre_titular,
    fecha_expiracion: fechaISO,
    tipo_tarjeta: formData.tipo_tarjeta,
    banco: formData.banco,
    es_predeterminado: formData.es_predeterminado
  };
};
```

---

### 2️⃣ BILLETERA DIGITAL (PAYPAL)

#### Cambios necesarios:

| Cambio | Detalles |
|--------|----------|
| **Renombrar campo** | `email_paypal` → `email_billetera` |

#### Body ANTES (incorrecto):
```json
{
  "id_metodo_pago": 2,
  "alias": "Mi PayPal",
  "email_paypal": "juan.perez@email.com",
  "es_predeterminado": false
}
```

#### Body DESPUÉS (correcto):
```json
{
  "id_metodo_pago": 2,
  "alias": "Mi PayPal",
  "email_billetera": "juan.perez@email.com",
  "es_predeterminado": false
}
```

#### Código JavaScript:
```javascript
const crearBodyPayPal = (formData) => {
  return {
    id_metodo_pago: formData.id_metodo_pago,
    alias: formData.alias,
    email_billetera: formData.email, // Cambio aquí
    es_predeterminado: formData.es_predeterminado
  };
};
```

---

### 3️⃣ TRANSFERENCIA BANCARIA

#### Cambios necesarios:

| Cambio | Detalles |
|--------|----------|
| **Renombrar campo** | `numero_transaccion` → `identificador_externo` |
| **Renombrar campo** | `banco_origen` → `banco` |
| **Renombrar campo** | `titular_cuenta` → `nombre_titular` |

#### Body ANTES (incorrecto):
```json
{
  "id_metodo_pago": 3,
  "alias": "Transferencia Banco Nacional",
  "numero_transaccion": "TRX20251117123456",
  "banco_origen": "Banco Nacional",
  "numero_cuenta": "1234567890",
  "titular_cuenta": "Juan Perez García",
  "es_predeterminado": false
}
```

#### Body DESPUÉS (correcto):
```json
{
  "id_metodo_pago": 3,
  "alias": "Transferencia Banco Nacional",
  "identificador_externo": "TRX20251117123456",
  "banco": "Banco Nacional",
  "numero_cuenta": "1234567890",
  "nombre_titular": "Juan Perez García",
  "es_predeterminado": false
}
```

#### Código JavaScript:
```javascript
const crearBodyTransferencia = (formData) => {
  return {
    id_metodo_pago: formData.id_metodo_pago,
    alias: formData.alias,
    identificador_externo: formData.numero_transaccion,
    banco: formData.banco_origen,
    numero_cuenta: formData.numero_cuenta,
    nombre_titular: formData.titular_cuenta,
    es_predeterminado: formData.es_predeterminado
  };
};
```

---

### 4️⃣ CRIPTOMONEDA (BITCOIN)

#### Cambios necesarios:

| Cambio | Detalles |
|--------|----------|
| **Renombrar campo** | `wallet_address` → `identificador_externo` |

#### Body ANTES (incorrecto):
```json
{
  "id_metodo_pago": 4,
  "alias": "Mi Bitcoin",
  "wallet_address": "1A1z7agoat4x4kKHZ7nv5pwQfxqRzN3jXx",
  "es_predeterminado": false
}
```

#### Body DESPUÉS (correcto):
```json
{
  "id_metodo_pago": 4,
  "alias": "Mi Bitcoin",
  "identificador_externo": "1A1z7agoat4x4kKHZ7nv5pwQfxqRzN3jXx",
  "es_predeterminado": false
}
```

#### Código JavaScript:
```javascript
const crearBodyCriptomoneda = (formData) => {
  return {
    id_metodo_pago: formData.id_metodo_pago,
    alias: formData.alias,
    identificador_externo: formData.wallet_address,
    es_predeterminado: formData.es_predeterminado
  };
};
```

---

### 5️⃣ EFECTIVO (CONTRA ENTREGA)

#### Cambios necesarios:

| Cambio | Detalles |
|--------|----------|
| **Renombrar campo** | `entrega` → `identificador_externo` |

#### Body ANTES (incorrecto):
```json
{
  "id_metodo_pago": 5,
  "alias": "Pago al Recibir",
  "entrega": "contra_entrega",
  "es_predeterminado": false
}
```

#### Body DESPUÉS (correcto):
```json
{
  "id_metodo_pago": 5,
  "alias": "Pago al Recibir",
  "identificador_externo": "contra_entrega",
  "es_predeterminado": false
}
```

#### Código JavaScript:
```javascript
const crearBodyEfectivo = (formData) => {
  return {
    id_metodo_pago: formData.id_metodo_pago,
    alias: formData.alias,
    identificador_externo: formData.entrega,
    es_predeterminado: formData.es_predeterminado
  };
};
```

---

## 📊 TABLA COMPARATIVA - CAMBIOS REQUERIDOS

| Tipo | Campo Original | Campo Backend | Cambio | Prioridad |
|------|---|---|---|---|
| **Tarjeta** | `numero_tarjeta` | `numero_tarjeta_ultimos_4` | Extraer últimos 4 | 🔴 CRÍTICO |
| **Tarjeta** | `cvv` | *(no enviar)* | Eliminar | 🔴 CRÍTICO |
| **Tarjeta** | `fecha_expiracion: "12/25"` | `fecha_expiracion: "2025-12-31"` | Convertir formato | 🔴 CRÍTICO |
| **Tarjeta** | `save_method` | *(no enviar)* | Eliminar | 🟡 OPCIONAL |
| **PayPal** | `email_paypal` | `email_billetera` | Renombrar | 🔴 CRÍTICO |
| **Transf.** | `numero_transaccion` | `identificador_externo` | Renombrar | 🔴 CRÍTICO |
| **Transf.** | `banco_origen` | `banco` | Renombrar | 🔴 CRÍTICO |
| **Transf.** | `titular_cuenta` | `nombre_titular` | Renombrar | 🔴 CRÍTICO |
| **Bitcoin** | `wallet_address` | `identificador_externo` | Renombrar | 🔴 CRÍTICO |
| **Efectivo** | `entrega` | `identificador_externo` | Renombrar | 🔴 CRÍTICO |

---

## 🔐 NOTAS DE SEGURIDAD

### ¿Por qué no enviamos el número de tarjeta completo?
- **NUNCA** guardes el CVV en el servidor (regulación PCI-DSS)
- **NUNCA** guardes el número completo de la tarjeta sin encripción
- El backend solo guarda los **últimos 4 dígitos** para visualización
- El **número completo se valida en frontend** y se descarta

### ¿Qué validaciones hace el frontend?
✅ Validar número de tarjeta (Luhn algorithm)  
✅ Validar fecha no esté expirada  
✅ Validar CVV (3-4 dígitos)  
✅ Validar formato de email  
✅ Validar dirección Bitcoin válida  

### ¿Qué validaciones hace el backend?
✅ Verificar campos requeridos  
✅ Verificar que el cliente existe  
✅ Verificar que el método de pago existe y está activo  
✅ Verificar que no es duplicado  
✅ Encriptar datos sensibles antes de guardar  

---

## 🚀 RESPUESTA DEL BACKEND

Todos los endpoints ahora retornan:

```json
{
  "success": true,
  "message": "Método de pago guardado exitosamente",
  "data": {
    "id_metodo_pago_cliente": 5,
    "id_metodo_pago": 1,
    "id_cliente": 4,
    "alias": "Mi Visa Principal",
    "numero_tarjeta_ultimos_4": "9010",
    "nombre_titular": "Juan Perez García",
    "fecha_expiracion": "2025-12-31",
    "tipo_tarjeta": "visa",
    "banco": "Banco Nacional",
    "verificado": false,
    "es_predeterminado": false,
    "creado_en": "2025-11-17T12:30:00.000Z"
  }
}
```

**Importante:** El `id_metodo_pago_cliente` en la respuesta es lo que necesitas para:
- Seleccionar este método en el Checkout
- Usar en GET/PUT/DELETE de métodos específicos
- Guardar en estado local del cliente

---

## 🔄 FLUJO ACTUALIZADO

```
1. Usuario llena formulario
     ↓
2. Frontend VALIDA (número, fecha, email, etc.)
     ↓
3. Frontend CONSTRUYE body con campos renombrados
     ↓
4. POST /metodos-pago-cliente con body normalizado
     ↓
5. Backend RECIBE y NORMALIZA automáticamente
     ↓
6. Backend VALIDA (cliente existe, método existe, etc.)
     ↓
7. Backend GUARDA (encriptado, sin CVV, solo últimos 4 dígitos)
     ↓
8. Response con id_metodo_pago_cliente
     ↓
9. Frontend USA este ID para operaciones posteriores
```

---

## ✨ LO QUE MEJORÓ EN EL BACKEND

✅ **Normalización automática:** El backend ahora mapea automáticamente campos del frontend  
✅ **Flexibilidad:** Puedes enviar campos con nombres originales o ya normalizados  
✅ **Seguridad mejorada:** Validaciones más estrictas  
✅ **Mejor logging:** Errores más específicos

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo enviar los campos con nombres originales?
**SÍ.** El backend automaticamente normaliza campos como `email_paypal`, `wallet_address`, etc.

### ¿El backend guarda el número de tarjeta?
**NO.** Solo guarda los últimos 4 dígitos para visualización.

### ¿Dónde se valida el CVV?
**SOLO EN FRONTEND.** El CVV nunca debe ser enviado al servidor.

### ¿Qué pasa si envío un campo incorrecto?
El backend lo ignora automáticamente (no causa error).

### ¿Puedo crear múltiples métodos de pago?
**SÍ.** Un cliente puede tener múltiples métodos. Solo uno puede ser predeterminado.

### ¿Cómo sé cuál es mi método predeterminado?
GET `/api/metodos-pago-cliente/predeterminado` retorna el método actual.

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Actualizar método para crear tarjeta (extraer últimos 4 dígitos)
- [ ] Cambiar formato de fecha a YYYY-MM-DD
- [ ] Renombrar `email_paypal` → `email_billetera`
- [ ] Renombrar `numero_transaccion` → `identificador_externo`
- [ ] Renombrar `banco_origen` → `banco`
- [ ] Renombrar `titular_cuenta` → `nombre_titular`
- [ ] Renombrar `wallet_address` → `identificador_externo`
- [ ] Renombrar `entrega` → `identificador_externo`
- [ ] Remover campo `save_method`
- [ ] Remover campo `cvv` del body (mantener validación en frontend)
- [ ] Remover campo `numero_tarjeta` del body
- [ ] Guardar `id_metodo_pago_cliente` de la respuesta para operaciones posteriores
- [ ] Probar flujo completo con todos los tipos de métodos
- [ ] Validar respuestas 201 vs errores 400/409/422

---

## 🔧 SOPORTE

Si encontras errores:
- **400 VALIDACION_ERROR:** Verifica que todos los campos requeridos están presentes
- **401 NO_AUTENTICADO:** Verifica que el token es válido (Bearer token en Authorization header)
- **403 ACCESO_DENEGADO:** Intentaste guardar un método para otro cliente
- **409 DUPLICADO:** El método ya está guardado (mismo número de tarjeta/email)
- **422 DATOS_INVALIDOS:** Los datos no pasaron validación (número inválido, etc.)

---

**Última actualización:** 17 de Noviembre de 2025  
**Versión:** 1.0  
**Estado:** Listo para implementar en Frontend
