# 🗄️ Configuración de la Base de Datos

## Opción 1: Ejecutar Script SQL Completo (RECOMENDADO)

Este método crea toda la estructura de la base de datos desde cero.

### Pasos:

1. **Abre pgAdmin o la terminal de PostgreSQL (psql)**

2. **Conéctate a PostgreSQL:**
   ```bash
   psql -U postgres
   ```

3. **Ejecuta el script completo:**
   ```bash
   \i "C:/Users/Rosquita/Desktop/8vo/Proyecto/ecommerce/src/script/completo.sql"
   ```
   
   O si estás en la terminal de Windows:
   ```powershell
   psql -U postgres -f "C:\Users\Rosquita\Desktop\8vo\Proyecto\ecommerce\src\script\completo.sql"
   ```

4. **Verifica que la base de datos se creó:**
   ```sql
   \c ecommerce_db
   \dt
   ```

5. **Inserta los roles por defecto:**
   ```bash
   npm run setup:roles
   ```

6. **Inicia el servidor:**
   ```bash
   node server.js
   ```

---

## Opción 2: Dejar que Sequelize Cree las Tablas

Si prefieres que Sequelize maneje la creación de tablas automáticamente:

### Pasos:

1. **Crea la base de datos manualmente:**
   ```sql
   CREATE DATABASE ecommerce_db;
   ```

2. **Modifica `server.js`:**
   Cambia la línea:
   ```javascript
   await sequelize.sync({ force: false, alter: false });
   ```
   
   Por:
   ```javascript
   await sequelize.sync({ force: false, alter: true });
   ```

3. **Inserta los roles por defecto:**
   ```bash
   npm run setup:roles
   ```

4. **Inicia el servidor:**
   ```bash
   node server.js
   ```

---

## 🔧 Configuración del Archivo .env

Asegúrate de tener tu archivo `.env` configurado correctamente:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui_cambialo
JWT_EXPIRE=7d
```

---

## 📋 Verificar que Todo Funciona

1. **Verifica la conexión:**
   ```bash
   node server.js
   ```
   
   Deberías ver:
   ```
   Conexión a la base de datos establecida correctamente.
   Modelos sincronizados con la base de datos.
   Servidor escuchando en el puerto 3000
   ```

2. **Verifica los roles en la base de datos:**
   ```sql
   SELECT * FROM "Roles";
   ```
   
   Deberías ver 4 roles:
   - id_rol: 1 → administrador
   - id_rol: 2 → cliente
   - id_rol: 3 → vendedor
   - id_rol: 4 → moderador

---

## ⚠️ Solución de Problemas

### Error: "no existe la relación «Usuarios»"
- **Causa:** Las tablas no se han creado.
- **Solución:** Ejecuta el script SQL completo (Opción 1) o cambia `alter: false` a `alter: true`.

### Error: "error de sintaxis en o cerca de «REFERENCES»"
- **Causa:** Sequelize intenta alterar una columna que ya tiene una foreign key.
- **Solución:** Usa `alter: false` en `server.js` después de ejecutar el script SQL.

### Error: "autenticación falló para el usuario"
- **Causa:** Credenciales incorrectas en `.env`.
- **Solución:** Verifica que `DB_USER` y `DB_PASSWORD` sean correctos.

### Error: "base de datos ecommerce_db no existe"
- **Causa:** La base de datos no se ha creado.
- **Solución:** Crea la base de datos manualmente o ejecuta el script SQL completo.

---

## 🎯 Siguiente Paso: Probar la API

Una vez que la base de datos esté lista:

1. Importa `collection.json` en Postman
2. Ejecuta el endpoint **"Registro de Usuario Administrador"**
3. Ejecuta el endpoint **"Login"** con las credenciales del admin
4. ¡Comienza a probar todos los endpoints!

---

## 📚 Scripts NPM Disponibles

```bash
npm start              # Inicia el servidor
npm run dev            # Inicia el servidor con nodemon (desarrollo)
npm run setup:roles    # Inserta los roles por defecto en la BD
```
