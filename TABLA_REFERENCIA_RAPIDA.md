# 📋 TABLA DE REFERENCIA RÁPIDA - Frontend vs Backend

**Para:** Consulta rápida mientras implementas  
**Última actualización:** 17 de Noviembre de 2025

---

## ✅ ESTADO GENERAL

| Aspecto | Estado | Notas |
|--------|--------|-------|
| **Backend** | ✅ 100% Listo | Normalización automática implementada |
| **Frontend - Tarjeta** | ⚠️ Requiere cambios | Crítico por seguridad |
| **Frontend - PayPal** | ⚠️ Requiere cambios | Simple renombrado |
| **Frontend - Transferencia** | ⚠️ Requiere cambios | 3 campos a renombrar |
| **Frontend - Bitcoin** | ⚠️ Requiere cambios | Simple renombrado |
| **Frontend - Efectivo** | ⚠️ Requiere cambios | Simple renombrado |
| **Testing** | 🔴 Pendiente | Verificar todos los tipos |
| **Documentación** | ✅ Completa | 3 archivos creados |

---

## 🔄 MAPEO DE CAMPOS POR TIPO

### 💳 TARJETA DE CRÉDITO/DÉBITO

```
FRONTEND ENVÍA              BACKEND ESPERA              ACCIÓN
─────────────────────────────────────────────────────────────
numero_tarjeta              numero_tarjeta_ultimos_4    Extraer últimos 4
"4532 1234 5678 9010"       "9010"                      dígitos
                                                        
fecha_expiracion            fecha_expiracion            Convertir formato
"12/25"                     "2025-12-31"                MM/YY → YYYY-MM-DD
                                                        
cvv                         *(no enviar)*               Eliminar del body
"123"                                                   (validar en frontend)

nombre_titular              nombre_titular              ✓ Sin cambios
"Juan Perez García"         "Juan Perez García"         

tipo_tarjeta                tipo_tarjeta                ✓ Sin cambios
"visa"                      "visa"                      

banco                       banco                       ✓ Sin cambios
"Banco Nacional"            "Banco Nacional"            

alias                       alias                       ✓ Sin cambios
"Mi Visa"                   "Mi Visa"                   

es_predeterminado           es_predeterminado           ✓ Sin cambios
false                       false                       

save_method                 *(no enviar)*               Eliminar del body
true                                                    (no es necesario)
```

---

### 💰 BILLETERA DIGITAL (PAYPAL)

```
FRONTEND ENVÍA              BACKEND ESPERA              ACCIÓN
─────────────────────────────────────────────────────────────
id_metodo_pago              id_metodo_pago              ✓ Sin cambios
2                           2                           

alias                       alias                       ✓ Sin cambios
"Mi PayPal"                 "Mi PayPal"                 

email_paypal                email_billetera             Renombrar campo
"juan.perez@email.com"      "juan.perez@email.com"      

es_predeterminado           es_predeterminado           ✓ Sin cambios
false                       false                       
```

---

### 🏦 TRANSFERENCIA BANCARIA

```
FRONTEND ENVÍA              BACKEND ESPERA              ACCIÓN
─────────────────────────────────────────────────────────────
id_metodo_pago              id_metodo_pago              ✓ Sin cambios
3                           3                           

alias                       alias                       ✓ Sin cambios
"Transferencia BN"          "Transferencia BN"          

numero_transaccion          identificador_externo       Renombrar
"TRX20251117123456"         "TRX20251117123456"         

banco_origen                banco                       Renombrar
"Banco Nacional"            "Banco Nacional"            

numero_cuenta               numero_cuenta               ✓ Sin cambios
"1234567890"                "1234567890"                

titular_cuenta              nombre_titular              Renombrar
"Juan Perez García"         "Juan Perez García"         

es_predeterminado           es_predeterminado           ✓ Sin cambios
false                       false                       
```

---

### 🪙 CRIPTOMONEDA (BITCOIN)

```
FRONTEND ENVÍA              BACKEND ESPERA              ACCIÓN
─────────────────────────────────────────────────────────────
id_metodo_pago              id_metodo_pago              ✓ Sin cambios
4                           4                           

alias                       alias                       ✓ Sin cambios
"Mi Bitcoin"                "Mi Bitcoin"                

wallet_address              identificador_externo       Renombrar
"1A1z7agoat..."             "1A1z7agoat..."             

es_predeterminado           es_predeterminado           ✓ Sin cambios
false                       false                       
```

---

### 💸 EFECTIVO (CONTRA ENTREGA)

```
FRONTEND ENVÍA              BACKEND ESPERA              ACCIÓN
─────────────────────────────────────────────────────────────
id_metodo_pago              id_metodo_pago              ✓ Sin cambios
5                           5                           

alias                       alias                       ✓ Sin cambios
"Pago al Recibir"           "Pago al Recibir"           

entrega                     identificador_externo       Renombrar
"contra_entrega"            "contra_entrega"            

es_predeterminado           es_predeterminado           ✓ Sin cambios
false                       false                       
```

---

## 📊 TABLA COMPARATIVA COMPLETA

| Campo | Tarjeta | PayPal | Transfer. | Bitcoin | Efectivo | Acción |
|-------|---------|--------|-----------|---------|----------|--------|
| `id_metodo_pago` | ✓ | ✓ | ✓ | ✓ | ✓ | Sin cambios |
| `alias` | ✓ | ✓ | ✓ | ✓ | ✓ | Sin cambios |
| `numero_tarjeta` | ❌ | ✗ | ✗ | ✗ | ✗ | **Eliminar** |
| `numero_tarjeta_ultimos_4` | ✅ | ✗ | ✗ | ✗ | ✗ | **Agregar** (tarjeta) |
| `nombre_titular` | ✓ | ✗ | ← cambiar | ✗ | ✗ | Sin cambios (tarjeta) |
| `fecha_expiracion` | → cambiar | ✗ | ✗ | ✗ | ✗ | **Formato fecha** |
| `cvv` | ❌ | ✗ | ✗ | ✗ | ✗ | **Eliminar** |
| `tipo_tarjeta` | ✓ | ✗ | ✗ | ✗ | ✗ | Sin cambios |
| `banco` | ✓ | ✗ | ← cambiar | ✗ | ✗ | Sin cambios (tarjeta) |
| `email_billetera` | ✗ | ← cambiar | ✗ | ✗ | ✗ | **Renombrar** (PayPal) |
| `identificador_externo` | ✗ | ✗ | ← cambiar | ← cambiar | ← cambiar | **Renombrar** (otros) |
| `numero_cuenta` | ✗ | ✗ | ✓ | ✗ | ✗ | Sin cambios |
| `es_predeterminado` | ✓ | ✓ | ✓ | ✓ | ✓ | Sin cambios |
| `save_method` | ❌ | ✗ | ✗ | ✗ | ✗ | **Eliminar** |

**Leyenda:**
- ✓ = Enviar sin cambios
- ← cambiar = Renombrar
- → cambiar = Convertir formato
- ✗ = No aplica a este tipo
- ❌ = Eliminar del body
- ✅ = Agregar nuevo

---

## 🔴 CAMBIOS CRÍTICOS (Prioridad 1)

### Tarjeta - Número de tarjeta

```javascript
// ❌ NUNCA HACER
numero_tarjeta: "4532 1234 5678 9010"

// ✅ HACER
numero_tarjeta_ultimos_4: numeroCompleto.slice(-4) // "9010"
```

**Por qué:**
- PCI-DSS compliance (regulación de tarjetas)
- Seguridad de datos
- Mejor práctica de la industria

---

### Tarjeta - Fecha

```javascript
// ❌ NUNCA HACER
fecha_expiracion: "12/25"

// ✅ HACER
fecha_expiracion: "2025-12-31" // YYYY-MM-DD
```

**Conversión:**
```javascript
const [mes, anio] = "12/25".split('/');
const fecha = `20${anio}-${mes}-01`;
```

---

### Tarjeta - CVV

```javascript
// ❌ NUNCA HACER
cvv: "123" // en el body enviado al servidor

// ✅ HACER
// Validar en frontend, NO incluir en body
if (!/^\d{3,4}$/.test(cvv)) {
  throw new Error('CVV inválido');
}
// No agregar al body final
```

---

## 🟡 CAMBIOS IMPORTANTES (Prioridad 2)

### PayPal - Email

```javascript
// ❌ ANTES
email_paypal: "juan.perez@email.com"

// ✅ DESPUÉS
email_billetera: "juan.perez@email.com"
```

---

### Transferencia - Campos múltiples

```javascript
// ❌ ANTES
numero_transaccion: "TRX...",
banco_origen: "Banco Nacional",
titular_cuenta: "Juan Perez"

// ✅ DESPUÉS
identificador_externo: "TRX...",
banco: "Banco Nacional",
nombre_titular: "Juan Perez"
```

---

### Bitcoin y Efectivo - Identificador

```javascript
// ❌ ANTES (Bitcoin)
wallet_address: "1A1z7agoat..."

// ✅ DESPUÉS (Bitcoin)
identificador_externo: "1A1z7agoat..."

// ❌ ANTES (Efectivo)
entrega: "contra_entrega"

// ✅ DESPUÉS (Efectivo)
identificador_externo: "contra_entrega"
```

---

## 🟢 SIN CAMBIOS (Prioridad 3)

Estos campos van tal como están:

```javascript
const sinCambios = {
  id_metodo_pago: 1,        // ✓ Igual
  alias: "Mi Visa",         // ✓ Igual
  es_predeterminado: false  // ✓ Igual
};
```

---

## 📈 IMPACTO POR TIPO

| Tipo | Campos a cambiar | Complejidad | Tiempo |
|------|---|---|---|
| **Tarjeta** | 4 cambios críticos | 🔴 Alta | 2h |
| **PayPal** | 1 renombrado | 🟢 Baja | 15min |
| **Transferencia** | 3 renombrados | 🟡 Media | 30min |
| **Bitcoin** | 1 renombrado | 🟢 Baja | 15min |
| **Efectivo** | 1 renombrado | 🟢 Baja | 15min |

**Total de trabajo:** 3-3.5 horas

---

## ✨ RESPUESTA DEL BACKEND

```json
{
  "success": true,
  "message": "Método de pago guardado exitosamente",
  "data": {
    "id_metodo_pago_cliente": 5,           // ← GUARDAR ESTO
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

**Importante:** El `id_metodo_pago_cliente` es lo que usarás en el checkout.

---

## 🚨 ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| 400 VALIDACION_ERROR | Campo requerido faltante | Incluir todos los campos |
| 401 NO_AUTENTICADO | Token inválido | Verificar Bearer token |
| 403 ACCESO_DENEGADO | Otro cliente | Usar token del cliente correcto |
| 409 DUPLICADO | Método existe | Usar el existente |
| 422 DATOS_INVALIDOS | Formato incorrecto | Validar en frontend |

---

## 💡 HACKS Y TIPS

### Validar Número de Tarjeta (Luhn)
```javascript
function validarTarjeta(numero) {
  const digitos = numero.replace(/\D/g, '');
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let digit = parseInt(digitos[digitos.length - 1 - i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    suma += digit;
  }
  return suma % 10 === 0;
}
```

### Detectar Tipo de Tarjeta
```javascript
function detectarTipo(numero) {
  if (/^4/.test(numero)) return 'visa';
  if (/^5[1-5]/.test(numero)) return 'mastercard';
  if (/^3[47]/.test(numero)) return 'amex';
  return 'otro';
}
```

### Validar Email
```javascript
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Construir Body Dinámico
```javascript
function construirBody(formData) {
  const body = {
    id_metodo_pago: formData.idMetodoPago,
    alias: formData.alias,
    es_predeterminado: formData.esPredeterminado || false
  };
  
  // Agregar campos específicos según tipo
  if (formData.tipo === 'tarjeta') {
    body.numero_tarjeta_ultimos_4 = formData.numero.slice(-4);
    body.fecha_expiracion = convertirFecha(formData.fecha);
    // ... otros campos
  } else if (formData.tipo === 'paypal') {
    body.email_billetera = formData.email;
  }
  
  return body;
}
```

---

## 📍 UBICACIÓN DE ARCHIVOS ÚTILES

| Archivo | Propósito | Para quién |
|---------|-----------|-----------|
| `FRONTEND_METODOS_PAGO_AJUSTES.md` | Cambios detallados por tipo | Frontend developers |
| `RECOMENDACIONES_IMPLEMENTACION_FRONTEND.md` | Guía paso a paso | Project manager |
| `METODOS_PAGO_ORDENES.md` | API specification completa | Developers |
| `RESUMEN_ANALISIS_FRONTEND_BACKEND.md` | Análisis general | Team leads |
| `TABLA_REFERENCIA_RAPIDA.md` | Este archivo | Quick reference |

---

## 🎯 PRÓXIMOS PASOS

1. **Hoy:** Revisión de este documento
2. **Mañana:** Comenzar con tarjeta (más crítica)
3. **Esta semana:** Implementar todos los tipos
4. **Siguiente semana:** Testing y QA

---

**Última actualización:** 17 de Noviembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para referencia
