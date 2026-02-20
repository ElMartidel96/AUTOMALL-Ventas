#!/usr/bin/env node
/**
 * 🔄 Direct SQL Execution via Supabase API
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function executeSQL() {
  const serviceKey = process.env.SUPABASE_DAO_SERVICE_KEY;
  const supabaseUrl = process.env.SUPABASE_DAO_URL;
  
  console.log('🔄 Ejecutando SQL directo en Supabase...');
  
  // Leer schema
  const schema = fs.readFileSync('./supabase/schema.sql', 'utf8');
  
  // Dividir en comandos individuales (separados por ;)
  const commands = schema
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== 'NOTIFY');
  
  console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
  
  let executed = 0;
  let failed = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i] + ';';
    
    if (cmd.trim() === ';') continue;
    
    console.log(`${i+1}/${commands.length}: ${cmd.substring(0, 50)}...`);
    
    try {
      // Usar la Function API de Supabase para ejecutar SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: cmd
        })
      });
      
      if (response.ok) {
        console.log(`  ✅ Ejecutado`);
        executed++;
      } else {
        console.log(`  ⚠️ Error: ${response.status} ${response.statusText}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
      failed++;
    }
    
    // Pequeña pausa entre comandos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Resumen: ${executed} ejecutados, ${failed} fallidos`);
  
  if (executed > 0) {
    console.log('✅ Algunos comandos ejecutados con éxito');
  }
}

executeSQL().catch(console.error);