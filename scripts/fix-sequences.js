import sequelize from '../src/config/database.js';

/**
 * Script para reparar las secuencias de autoincremento en PostgreSQL
 * Ejecutar cuando hay conflictos de claves foráneas o IDs duplicados
 */

async function fixSequences() {
  try {
    console.log('🔧 Iniciando reparación de secuencias...\n');

    // Obtener el valor máximo de id_usuario
    const [maxUser] = await sequelize.query('SELECT MAX(id_usuario) as max_id FROM "Usuarios"');
    const maxUserId = maxUser[0]?.max_id || 0;

    // Obtener el valor máximo de id_cliente
    const [maxCliente] = await sequelize.query('SELECT MAX(id_cliente) as max_id FROM clientes');
    const maxClienteId = maxCliente[0]?.max_id || 0;

    console.log(`📊 Estado actual:`);
    console.log(`   - Max Usuario ID: ${maxUserId}`);
    console.log(`   - Max Cliente ID: ${maxClienteId}\n`);

    // Reparar secuencia de usuarios
    await sequelize.query(`SELECT setval('"Usuarios_id_usuario_seq"', ${maxUserId + 1}, true)`);
    console.log(`✅ Secuencia Usuarios actualizada a: ${maxUserId + 1}`);

    // Reparar secuencia de clientes
    await sequelize.query(`SELECT setval('clientes_id_cliente_seq', ${maxClienteId + 1}, true)`);
    console.log(`✅ Secuencia Clientes actualizada a: ${maxClienteId + 1}`);

    console.log('\n🎉 Secuencias reparadas correctamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al reparar secuencias:', error.message);
    process.exit(1);
  }
}

fixSequences();
