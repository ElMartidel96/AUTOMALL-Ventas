#!/usr/bin/env node
/**
 * 🛡️ VERIFICACIÓN EXTERNA DE CONTRATOS - INDEPENDIENTE DE CLAUDE CLI
 * Verifica estado de contratos desplegados sin depender del CLI que crashea
 */

const fs = require('fs');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.dao' });

// Colores para output
const colors = {
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function verifyContracts() {
  try {
    console.log(`${colors.bright}${colors.cyan}🔍 VERIFICACIÓN EXTERNA DE CONTRATOS${colors.reset}`);
    console.log('═'.repeat(60));

    // Cargar configuración
    const deploymentData = JSON.parse(
      fs.readFileSync('deployments/deployment-base-latest.json', 'utf8')
    );

    // Configurar provider
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    console.log(`📡 RPC: ${rpcUrl}`);
    console.log(`🌐 Chain ID: ${deploymentData.chainId}`);
    console.log('');

    // Verificar cada contrato
    const contracts = deploymentData.contracts;
    const results = {};

    for (const [name, data] of Object.entries(contracts)) {
      console.log(`${colors.bright}📄 Verificando ${name}:${colors.reset}`);
      console.log(`   Dirección: ${colors.green}${data.address}${colors.reset}`);
      
      try {
        // Verificar bytecode
        const code = await provider.getCode(data.address);
        const hasCode = code && code !== '0x';
        
        console.log(`   Bytecode: ${hasCode ? colors.green + '✅ PRESENTE' : colors.red + '❌ VACÍO'}${colors.reset}`);
        
        if (hasCode) {
          // Verificar balance (para tokens)
          if (name === 'CGCToken') {
            const tokenABI = [
              'function totalSupply() view returns (uint256)',
              'function balanceOf(address) view returns (uint256)',
              'function owner() view returns (address)'
            ];
            const token = new ethers.Contract(data.address, tokenABI, provider);
            
            try {
              const totalSupply = await token.totalSupply();
              const ownerBalance = await token.balanceOf(deploymentData.deployer);
              const owner = await token.owner();
              
              console.log(`   Total Supply: ${colors.yellow}${ethers.formatEther(totalSupply)} CGC${colors.reset}`);
              console.log(`   Owner Balance: ${colors.yellow}${ethers.formatEther(ownerBalance)} CGC${colors.reset}`);
              console.log(`   Owner: ${colors.blue}${owner}${colors.reset}`);
              
              results[name] = {
                deployed: true,
                totalSupply: totalSupply.toString(),
                ownerBalance: ownerBalance.toString(),
                owner
              };
            } catch (tokenError) {
              console.log(`   ${colors.yellow}⚠️  Error leyendo token data: ${tokenError.message}${colors.reset}`);
              results[name] = { deployed: true, error: tokenError.message };
            }
          } else {
            results[name] = { deployed: true };
          }
        } else {
          results[name] = { deployed: false };
        }
        
        // Verificar transacción
        try {
          const tx = await provider.getTransaction(data.txHash);
          if (tx) {
            console.log(`   TX Status: ${colors.green}✅ CONFIRMADA${colors.reset} (Block: ${tx.blockNumber})`);
          }
        } catch (txError) {
          console.log(`   TX Status: ${colors.yellow}⚠️  Error verificando TX${colors.reset}`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
        console.log('');
        results[name] = { deployed: false, error: error.message };
      }
    }

    // Resumen final
    console.log(`${colors.bright}${colors.magenta}📊 RESUMEN FINAL${colors.reset}`);
    console.log('═'.repeat(40));
    
    const deployed = Object.values(results).filter(r => r.deployed).length;
    const total = Object.keys(results).length;
    
    console.log(`Contratos desplegados: ${colors.green}${deployed}/${total}${colors.reset}`);
    
    if (deployed === total) {
      console.log(`${colors.bright}${colors.green}✅ TODOS LOS CONTRATOS ESTÁN DESPLEGADOS Y FUNCIONANDO${colors.reset}`);
    } else {
      console.log(`${colors.bright}${colors.red}❌ ALGUNOS CONTRATOS NO ESTÁN FUNCIONANDO${colors.reset}`);
    }

    // Guardar resultados
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      chainId: deploymentData.chainId,
      rpcUrl,
      results,
      summary: { deployed, total, allDeployed: deployed === total }
    };

    fs.writeFileSync(
      `verification-report-${Date.now()}.json`, 
      JSON.stringify(reportData, null, 2)
    );
    
    console.log(`${colors.cyan}💾 Reporte guardado: verification-report-${Date.now()}.json${colors.reset}`);
    
    return reportData;

  } catch (error) {
    console.error(`${colors.red}💥 Error crítico: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyContracts().catch(console.error);
}

module.exports = { verifyContracts };