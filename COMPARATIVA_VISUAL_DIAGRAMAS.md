# 📊 COMPARATIVA VISUAL Y DIAGRAMA ESTRUCTURAL

## VISTA GENERAL DE TABLAS

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                        COMPARATIVA DE TABLAS                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

normalizacion.sql (30+ tablas)          ecommerce.sql (~20 tablas)
─────────────────────────────────────   ─────────────────────────────────
✅ Roles                                ✅ Roles
✅ Usuarios                             ✅ Usuarios
✅ Clientes                             ✅ Clientes
✅ Direcciones                          ✅ Direcciones
✅ Categoria_Producto                   ✅ Categoria_Producto
✅ Producto                             ✅ Producto
✅ Producto_Imagenes                    ✅ Producto_Imagenes
✅ Carrito_Compras                      ✅ Carrito_Compras
✅ Carrito_Productos                    ✅ Carrito_Productos
⛔ Orden_Estados                        ❌ (NO EXISTE)
⛔ Orden_Estado_Transiciones            ❌ (NO EXISTE)
⛔ Orden_Estado_Historial               ❌ (NO EXISTE)
✅ Ordenes                              ✅ Ordenes (DIFERENTE ESTRUCTURA)
✅ Ordenes_Items                        ✅ Ordenes_Items
⛔ Metodos_Pago                         ❌ (NO EXISTE)
⛔ Metodos_Pago_Cliente                 ❌ (NO EXISTE)
✅ Payments                             ✅ Payments (ESTRUCTURA DIFERENTE)
⛔ Almacenes                            ❌ (NO EXISTE)
⛔ Inventario                           ❌ (NO EXISTE)
⛔ Movimientos_Inventario               ❌ (NO EXISTE)
⛔ Proveedores                          ❌ (NO EXISTE)
⛔ Ordenes_Compra                       ❌ (NO EXISTE)
⛔ Ordenes_Compra_Detalle               ❌ (NO EXISTE)
⛔ Alertas_Inventario                   ❌ (NO EXISTE)
✅ Interacciones_Cliente                ✅ Interacciones_Cliente
✅ Oportunidades_Venta                  ✅ Oportunidades_Venta
✅ Tareas_CRM                           ✅ Tareas_CRM
✅ Segmentos_Cliente                    ✅ Segmentos_Cliente
✅ Cliente_Segmentos                    ✅ Cliente_Segmentos
✅ Campanas_Marketing                   ✅ Campanas_Marketing
✅ Campana_Clientes                     ✅ Campana_Clientes
───────────────────────────────────────────────────────────────────────────
   30+ tablas                               ~20 tablas

   ✅ COMPATIBLE  =  12 tablas
   ⛔ CONFLICTO   =  8 tablas
   ❌ FALTA       =  10 campos en tablas existentes
```

---

## ARQUITECTURA DE ÓRDENES

### normalizacion.sql (NORMALIZADO - Recomendado)

```
┌─────────────────────────────────────────────────────────────────┐
│                       ARQUITECTURA DE ÓRDENES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ordenes                                                        │
│  ├─ id_orden (PK)                                              │
│  ├─ id_cliente (FK)                                            │
│  ├─ id_direccion_envio (FK)                                    │
│  ├─ id_estado_orden (FK) ──────────────┐                       │
│  ├─ estado_orden (VARCHAR) [REDUNDANTE]│                       │
│  ├─ fecha_estado_cambio                │                       │
│  ├─ dias_estimados_entrega             │                       │
│  └─ total_orden                        │                       │
│                                        │                       │
│  Orden_Estados ◄──────────────────────┘                        │
│  ├─ id_orden_estado (PK)                                       │
│  ├─ codigo_estado (UNIQUE)                                     │
│  ├─ nombre_estado                                              │
│  ├─ color_hex                                                  │
│  ├─ icono                                                      │
│  ├─ orden_secuencia                                            │
│  ├─ es_estado_final                                            │
│  └─ activo                                                     │
│                                        ┌────────────────────┐  │
│  Orden_Estado_Transiciones             │                    │  │
│  ├─ id_transicion                      │  (Controla qué     │  │
│  ├─ id_estado_origen ──────────────────┤   transiciones son  │  │
│  ├─ id_estado_destino                  │   permitidas)      │  │
│  ├─ requiere_permiso                   │                    │  │
│  ├─ rol_requerido                      │                    │  │
│  └─ descripcion                        │                    │  │
│                                        └────────────────────┘  │
│                                        ┌────────────────────┐  │
│  Orden_Estado_Historial                │  (Auditoría de     │  │
│  ├─ id_historial                       │   todos los cambios│  │
│  ├─ id_orden ───────────────────┐      │   de estado)       │  │
│  ├─ id_estado_anterior          │      │                    │  │
│  ├─ id_estado_nuevo             │      │                    │  │
│  ├─ id_usuario                  │      │                    │  │
│  ├─ comentario                  │      │                    │  │
│  ├─ fecha_cambio                │      │                    │  │
│  └─ metadata (JSONB)            │      │                    │  │
│                                 └──────┤                    │  │
└─────────────────────────────────────────┼────────────────────┘  │
                                         │                        │
              BENEFICIOS:                │                        │
              ✅ Control completo       │                        │
              ✅ Auditoría              │                        │
              ✅ Validación             │                        │
              ✅ Historial              │                        │
              ✅ Escalable              │                        │
                                         └────────────────────────
```

### ecommerce.sql (DENORMALIZADO)

```
┌─────────────────────────────────────────────────────────┐
│             ARQUITECTURA SIMPLIFICADA                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Ordenes                                                │
│  ├─ id_orden (PK)                                      │
│  ├─ id_cliente (FK)                                    │
│  ├─ id_direccion_envio (FK)                            │
│  ├─ estado_orden (VARCHAR) ◄─ CHECK constraint         │
│  │  └─ 'pendiente'                                     │
│  │  └─ 'procesando'                                    │
│  │  └─ 'enviado'                                       │
│  │  └─ 'entregado'                                     │
│  │  └─ 'cancelado'                                     │
│  └─ total_orden                                        │
│                                                         │
│  ❌ NO HAY:                                            │
│  • Tabla de estados maestra                            │
│  • Validación de transiciones                          │
│  • Historial de cambios                                │
│  • Campos adicionales (colores, iconos)                │
│                                                         │
│  LIMITACIONES:                                         │
│  ❌ Sin auditoría                                      │
│  ❌ Sin control de flujo                               │
│  ❌ Difícil de extender                                │
│  ❌ Sin metadata                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ARQUITECTURA DE PAGOS

### normalizacion.sql (COMPLETO - Recomendado)

```
┌──────────────────────────────────────────────────────────────┐
│                  SISTEMA DE PAGOS COMPLETO                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Payments                                                    │
│  ├─ id_pago (PK)                                            │
│  ├─ id_orden (FK) ─────────────────┐                        │
│  ├─ id_metodo_pago (FK) ──────────┐│                        │
│  ├─ monto_base                     ││                        │
│  ├─ comision_pago                  ││                        │
│  ├─ comision_porcentaje            ││                        │
│  ├─ impuesto_venta                 ││                        │
│  ├─ monto_total                    ││                        │
│  ├─ estado_pago                    ││                        │
│  ├─ referencia_externa             ││                        │
│  ├─ transaccion_id                 ││                        │
│  └─ metadata (JSONB)               ││                        │
│                                    ││                        │
│  Metodos_Pago ◄────────────────────┘│                        │
│  ├─ id_metodo_pago (PK)             │                        │
│  ├─ nombre_metodo                   │                        │
│  ├─ tipo_metodo                     │                        │
│  │  ├─ 'tarjeta_credito'            │                        │
│  │  ├─ 'tarjeta_debito'             │                        │
│  │  ├─ 'transferencia_bancaria'      │                        │
│  │  ├─ 'billetera_digital'           │                        │
│  │  ├─ 'efectivo'                    │                        │
│  │  ├─ 'cheque'                      │                        │
│  │  └─ 'criptomoneda'                │                        │
│  ├─ comision_porcentaje             │                        │
│  ├─ comision_fija                   │                        │
│  ├─ disponible_online               │                        │
│  ├─ disponible_tienda               │                        │
│  └─ orden_visualizacion             │                        │
│                                     │                        │
│  Metodos_Pago_Cliente ◄─────────────┘                        │
│  ├─ id_metodo_cliente (PK)                                  │
│  ├─ id_cliente (FK)                                         │
│  ├─ id_metodo_pago (FK)                                     │
│  ├─ numero_cuenta                                           │
│  ├─ numero_tarjeta_enmascarado                              │
│  ├─ nombre_titular                                          │
│  └─ es_predeterminado                                       │
│                                                              │
│  VENTAJAS:                                                   │
│  ✅ Comisiones por método                                   │
│  ✅ Métodos guardados                                       │
│  ✅ Disponibilidad configurable                             │
│  ✅ Seguridad (enmascarado)                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### ecommerce.sql (SIMPLIFICADO)

```
┌──────────────────────────────────────────────────────┐
│           SISTEMA DE PAGOS SIMPLIFICADO              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Payments                                            │
│  ├─ id_pago (PK)                                    │
│  ├─ id_orden (FK)                                   │
│  ├─ metodo_pago (VARCHAR directo)                   │
│  │  ├─ 'tarjeta_credito'                            │
│  │  ├─ 'tarjeta_debito'                             │
│  │  ├─ 'paypal'                                     │
│  │  ├─ 'transferencia'                              │
│  │  └─ 'efectivo'                                   │
│  ├─ monto                                           │
│  ├─ estado_pago                                     │
│  ├─ transaccion_id                                  │
│  └─ detalles_pago                                   │
│                                                      │
│  ❌ NO TIENE:                                       │
│  • Tabla Metodos_Pago                               │
│  • Tabla Metodos_Pago_Cliente                       │
│  • Cálculo de comisiones                            │
│  • Métodos guardados                                │
│  • Información detallada por método                 │
│                                                      │
│  LIMITACIONES:                                      │
│  ❌ Sin detalles de comisión                        │
│  ❌ Sin métodos guardados                           │
│  ❌ Menos flexible                                  │
│  ❌ Difícil agregar características                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ARQUITECTURA DE INVENTARIO

### normalizacion.sql (TIENE INVENTARIO ✅)

```
┌─────────────────────────────────────────────────────────────────┐
│                  GESTIÓN DE INVENTARIO COMPLETA                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Almacenes                                                      │
│  ├─ id_almacen (PK)                                            │
│  ├─ nombre_almacen                                             │
│  ├─ direccion                                                  │
│  └─ responsable                                                │
│         │                                                      │
│         ├──────────────────────────────┐                       │
│         │                              │                       │
│  Inventario                    Inventario                      │
│  ├─ id_inventario             ├─ id_inventario                │
│  ├─ id_producto ──┐           ├─ cantidad_actual              │
│  ├─ id_almacen ◄─┼──────┐    ├─ cantidad_minima              │
│  ├─ cantidad_actual │   │    ├─ ubicacion_fisica              │
│  ├─ cantidad_minima │   │    └─ reorden automático            │
│  └─ ubicacion_fisica│   │            │                        │
│                     │   │            └─────────────────┐       │
│                     │   │                              │       │
│  Proveedores        │   │    Movimientos_Inventario    │       │
│  ├─ id_proveedor    │   │    ├─ id_movimiento          │       │
│  ├─ nombre          │   │    ├─ id_inventario ◄───────┘       │
│  ├─ email           │   │    ├─ tipo_movimiento               │
│  └─ telefono        │   │    │  ├─ 'compra'                   │
│         │           │   │    │  ├─ 'venta'                    │
│         │           │   │    │  ├─ 'devolucion'               │
│  Ordenes_Compra     │   │    │  ├─ 'ajuste'                   │
│  ├─ id_orden_compra │   │    │  └─ 'otros'                    │
│  ├─ id_proveedor ◄──┘   │    ├─ cantidad                      │
│  ├─ estado              │    ├─ id_usuario                    │
│  ├─ total               │    ├─ fecha_movimiento              │
│  └─ fecha_entrega       │    ├─ referencia                    │
│         │               │    └─ metadata                      │
│  Ordenes_Compra_Detalle │                              ┌─────┘
│  ├─ id_detalle          │    Alertas_Inventario       │
│  ├─ id_orden_compra ◄───┘    ├─ id_alerta             │
│  ├─ id_producto ◄─────────────┤ id_inventario ◄───────┘
│  ├─ cantidad                  ├─ tipo_alerta
│  └─ precio_unitario           │  ├─ 'bajo_stock'
│                               │  ├─ 'stock_agotado'
│  BENEFICIOS:                  │  └─ 'reorden_pendiente'
│  ✅ Control completo          ├─ fecha_alerta
│  ✅ Auditoría de movimientos  ├─ resuelta
│  ✅ Múltiples almacenes       └─ fecha_resolucion
│  ✅ Gestión de proveedores    
│  ✅ Alertas de stock          
│                               
└─────────────────────────────────────────────────────────────────┘
```

### ecommerce.sql (SIN INVENTARIO ❌)

```
┌──────────────────────────────────────────┐
│      GESTIÓN DE INVENTARIO: AUSENTE      │
├──────────────────────────────────────────┤
│                                          │
│  ❌ NO TIENE:                           │
│  • Tabla Almacenes                       │
│  • Tabla Inventario                      │
│  • Tabla Movimientos_Inventario          │
│  • Tabla Proveedores                     │
│  • Tabla Ordenes_Compra                  │
│  • Tabla Ordenes_Compra_Detalle          │
│  • Tabla Alertas_Inventario              │
│                                          │
│  IMPLICACIONES:                          │
│  ❌ Sin control de stock                │
│  ❌ Sin múltiples almacenes              │
│  ❌ Sin gestión de proveedores           │
│  ❌ Sin auditoría de movimientos         │
│  ❌ Sin alertas de bajo stock            │
│  ❌ Imposible gestionar inventory        │
│                                          │
│  CONSECUENCIA:                           │
│  🚫 FUNCIONALIDAD CRÍTICA FALTANTE       │
│                                          │
└──────────────────────────────────────────┘
```

---

## PUNTUACIÓN DE COMPATIBILIDAD

```
ESCALA: ■■■■■ (5 = Máximo Compatible)
        ■■■□□ (3 = Neutral)
        ■□□□□ (1 = Incompatible)

TABLA                              normalizacion  ecommerce
───────────────────────────────────────────────────────────
Tablas Base (Roles, Usuarios)      ■■■■■ 5/5      ■■■■■ 5/5
Producto & Categorías              ■■■■■ 5/5      ■■■■■ 5/5
Carrito & Items                    ■■■■■ 5/5      ■■■■■ 5/5
Órdenes & Items                    ■■■□□ 3/5      ■■■□□ 3/5
Métodos de Pago                    ■■■■■ 5/5      ■□□□□ 1/5
Pagos                              ■■■■□ 4/5      ■■□□□ 2/5
Inventario                         ■■■■■ 5/5      ■□□□□ 1/5
CRM                                ■■■■■ 5/5      ■■■■■ 5/5
Auditoría & Historial              ■■■■■ 5/5      ■■□□□ 2/5

COMPATIBILIDAD GENERAL:            ■■■■□ 4/5      ■■■□□ 3/5
```

---

## MATRIZ DE DECISIÓN

```
┌──────────────────┬──────────────────┬─────────────────────┐
│    CRITERIO      │  normalizacion   │    ecommerce        │
├──────────────────┼──────────────────┼─────────────────────┤
│ Completitud      │ ✅ 100%          │ ⚠️ 70%              │
│ Normalización    │ ✅ Excelente      │ ⚠️ Bueno            │
│ Escalabilidad    │ ✅ Alta           │ ⚠️ Media            │
│ Performance      │ ✅ Bueno          │ ✅ Excelente        │
│ Auditoría        │ ✅ Completa       │ ⚠️ Básica           │
│ Inventario       │ ✅ Sí             │ ❌ No               │
│ Métodos Pago     │ ✅ Normalizado    │ ⚠️ Simple           │
│ Seguridad        │ ✅ Alta           │ ⚠️ Media            │
│ Facilidad Uso    │ ⚠️ Complejidad    │ ✅ Simplicidad      │
│ Mantenibilidad   │ ✅ Buena          │ ✅ Buena            │
├──────────────────┼──────────────────┼─────────────────────┤
│ PUNTUACIÓN TOTAL │ ⭐⭐⭐⭐⭐ 9/10  │ ⭐⭐⭐⭐ 7/10     │
├──────────────────┼──────────────────┼─────────────────────┤
│ RECOMENDACIÓN    │ ✅ USAR           │ ❌ EVITAR           │
└──────────────────┴──────────────────┴─────────────────────┘
```

---

## FLUJO DE DECISIÓN

```
                    ¿Usaré ambos scripts?
                             │
                ┌────────────┴────────────┐
                │                         │
               SÍ                        NO
                │                         │
          ❌ ERROR                   ¿Cuál elegir?
         CONFLICTO                         │
                                  ┌────────┴────────┐
                                  │                 │
                          ecommerce.sql    normalizacion.sql
                                  │                 │
                              ⚠️ BÁSICO          ✅ COMPLETO
                              ⚠️ SIMPLE          ✅ ROBUSTO
                              ❌ SIN INVENTARIO  ✅ CON TODO
                                  │                 │
                              ELECCIÓN             ELEGIR
                              INCORRECTA           ESTA
                                                   ✅
```

---

**Generado:** Análisis Visual y Comparativo  
**Última actualización:** Noviembre 10, 2025
