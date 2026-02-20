/**
 * 🔍 VERIFICACIÓN DE CONTRATOS EN BASESCAN
 *
 * Script profesional para verificar TimelockController y MinterGateway
 * usando los argumentos EXACTOS del deployment original.
 *
 * Datos extraídos de: scripts/deploy-minter-gateway.js
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// ═══════════════════════════════════════════════════════════════════════
// DATOS EXACTOS DEL DEPLOYMENT (13 DIC 2025)
// ═══════════════════════════════════════════════════════════════════════

const CONTRACTS = {
  TimelockController: {
    address: "0x9753d772C632e2d117b81d96939B878D74fB5166",
    constructorArgs: [
      604800, // minDelay: 7 días en segundos
      ["0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"], // proposers: DAO Aragon
      ["0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"], // executors: DAO Aragon
      "0x0000000000000000000000000000000000000000"  // admin: address(0)
    ]
  },
  MinterGateway: {
    address: "0xdd10540847a4495e21f01230a0d39C7c6785598F",
    constructorArgs: [
      "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175", // _cgcToken
      "0x11323672b5f9bB899Fa332D5d464CC4e66637b42", // _owner (Safe 3/5)
      "0xe9411DD1f2AF42186b2bCE828B6e7d0dd0D7a6bc"  // _guardian (Safe 2/3)
    ],
    contract: "contracts/core/MinterGateway.sol:MinterGateway"
  }
};

// ═══════════════════════════════════════════════════════════════════════
// VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════

async function verifyContract(name, config) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`🔍 Verificando ${name}...`);
  console.log(`   Address: ${config.address}`);
  console.log(`${"═".repeat(70)}\n`);

  try {
    const verifyArgs = {
      address: config.address,
      constructorArguments: config.constructorArgs,
    };

    // Si tiene contract path específico, añadirlo
    if (config.contract) {
      verifyArgs.contract = config.contract;
    }

    await hre.run("verify:verify", verifyArgs);

    console.log(`✅ ${name} VERIFICADO EXITOSAMENTE!\n`);
    return { success: true, name };
  } catch (error) {
    if (error.message.includes("Already Verified") ||
        error.message.includes("already verified") ||
        error.message.includes("Successfully verified")) {
      console.log(`✅ ${name} ya estaba verificado\n`);
      return { success: true, name, alreadyVerified: true };
    }

    console.error(`❌ Error verificando ${name}:`, error.message);
    return { success: false, name, error: error.message };
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║       🔍 VERIFICACIÓN DE CONTRATOS - BASESCAN                    ║");
  console.log("║       CryptoGift DAO - MinterGateway System v3.3                 ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  console.log("📋 Configuración del Compilador:");
  console.log("   - Solidity: 0.8.20");
  console.log("   - Optimization: enabled (200 runs)");
  console.log("   - EVM Version: cancun\n");

  const results = [];

  // Verificar TimelockController
  results.push(await verifyContract("TimelockController", CONTRACTS.TimelockController));

  // Verificar MinterGateway
  results.push(await verifyContract("MinterGateway", CONTRACTS.MinterGateway));

  // Resumen
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                      📊 RESUMEN                                  ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");

  for (const result of results) {
    const status = result.success ? "✅" : "❌";
    const note = result.alreadyVerified ? " (ya verificado)" : "";
    console.log(`║ ${status} ${result.name.padEnd(25)} ${note.padEnd(25)} ║`);
  }

  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Links de BaseScan
  console.log("🔗 LINKS DE VERIFICACIÓN:");
  console.log(`   TimelockController: https://basescan.org/address/${CONTRACTS.TimelockController.address}#code`);
  console.log(`   MinterGateway: https://basescan.org/address/${CONTRACTS.MinterGateway.address}#code`);
  console.log("");

  // Verificar si todos fueron exitosos
  const allSuccess = results.every(r => r.success);
  if (!allSuccess) {
    console.log("⚠️  Algunos contratos no pudieron ser verificados.");
    console.log("   Revisa los errores arriba y considera verificación manual.\n");
    process.exit(1);
  }

  console.log("🎉 ¡VERIFICACIÓN COMPLETA!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR CRÍTICO:", error);
    process.exit(1);
  });
