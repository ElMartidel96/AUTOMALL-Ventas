#!/usr/bin/env node
/**
 * 🚀 DEPLOYMENT CON PNPM - MÉTODO OFICIAL
 * Este es nuestro método estándar para todo el proyecto
 */

const { spawn } = require('child_process');
const colors = {
  bright: '\x1b[1m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', reset: '\x1b[0m'
};

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}🔄 Ejecutando: pnpm ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn('pnpm', [command, ...args], {
      stdio: 'inherit',
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✅ Comando exitoso: pnpm ${command}${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}❌ Error en comando: pnpm ${command} (código: ${code})${colors.reset}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`${colors.red}❌ Error ejecutando comando: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

async function deployWithPnpm() {
  console.log(`${colors.bright}${colors.cyan}🚀 DEPLOYMENT OFICIAL CON PNPM${colors.reset}`);
  console.log('═'.repeat(50));
  
  try {
    // 1. Instalar dependencias
    console.log(`\n${colors.yellow}📦 Instalando dependencias...${colors.reset}`);
    await runCommand('install');
    
    // 2. Compilar contratos
    console.log(`\n${colors.yellow}🔨 Compilando contratos...${colors.reset}`);
    await runCommand('exec', ['hardhat', 'compile']);
    
    // 3. Deployment
    console.log(`\n${colors.yellow}🚀 Desplegando a Base Mainnet...${colors.reset}`);
    await runCommand('exec', ['hardhat', 'run', 'scripts/deploy-production-final.js', '--network', 'base']);
    
    // 4. Verificación
    console.log(`\n${colors.yellow}🔍 Verificando deployment...${colors.reset}`);
    await runCommand('exec', ['node', 'scripts/verify-contracts-external.js']);
    
    console.log(`\n${colors.bright}${colors.green}🎉 DEPLOYMENT COMPLETADO CON PNPM${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}💥 Error en deployment: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// CLI
const command = process.argv[2];
switch (command) {
  case 'deploy':
    deployWithPnpm();
    break;
  case 'compile':
    runCommand('exec', ['hardhat', 'compile']);
    break;
  case 'install':
    runCommand('install');
    break;
  case 'test':
    runCommand('exec', ['hardhat', 'test']);
    break;
  default:
    console.log(`${colors.yellow}Comandos disponibles:${colors.reset}`);
    console.log('  node scripts/pnpm-deployment.js deploy   - Deployment completo');
    console.log('  node scripts/pnpm-deployment.js compile  - Solo compilar');
    console.log('  node scripts/pnpm-deployment.js install  - Solo instalar deps');
    console.log('  node scripts/pnpm-deployment.js test     - Ejecutar tests');
}

module.exports = { runCommand, deployWithPnpm };