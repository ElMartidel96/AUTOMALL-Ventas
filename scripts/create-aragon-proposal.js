#!/usr/bin/env node
/**
 * 🏛️ CREAR PROPUESTA EN ARAGON DAO - MinterGateway v3.3
 *
 * Script para crear la propuesta de configuración del MinterGateway
 * de forma programática usando el Token Voting Plugin.
 *
 * ACCIONES DE LA PROPUESTA:
 * 1. CGCToken.addMinter(Gateway)       - Gateway puede mintear
 * 2. CGCToken.removeMinter(Escrow)     - Escrow ya no puede
 * 3. CGCToken.removeMinter(Deployer)   - Deployer ya no puede
 * 4. CGCToken.transferOwnership(Timelock) - Control al Timelock
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// ═══════════════════════════════════════════════════════════════════════
// ADDRESSES - DATOS EXACTOS DEL DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════

const ADDRESSES = {
  // DAO Aragon
  DAO_ARAGON: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  TOKEN_VOTING_PLUGIN: "0x5ADD5dc0a677dbB48fAC5e1DE4ca336d40B161a2",

  // CGC Token (target de las acciones)
  CGC_TOKEN: "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175",

  // Nuevos contratos desplegados (13 DIC 2025)
  MINTER_GATEWAY: "0xdd10540847a4495e21f01230a0d39C7c6785598F",
  TIMELOCK_CONTROLLER: "0x9753d772C632e2d117b81d96939B878D74fB5166",

  // A eliminar como minters
  MILESTONE_ESCROW: "0x8346CFcaECc90d678d862319449E5a742c03f109",
  DEPLOYER: "0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6"
};

// Token Voting Plugin ABI
const TOKEN_VOTING_ABI = [
  "function createProposal(bytes _metadata, tuple(address to, uint256 value, bytes data)[] _actions, uint256 _allowFailureMap, uint64 _startDate, uint64 _endDate, uint8 _voteOption, bool _tryEarlyExecution) external returns (uint256 proposalId)",
  "function minProposerVotingPower() external view returns (uint256)",
  "function proposalCount() external view returns (uint256)",
  "function vote(uint256 _proposalId, uint8 _voteOption, bool _tryEarlyExecution) external",
  "function getProposal(uint256 _proposalId) external view returns (bool open, bool executed, tuple(uint16 supportThreshold, uint16 minParticipation, uint64 startDate, uint64 endDate, uint64 snapshotBlock, uint256 minApproval) parameters, tuple(uint256 yes, uint256 no, uint256 abstain) tally, tuple(address to, uint256 value, bytes data)[] actions, uint256 allowFailureMap)"
];

// CGC Token ABI
const CGC_TOKEN_ABI = [
  "function addMinter(address minter) external",
  "function removeMinter(address minter) external",
  "function transferOwnership(address newOwner) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function minters(address) external view returns (bool)",
  "function owner() external view returns (address)"
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║       🏛️ CREAR PROPUESTA EN ARAGON DAO                           ║");
  console.log("║       Configure MinterGateway v3.3 - Supply Cap System           ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📍 Proposer:", signer.address);

  // ═══════════════════════════════════════════════════════════════════════
  // PRE-CHECKS
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n📋 PRE-CHECKS...\n");

  // Check CGC balance
  const cgcToken = new ethers.Contract(ADDRESSES.CGC_TOKEN, CGC_TOKEN_ABI, signer);
  const balance = await cgcToken.balanceOf(signer.address);
  console.log("   CGC Balance:", ethers.utils.formatUnits(balance, 18), "CGC");

  // Check min proposer power
  const tokenVoting = new ethers.Contract(ADDRESSES.TOKEN_VOTING_PLUGIN, TOKEN_VOTING_ABI, signer);
  const minPower = await tokenVoting.minProposerVotingPower();
  console.log("   Min Proposer Power:", ethers.utils.formatUnits(minPower, 18), "CGC");

  if (balance.lt(minPower)) {
    console.error("❌ Balance insuficiente para crear propuesta");
    process.exit(1);
  }
  console.log("   ✅ Balance suficiente para proponer");

  // Check current state
  const currentOwner = await cgcToken.owner();
  console.log("   Current CGC Owner:", currentOwner);

  const escrowIsMinter = await cgcToken.minters(ADDRESSES.MILESTONE_ESCROW);
  console.log("   Escrow is minter:", escrowIsMinter);

  console.log("\n✅ Pre-checks pasados\n");

  // ═══════════════════════════════════════════════════════════════════════
  // ENCODE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log("📝 Codificando 4 acciones...\n");

  const cgcInterface = new ethers.utils.Interface(CGC_TOKEN_ABI);

  // Action 1: addMinter(Gateway)
  const action1 = {
    to: ADDRESSES.CGC_TOKEN,
    value: 0,
    data: cgcInterface.encodeFunctionData("addMinter", [ADDRESSES.MINTER_GATEWAY])
  };
  console.log("   1. addMinter(Gateway)");
  console.log("      Target:", ADDRESSES.CGC_TOKEN);
  console.log("      Calldata:", action1.data);

  // Action 2: removeMinter(Escrow)
  const action2 = {
    to: ADDRESSES.CGC_TOKEN,
    value: 0,
    data: cgcInterface.encodeFunctionData("removeMinter", [ADDRESSES.MILESTONE_ESCROW])
  };
  console.log("   2. removeMinter(Escrow)");
  console.log("      Calldata:", action2.data);

  // Action 3: removeMinter(Deployer)
  const action3 = {
    to: ADDRESSES.CGC_TOKEN,
    value: 0,
    data: cgcInterface.encodeFunctionData("removeMinter", [ADDRESSES.DEPLOYER])
  };
  console.log("   3. removeMinter(Deployer)");
  console.log("      Calldata:", action3.data);

  // Action 4: transferOwnership(Timelock)
  const action4 = {
    to: ADDRESSES.CGC_TOKEN,
    value: 0,
    data: cgcInterface.encodeFunctionData("transferOwnership", [ADDRESSES.TIMELOCK_CONTROLLER])
  };
  console.log("   4. transferOwnership(Timelock)");
  console.log("      Calldata:", action4.data);

  const actions = [action1, action2, action3, action4];
  console.log("\n✅ 4 acciones codificadas\n");

  // ═══════════════════════════════════════════════════════════════════════
  // PROPOSAL METADATA
  // ═══════════════════════════════════════════════════════════════════════
  const metadataObj = {
    title: "Configure MinterGateway v3.3 - Supply Cap System",
    summary: "This proposal configures the MinterGateway system for controlled CGC minting with a 22M supply cap.",
    description: `## Propuesta: Configurar Sistema MinterGateway v3.3

### Objetivo
Implementar el sistema de minting controlado con cap de 22M CGC.

### Acciones
1. **Añadir MinterGateway como minter autorizado**
   - Address: ${ADDRESSES.MINTER_GATEWAY}
   - El Gateway tiene cap de 22M tokens total

2. **Remover MilestoneEscrow como minter**
   - Address: ${ADDRESSES.MILESTONE_ESCROW}
   - Este contrato nunca usa mint(), solo transfer()

3. **Remover Deployer como minter**
   - Address: ${ADDRESSES.DEPLOYER}
   - Ya no es necesario

4. **Transferir ownership al TimelockController**
   - Address: ${ADDRESSES.TIMELOCK_CONTROLLER}
   - Delay de 7 días para cambios futuros

### Resultado
Después de la ejecución:
- Gateway será el ÚNICO minter con cap de 22M
- Timelock protegerá cambios con delay de 7 días
- DAO mantiene control via governance`,
    resources: [
      { name: "MinterGateway (BaseScan)", url: `https://basescan.org/address/${ADDRESSES.MINTER_GATEWAY}` },
      { name: "TimelockController (BaseScan)", url: `https://basescan.org/address/${ADDRESSES.TIMELOCK_CONTROLLER}` }
    ]
  };

  const metadata = ethers.utils.toUtf8Bytes(JSON.stringify(metadataObj));

  console.log("📄 Metadata:");
  console.log("   Title:", metadataObj.title);
  console.log("   Summary:", metadataObj.summary.slice(0, 60) + "...\n");

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE PROPOSAL
  // ═══════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🚀 Creando propuesta en Token Voting Plugin...");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  // Proposal parameters
  const allowFailureMap = 0; // Ninguna acción puede fallar
  const startDate = 0; // Iniciar inmediatamente
  const endDate = 0; // Usar duración por defecto del plugin
  const voteOption = 2; // 0=None, 1=Abstain, 2=Yes, 3=No - Votar YES automáticamente
  const tryEarlyExecution = true; // Ejecutar si pasa antes

  try {
    console.log("📤 Enviando transacción...");

    const tx = await tokenVoting.createProposal(
      metadata,
      actions,
      allowFailureMap,
      startDate,
      endDate,
      voteOption,
      tryEarlyExecution,
      {
        gasLimit: 2000000 // Gas limit explícito
      }
    );

    console.log("   TX Hash:", tx.hash);
    console.log("⏳ Esperando confirmación...\n");

    const receipt = await tx.wait();
    console.log("✅ Transacción confirmada!");
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Buscar evento ProposalCreated
    let proposalId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = tokenVoting.interface.parseLog(log);
        if (parsed.name === "ProposalCreated") {
          proposalId = parsed.args.proposalId;
          break;
        }
      } catch (e) {
        // Log de otro contrato, ignorar
      }
    }

    if (proposalId) {
      console.log("\n╔══════════════════════════════════════════════════════════════════╗");
      console.log("║               🎉 PROPUESTA CREADA EXITOSAMENTE                   ║");
      console.log("╠══════════════════════════════════════════════════════════════════╣");
      console.log(`║ Proposal ID: ${proposalId.toString().padEnd(48)} ║`);
      console.log("╚══════════════════════════════════════════════════════════════════╝\n");

      console.log("🔗 URL DE LA PROPUESTA:");
      console.log(`   https://app.aragon.org/dao/base-mainnet/${ADDRESSES.DAO_ARAGON}/proposals/${proposalId.toString()}\n`);
    } else {
      console.log("\n✅ Propuesta creada (ID no encontrado en logs)");
      console.log("   Verifica en: https://app.aragon.org/dao/base-mainnet/" + ADDRESSES.DAO_ARAGON + "/proposals\n");
    }

    console.log("📋 SIGUIENTE PASO:");
    console.log("   Tu voto YES ya fue registrado automáticamente.");
    console.log("   Espera a que termine el periodo de votación para ejecutar.\n");

  } catch (error) {
    console.error("\n❌ Error creando propuesta:", error.message);

    if (error.data) {
      console.log("\n📋 Error data:", error.data);
    }

    if (error.reason) {
      console.log("📋 Reason:", error.reason);
    }

    // Crear archivo para propuesta manual
    console.log("\n═══════════════════════════════════════════════════════════════════");
    console.log("📝 Generando datos para PROPUESTA MANUAL...");
    console.log("═══════════════════════════════════════════════════════════════════\n");

    console.log("Ve a: https://app.aragon.org/dao/base-mainnet/" + ADDRESSES.DAO_ARAGON + "/new-proposal\n");

    console.log("ACCIÓN 1 - addMinter:");
    console.log("   Target:", ADDRESSES.CGC_TOKEN);
    console.log("   Calldata:", action1.data);

    console.log("\nACCIÓN 2 - removeMinter (Escrow):");
    console.log("   Target:", ADDRESSES.CGC_TOKEN);
    console.log("   Calldata:", action2.data);

    console.log("\nACCIÓN 3 - removeMinter (Deployer):");
    console.log("   Target:", ADDRESSES.CGC_TOKEN);
    console.log("   Calldata:", action3.data);

    console.log("\nACCIÓN 4 - transferOwnership:");
    console.log("   Target:", ADDRESSES.CGC_TOKEN);
    console.log("   Calldata:", action4.data);

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR CRÍTICO:", error);
    process.exit(1);
  });
