# 🔧 Solución: Error de Registro - Violación de Clave Foránea

## 📋 Problema

```
Error: inserción o actualización en la tabla «clientes» viola la llave foránea «clientes_id_usuario_fkey»
La llave (id_usuario)=(23) no está presente en la tabla «usuarios».
```

## 🎯 Causa Raíz

Hay un conflicto en las **secuencias de autoincremento** de PostgreSQL. Esto ocurre cuando:
- Se trabaja desde múltiples equipos
- Se restauran datos de un backup
- Hay sincronización de bases de datos
- Las secuencias de ID se desincronizaron

## ✅ Soluciones

### Opción 1: Reparar las Secuencias (RECOMENDADO)

```bash
# Ejecutar desde la carpeta raíz del proyecto
npm run fix-sequences
```

Si `fix-sequences` no está registrado en `package.json`, ejecutar directamente:

```bash
node scripts/fix-sequences.js
```

**¿Qué hace?**
- Obtiene el ID máximo actual en cada tabla
- Establece la secuencia del siguiente ID disponible
- Previene conflictos futuros

### Opción 2: Resetear la Base de Datos Completa

**Solo usar si no hay datos importantes:**

```bash
npm run clean-db
npm run sync-db
```

### Opción 3: Limpieza Manual en PostgreSQL

Si prefieres hacerlo manualmente:

```sql
-- Conectate a tu base de datos PostgreSQL
-- Obtén el máximo ID actual
SELECT MAX(id_usuario) FROM "Usuarios";
SELECT MAX(id_cliente) FROM clientes;

-- Actualiza las secuencias (reemplaza XXX con el valor máximo + 1)
SELECT setval('"Usuarios_id_usuario_seq"', XXX, true);
SELECT setval('clientes_id_cliente_seq', XXX, true);
```

## 🚀 Después de Aplicar la Solución

1. **Intenta registrar nuevamente** desde el otro equipo
2. **Verifica en la BD** que ambos registros se crearon:
   ```sql
   SELECT id_usuario, nombre_usuario FROM "Usuarios" ORDER BY id_usuario DESC LIMIT 5;
   SELECT id_cliente, id_usuario FROM clientes ORDER BY id_cliente DESC LIMIT 5;
   ```

3. **Si el error persiste**, revisa:
   - ✅ Que PostgreSQL esté corriendo
   - ✅ La conexión a BD sea correcta
   - ✅ Los permisos de usuario en PostgreSQL

## 📊 Cambios Realizados

### 1. `auth.controller.js`
- ✅ Agregada verificación de que el usuario se guardó correctamente
- ✅ Mejor manejo de errores con try-catch en destroy
- ✅ Logs más descriptivos para debugging

### 2. `cliente.model.js`
- ✅ Agregada definición explícita de referencias de clave foránea
- ✅ Mayor claridad en la estructura del modelo

### 3. `scripts/fix-sequences.js` (NUEVO)
- ✅ Script automatizado para reparar secuencias
- ✅ Muestra el estado actual antes y después

## 🔍 Debugging Adicional

Si necesitas más información sobre qué está pasando, activa logs detallados:

```javascript
// En auth.controller.js, agregar:
console.log('ℹ️ Datos de usuario creado:', {
  id_usuario: newUser.id_usuario,
  nombre_usuario: newUser.nombre_usuario,
  id_rol: newUser.id_rol
});
```

## 📝 Notas

- Este error es **común en desarrollo multi-equipo** con PostgreSQL
- Las secuencias en PostgreSQL son independientes de los datos reales
- Por eso es importante sincronizarlas después de operaciones de bulk o restore

---

**¿Sigue sin funcionar?** Comparte la salida de:
```bash
SELECT version();
SELECT MAX(id_usuario) FROM "Usuarios";
SELECT MAX(id_cliente) FROM clientes;
```
