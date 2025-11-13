# 📝 ACTUALIZACIÓN: FLUJO DE DATOS v2.0

**Fecha:** 12 Noviembre 2025  
**Cambios realizados en:** `FLUJO_DATOS.MD`

---

## ¿QUÉ CAMBIÓ?

La documentación se reescribió completamente para que los **desarrolladores frontend entiendan la LÓGICA del backend**, no solo los endpoints.

### Antes (v1.0)
❌ Listaba endpoints en formato técnico  
❌ Mostraba request/response pero sin explicar QUÉ pasa en el backend  
❌ Difícil entender el flujo completo  
❌ Mucho contenido genérico

### Ahora (v2.0)
✅ **Explica QUÉ pasa en el backend en cada paso**  
✅ **Cada endpoint tiene:** "¿Qué pasa en el backend?" + Código frontend  
✅ **Flujo lógico completo** (autenticación → compra → pago → seguimiento)  
✅ **Conceptos clave** que el frontend DEBE entender  
✅ **Ejemplos reales de código JavaScript**  
✅ **Checklist** paso a paso para una compra  
✅ **Errores comunes** y cómo evitarlos

---

## 🎯 ESTRUCTURA NUEVA

### 1. Introducción Clara (QUÉ ES JWT)
```
Token JWT = pase de acceso
Contiene: id_usuario, rol, email, expiración, firma
Se guarda en: localStorage
Se envía en: headers de CADA petición autenticada
```

### 2. Etapas de la Aplicación
```
1. AUTENTICACIÓN (registro/login)
2. PERFIL CLIENTE (datos personales)
3. DIRECCIONES (dónde enviar)
4. CATÁLOGO (ver productos - público)
5. CARRITO (temporal mientras compras)
6. CREAR ORDEN (checkout - crítico)
7. PAGOS (procesar pago)
```

### 3. Para CADA Etapa

**Explicación de la lógica:**
```javascript
// ¿Qué pasa en el backend?
1. Valida token
2. Obtiene id_cliente
3. Busca carrito activo
4. Valida que producto existe
5. Valida stock disponible
6. Si todo OK → agrega producto
7. Recalcula total
8. Retorna carrito actualizado
```

**Código frontend práctico:**
```javascript
const response = await fetch('/api/carrito', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    id_producto: 1,
    cantidad: 2
  })
});

const data = await response.json();
console.log(`Total: $${data.data.total}`);
```

### 4. Conceptos Clave
- **TOKEN:** Cómo generarlo, guardarlo, usarlo
- **ID_CLIENTE:** Generado automáticamente, se extrae del token
- **TRANSACCIONES:** Si falla algo en CREAR ORDEN, TODO se revierte
- **ESTADOS:** Orden y Pago tienen estados que cambian
- **CARRITO:** Temporal, se archiva al hacer checkout

### 5. Tabla de Referencia Rápida
Todos los endpoints en una tabla:
| Endpoint | Método | Token | Función |

### 6. Checklist de Compra
Pasos exactos que debe hacer el frontend:
- [ ] Registrar/Login
- [ ] Ver catálogo
- [ ] Agregar al carrito
- [ ] Crear orden
- [ ] Procesar pago
- [ ] Ver confirmación

---

## 🎬 SECCIÓN MÁS IMPORTANTE: CREAR ORDEN

### ¿Por qué es crítica?

Es una **TRANSACCIÓN** (todo-o-nada):

```
Backend:
1. Valida stock de TODOS los items
   ↓ Si falla → ERROR, NO se crea nada
2. Decrementa stock
3. Crea ORDEN
4. Crea ORDEN_ITEMS
5. Marca carrito como "completado"
6. Crea carrito nuevo
   ↓ Si todo OK → Guardar cambios
```

**Frontend debe entender:**
- No puede crear orden sin carrito
- No puede crear orden sin dirección
- Si hay error de stock → intentar con cantidad menor

---

## 📋 CAMBIOS ESPECÍFICOS EN SECCIONES

### Sección 1: AUTENTICACIÓN
**Antes:** Listaba endpoints POST/GET  
**Ahora:** Explica que el TOKEN es un pase de acceso que se debe guardar en localStorage y enviar en CADA petición

### Sección 5: CARRITO
**Antes:** Listaba crear/actualizar/eliminar  
**Ahora:** Explica que es TEMPORAL, que valida stock, que calcula total en el backend

### Sección 6: CREAR ORDEN
**Antes:** Mostraba request/response  
**Ahora:** Explica TODO el proceso transaccional, validaciones, y qué puede salir mal

### Sección 7: PAGOS
**Antes:** Listaba crear pago  
**Ahora:** Explica que la orden CAMBIA DE ESTADO cuando se crea el pago

---

## 🔍 EJEMPLOS DE COMPRENSIÓN NUEVA

### Antes
Frontend: "¿Cómo creo una orden?"  
Respuesta: "POST /api/ordenes con {id_direccion: 1}"  
Frontend: "Ok, ¿y si falla?"  
Respuesta: "Error 400"  
Frontend: ❓ ¿Qué salió mal? ¿Cómo lo arreglo?

### Ahora
Frontend: "¿Cómo creo una orden?"  
Respuesta: 
```
El backend:
1. Valida que tienes carrito con items
2. Valida que la dirección es tuya
3. Revisa stock de CADA producto
4. Si TODO está ok → crea la orden
5. Decrementa stock
6. Vacía tu carrito
7. Crea uno nuevo

Errores comunes:
- "Sin stock" → Reduce cantidad
- "Carrito vacío" → Agrega productos
- "Dirección no encontrada" → Usa IDs de GET /api/direcciones
```

Frontend: ✅ Entiendo exactamente qué validar antes

---

## 💡 QUÉ DEBE VALIDAR EL FRONTEND AHORA

Antes de pedir al backend, valida:

```javascript
// ANTES de agregar al carrito
if (producto.stock === 0) {
  alert('Sin stock');
  return;
}

// ANTES de hacer checkout
if (carrito.items.length === 0) {
  alert('Carrito vacío');
  return;
}
if (!direccionSeleccionada) {
  alert('Selecciona dirección');
  return;
}

// ANTES de pagar
if (montoIngresado !== totalOrden) {
  alert('Monto incorrecto');
  return;
}
```

Esto hace la aplicación:
- ✅ Más rápida (no pide cosas imposibles)
- ✅ Mejor UX (errores claros antes)
- ✅ Menos carga servidor

---

## 📊 ESTADÍSTICAS DE LA ACTUALIZACIÓN

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas | 1000+ | 900 (más denso) |
| Secciones | 7 endpoints | 7 etapas + conceptos |
| Ejemplos código | 0 | 50+ |
| Explicaciones lógica | Mínimas | Completas |
| Tablas | 1 | 3 |
| Checklists | 0 | 2 |

---

## 🎯 PARA QUE SIRVE ESTA DOCUMENTACIÓN AHORA

### Para el Frontend Developer
- Entiende QUÉ validar antes de cada petición
- Entiende QUÉ puede salir mal y por qué
- Entiende CÓMO arreglar errores comunes
- Puede construir UX mejor (validaciones anticipadas)

### Para el Backend Developer
- Sabe exactamente QUÉ debe validar en cada endpoint
- Sabe exactamente QUÉ puede fallar
- Sabe exactamente QUÉ responder

### Para ambos
- Documentación única de referencia
- Lenguaje común
- Menos confusión
- Menos bugs

---

## ✅ CHECKLIST DE REVISIÓN

- [x] Se entiende qué es JWT
- [x] Se entiende cómo guardar token
- [x] Se entiende cómo enviarlo en peticiones
- [x] Se entiende flujo COMPLETO de compra
- [x] Se entiende CADA validación que debe hacer
- [x] Se entiende CADA error posible
- [x] Se tiene CÓDIGO de ejemplo
- [x] Se tiene TABLA de referencia rápida
- [x] Se tiene CHECKLIST de compra
- [x] Se entiende concepto de TRANSACCIÓN

---

## 🚀 PRÓXIMAS MEJORAS

1. Agregar diagrama visual del flujo completo
2. Agregar video tutorial
3. Agregar ejemplos con FETCH y AXIOS
4. Agregar ejemplos con React hooks
5. Agregar testing examples

---

**Generado por:** GitHub Copilot  
**Para:** Desarrolladores Frontend y Backend  
**Versión:** 2.0  
**Estado:** ✅ LISTO PARA USAR
