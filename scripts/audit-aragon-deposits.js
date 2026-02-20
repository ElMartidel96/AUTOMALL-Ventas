#!/usr/bin/env node
/**
 * 🔍 AUDITAR DEPÓSITOS ANÓMALOS EN ARAGON
 * Investigar por qué hay múltiples depósitos de 1M CGC
 */

const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config({ path: '.env.dao' });

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

async function auditAragonDeposits() {
  try {
    console.log(`${colors.bright}${colors.red}🔍 AUDITAR DEPÓSITOS ANÓMALOS EN ARAGON${colors.reset}`);
    console.log('═'.repeat(60));

    const deploymentData = JSON.parse(
      fs.readFileSync('deployments/deployment-base-latest.json', 'utf8')
    );

    const daoAddress = deploymentData.config.aragonDAO;
    const tokenAddress = deploymentData.contracts.CGCToken.address;

    console.log(`🏛️ DAO: ${colors.magenta}${daoAddress}${colors.reset}`);
    console.log(`📄 Token: ${colors.green}${tokenAddress}${colors.reset}`);
    console.log('');

    // Conectar al token
    const CGCToken = await hre.ethers.getContractAt("CGCToken", tokenAddress);
    
    console.log(`${colors.yellow}📊 ANÁLISIS DEL TOKEN:${colors.reset}`);
    
    const totalSupply = await CGCToken.totalSupply();
    const daoBalance = await CGCToken.balanceOf(daoAddress);
    
    console.log(`   Total Supply: ${colors.bright}${hre.ethers.formatEther(totalSupply)} CGC${colors.reset}`);
    console.log(`   DAO Balance: ${colors.magenta}${hre.ethers.formatEther(daoBalance)} CGC${colors.reset}`);
    
    // VERIFICACIÓN CRÍTICA
    const expectedSupply = hre.ethers.parseEther("1000000");
    if (totalSupply.toString() !== expectedSupply.toString()) {
      console.log(`${colors.red}🚨 ANOMALÍA: Supply no coincide${colors.reset}`);
      console.log(`   Esperado: 1,000,000 CGC`);
      console.log(`   Real: ${hre.ethers.formatEther(totalSupply)} CGC`);
    } else {
      console.log(`${colors.green}✅ Total Supply correcto${colors.reset}`);
    }

    if (daoBalance.toString() !== expectedSupply.toString()) {
      console.log(`${colors.red}🚨 ANOMALÍA: DAO Balance no coincide con supply${colors.reset}`);
      console.log(`   Supply: ${hre.ethers.formatEther(totalSupply)} CGC`);
      console.log(`   DAO Balance: ${hre.ethers.formatEther(daoBalance)} CGC`);
      console.log(`   Diferencia: ${hre.ethers.formatEther(totalSupply - daoBalance)} CGC`);
    } else {
      console.log(`${colors.green}✅ DAO tiene todo el supply${colors.reset}`);
    }

    console.log(`${colors.yellow}📋 OBTENER HISTORIAL DE TRANSFERS:${colors.reset}`);
    
    // Obtener eventos de Transfer
    const fromBlock = deploymentData.contracts.CGCToken.blockNumber;
    const filter = CGCToken.filters.Transfer();
    
    try {
      const events = await CGCToken.queryFilter(filter, fromBlock);
      
      console.log(`   Eventos encontrados: ${colors.bright}${events.length}${colors.reset}`);
      
      events.forEach((event, index) => {
        const { from, to, value } = event.args;
        const amount = hre.ethers.formatEther(value);
        
        console.log(`   ${index + 1}. ${colors.blue}Transfer${colors.reset}:`);
        console.log(`      From: ${colors.yellow}${from}${colors.reset}`);
        console.log(`      To: ${colors.magenta}${to}${colors.reset}`);
        console.log(`      Amount: ${colors.bright}${amount} CGC${colors.reset}`);
        console.log(`      Block: ${event.blockNumber}`);
        console.log('');
      });

      // Analizar los transfers
      const mintEvents = events.filter(event => event.args.from === hre.ethers.ZeroAddress);
      console.log(`${colors.cyan}📈 ANÁLISIS DE MINT EVENTS:${colors.reset}`);
      console.log(`   Mint events: ${colors.bright}${mintEvents.length}${colors.reset}`);
      
      if (mintEvents.length > 1) {
        console.log(`${colors.red}🚨 PROBLEMA: Múltiples mint events detectados${colors.reset}`);
        console.log(`   Esto explica los múltiples depósitos en Aragon`);
      } else if (mintEvents.length === 1) {
        console.log(`${colors.green}✅ Solo un mint event (correcto)${colors.reset}`);
        console.log(`   Pero Aragon muestra múltiples depósitos - posible bug de UI`);
      }

    } catch (eventError) {
      console.log(`   ${colors.red}❌ Error obteniendo eventos: ${eventError.message}${colors.reset}`);
    }

    console.log(`${colors.bright}${colors.cyan}🎯 CONCLUSIONES:${colors.reset}`);
    
    if (totalSupply.toString() === expectedSupply.toString() && daoBalance.toString() === expectedSupply.toString()) {
      console.log(`${colors.green}✅ Token está correcto técnicamente${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Múltiples depósitos en Aragon pueden ser:${colors.reset}`);
      console.log(`   1. Bug de UI de Aragon`);
      console.log(`   2. Múltiples transacciones de test`);
      console.log(`   3. Problema con la sincronización de eventos`);
    } else {
      console.log(`${colors.red}🚨 HAY UN PROBLEMA REAL CON EL TOKEN${colors.reset}`);
      console.log(`   Se necesita investigación más profunda`);
    }

    return {
      totalSupply: hre.ethers.formatEther(totalSupply),
      daoBalance: hre.ethers.formatEther(daoBalance),
      isCorrect: totalSupply.toString() === expectedSupply.toString(),
      multipleDepositsExplanation: "UI bug or multiple test transactions"
    };

  } catch (error) {
    console.error(`${colors.red}💥 Error en auditoría: ${error.message}${colors.reset}`);
    throw error;
  }
}

if (require.main === module) {
  auditAragonDeposits()
    .then((result) => {
      console.log('\n📊 Audit Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { auditAragonDeposits };