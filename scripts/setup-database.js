#!/usr/bin/env node
/**
 * 🗄️ Auto-Setup Database Schema
 * 
 * Ejecuta automáticamente el schema completo en Supabase
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️ Configurando Base de Datos Automáticamente...\n');
  
  // 1. Verificar credenciales
  const supabaseUrl = process.env.SUPABASE_DAO_URL;
  const serviceKey = process.env.SUPABASE_DAO_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: Falta configuración de Supabase');
    console.log('Verifica que .env.local tenga:');
    console.log('- SUPABASE_DAO_URL');
    console.log('- SUPABASE_DAO_SERVICE_KEY');
    process.exit(1);
  }
  
  console.log('✅ Credenciales de Supabase encontradas');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  // 2. Leer el schema SQL
  const schemaPath = path.join(__dirname, '../supabase/schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Error: No se encuentra ${schemaPath}`);
    process.exit(1);
  }
  
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  console.log('✅ Schema SQL cargado');
  console.log(`📄 Tamaño: ${schemaSQL.length} caracteres`);
  
  // 3. Ejecutar el schema via API REST
  console.log('\n🚀 Ejecutando schema en Supabase...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        sql: schemaSQL 
      })
    });
    
    if (!response.ok) {
      // Intentar método alternativo usando la API de administración
      console.log('⚠️ Método 1 falló, probando método 2...');
      
      const adminResponse = await fetch(`${supabaseUrl}/database/query`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: schemaSQL 
        })
      });
      
      if (!adminResponse.ok) {
        // Método 3: Ejecutar via psql si está disponible
        console.log('⚠️ Método 2 falló, probando método 3 (psql)...');
        
        const { execSync } = require('child_process');
        
        // Extraer datos de conexión de la URL
        const url = new URL(supabaseUrl);
        const dbUrl = `postgresql://postgres.pwajikcybnicshuqlybo:${process.env.SUPABASE_DB_PASSWORD || 'REPLACE_WITH_PASSWORD'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
        
        // Escribir SQL a archivo temporal
        const tempFile = '/tmp/schema_temp.sql';
        fs.writeFileSync(tempFile, schemaSQL);
        
        try {
          execSync(`psql "${dbUrl}" -f "${tempFile}"`, { stdio: 'pipe' });
          console.log('✅ Schema ejecutado via psql');
        } catch (error) {
          console.log('⚠️ psql no disponible, necesitarás ejecutar manualmente');
          console.log('\n📋 INSTRUCCIONES MANUALES:');
          console.log('1. Ve a https://supabase.com/dashboard');
          console.log('2. Abre tu proyecto "cryptogift-dao"');
          console.log('3. Ve a SQL Editor');
          console.log('4. Crea una nueva consulta');
          console.log('5. Copia y pega COMPLETO el contenido de supabase/schema.sql');
          console.log('6. Haz click en "RUN" para ejecutar');
          
          return false;
        }
      } else {
        console.log('✅ Schema ejecutado via método 2');
      }
    } else {
      console.log('✅ Schema ejecutado via método 1');
    }
    
    console.log('\n🎉 Base de datos configurada exitosamente!');
    
    // 4. Verificar que las tablas se crearon
    console.log('\n🔍 Verificando tablas creadas...');
    
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?select=count`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (verifyResponse.ok) {
      console.log('✅ Tabla "tasks" disponible');
    } else {
      console.log('⚠️ No se pudo verificar la tabla "tasks"');
    }
    
    console.log('\n🎯 Siguiente paso: Poblar las 34 tareas predefinidas');
    console.log('Ejecuta: node scripts/init-dao-tasks.js');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error ejecutando schema:', error.message);
    console.log('\n📋 FALLBACK - INSTRUCCIONES MANUALES:');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Abre tu proyecto "cryptogift-dao"');  
    console.log('3. Ve a "SQL Editor" en el menú lateral');
    console.log('4. Haz click en "New query"');
    console.log('5. Copia TODO el contenido de supabase/schema.sql');
    console.log('6. Pégalo en el editor y haz click "RUN"');
    console.log('7. Deberías ver "Success. No rows returned"');
    
    return false;
  }
}

// Ejecutar
setupDatabase().then(success => {
  if (success) {
    console.log('\n🚀 Listo para el siguiente paso!');
  } else {
    console.log('\n⚠️ Completar setup manualmente según las instrucciones');
  }
}).catch(console.error);