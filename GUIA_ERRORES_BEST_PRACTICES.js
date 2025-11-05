// CHECKLIST: Cómo escribir un servicio con manejo de errores CORRECTO
// ==================================================================

// ✅ PATRÓN CORRECTO - SIEMPRE USAR ESTO

import { Modelo } from '../models/index.js';

class MiServicio {
  // 1️⃣ Operación GET - No lanza error si no encuentra (retorna null)
  async getById(id) {
    return Modelo.findByPk(id);
    // ✅ Retorna null/undefined si no existe (OK para GET)
  }

  // 2️⃣ Operación UPDATE - LANZA ERROR si no encuentra
  async update(id, updates) {
    const recurso = await Modelo.findByPk(id);
    if (!recurso) throw new Error('Recurso no encontrado');  // ✅ THROW
    await recurso.update(updates);
    return recurso;
  }

  // 3️⃣ Operación DELETE - LANZA ERROR si no encuentra
  async delete(id) {
    const recurso = await Modelo.findByPk(id);
    if (!recurso) throw new Error('Recurso no encontrado');  // ✅ THROW
    await recurso.destroy();
    return true;
  }

  // 4️⃣ Validación de datos - LANZA ERROR si falla
  async create(data) {
    if (!data.nombre) throw new Error('El nombre es requerido');  // ✅ THROW
    if (data.precio < 0) throw new Error('El precio no puede ser negativo');  // ✅ THROW
    return Modelo.create(data);
  }

  // 5️⃣ Operaciones con relaciones - LANZA ERROR si relación no existe
  async updateWithCategory(id, updates) {
    if (updates.id_categoria) {
      const categoria = await Categoria.findByPk(updates.id_categoria);
      if (!categoria) throw new Error('Categoría no encontrada');  // ✅ THROW
    }
    const recurso = await Modelo.findByPk(id);
    if (!recurso) throw new Error('Recurso no encontrado');  // ✅ THROW
    await recurso.update(updates);
    return recurso;
  }
}

export default new MiServicio();

// ========================================
// CÓMO USAR EN CONTROLADORES
// ========================================

// ✅ PATRÓN CORRECTO EN CONTROLADORES

router.put('/recursos/:id', async (req, res) => {
  try {
    // Llamar al servicio - si no existe, lanzará Error
    const recurso = await miServicio.update(req.params.id, req.body);
    
    // Si llegamos aquí, todo está OK
    res.status(200).json({ 
      message: 'Recurso actualizado',
      recurso 
    });
    
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('requerido')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('negativo')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Error genérico
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✅ PARA OPERACIONES GET (opcional usar try-catch)

router.get('/recursos/:id', async (req, res) => {
  try {
    const recurso = await miServicio.getById(req.params.id);
    
    if (!recurso) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    
    res.json(recurso);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========================================
// TABLA DE DECISIÓN: ¿LANZAR ERROR O NO?
// ========================================

/*
┌─────────────────────────┬──────────────┬─────────────────────────────┐
│ Operación               │ ¿Lanzar?     │ Ejemplo                     │
├─────────────────────────┼──────────────┼─────────────────────────────┤
│ findByPk en GET         │ ❌ NO        │ Retorna null                │
│ findByPk en UPDATE      │ ✅ SÍ       │ throw 'no encontrado'       │
│ findByPk en DELETE      │ ✅ SÍ       │ throw 'no encontrado'       │
│ Validar datos entrada   │ ✅ SÍ       │ throw 'campo requerido'     │
│ Validar relación exists │ ✅ SÍ       │ throw 'categoría no existe' │
│ Stock insuficiente      │ ✅ SÍ       │ throw 'stock insuficiente'  │
│ Email duplicado         │ ✅ SÍ       │ throw 'email ya registrado' │
│ Transacción falla       │ ✅ SÍ       │ throw error                 │
└─────────────────────────┴──────────────┴─────────────────────────────┘
*/

// ========================================
// ERRORES COMUNES A EVITAR
// ========================================

// ❌ MALO - Retornar null en operaciones de mutación
async updateProducto(id, updates) {
  const producto = await Producto.findByPk(id);
  if (!producto) return null;  // ❌ INCORRECTO
  await producto.update(updates);
  return producto;
}

// ✅ CORRECTO
async updateProducto(id, updates) {
  const producto = await Producto.findByPk(id);
  if (!producto) throw new Error('Producto no encontrado');  // ✅ CORRECTO
  await producto.update(updates);
  return producto;
}

// ❌ MALO - No validar en operaciones que modifican datos
async createProducto(data) {
  return Producto.create(data);  // ❌ ¿Qué pasa si data es inválido?
}

// ✅ CORRECTO
async createProducto(data) {
  if (!data.nombre) throw new Error('El nombre es requerido');
  if (!data.precio) throw new Error('El precio es requerido');
  if (data.precio < 0) throw new Error('El precio no puede ser negativo');
  return Producto.create(data);
}

// ========================================
// RESUMEN RÁPIDO
// ========================================

/*
REGLAS DE ORO:

1. Servicios SIEMPRE lanzan errores para operaciones fallidas
2. Controladores SIEMPRE tienen try-catch
3. En controladores: Detecta tipo de error → HTTP status apropiado
4. Mensajes de error deben ser descriptivos
5. Nunca dejar error no capturado sin try-catch

ERRORES        STATUS HTTP
----------     -----------
no encontrado  404
inválido       400
duplicado      409
conflicto      409
interno        500
*/
