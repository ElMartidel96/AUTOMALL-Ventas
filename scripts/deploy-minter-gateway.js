/**
 * 🔐 DEPLOY MINTER GATEWAY SYSTEM v3.3
 *
 * Despliega TimelockController + MinterGateway para CGC Token
 *
 * RUNBOOK ACTIONS:
 * - ACTION 1: Deploy TimelockController (7 days delay)
 * - ACTION 2: Deploy MinterGateway (owner=Safe 3/5, guardian=Safe 2/3)
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// ═══════════════════════════════════════════════════════════════════════
// ADDRESSES (Base Mainnet)
// ═══════════════════════════════════════════════════════════════════════

const CGC_TOKEN_ADDRESS = "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175";
const DAO_ARAGON_ADDRESS = "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31";
const MILESTONE_ESCROW_ADDRESS = "0x8346CFcaECc90d678d862319449E5a742c03f109";

// Gnosis Safe Multisigs
const SAFE_OWNER_ADDRESS = "0x11323672b5f9bB899Fa332D5d464CC4e66637b42"; // 3/5 (actualmente 3/4)
const SAFE_GUARDIAN_ADDRESS = "0xe9411DD1f2AF42186b2bCE828B6e7d0dd0D7a6bc"; // 2/3

// Timelock config
const MIN_DELAY = 7 * 24 * 60 * 60; // 7 days in seconds

// ABI for CGC Token (minimal)
const CGC_TOKEN_ABI = [
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function minters(address) external view returns (bool)"
];

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║       🔐 MINTER GATEWAY DEPLOYMENT v3.3                          ║");
  console.log("║       Base Mainnet - CryptoGift DAO                              ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.001"))) {
    console.error("❌ Balance insuficiente para deployment");
    process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRE-CHECK: Verify CGC Token
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n📋 PRE-CHECK: Verificando CGC Token...");

  const CGCToken = new ethers.Contract(CGC_TOKEN_ADDRESS, CGC_TOKEN_ABI, deployer);

  const decimals = await CGCToken.decimals();
  console.log("   Decimals:", decimals.toString());
  if (decimals !== 18) {
    console.error("❌ Decimals no es 18!");
    process.exit(1);
  }

  const currentSupply = await CGCToken.totalSupply();
  console.log("   Total Supply:", ethers.utils.formatUnits(currentSupply, 18), "CGC");

  const maxSupply = ethers.BigNumber.from("22000000").mul(ethers.BigNumber.from("10").pow(18));
  const remainingMintable = maxSupply.sub(currentSupply);
  console.log("   Mintable via Gateway:", ethers.utils.formatUnits(remainingMintable, 18), "CGC");
  console.log("✅ PRE-CHECK pasado\n");

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION 1: Deploy TimelockController
  // ═══════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("ACTION 1: Deploying TimelockController (7 días delay)...");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const TimelockController = await ethers.getContractFactory("TimelockController");

  // Constructor params:
  // - minDelay: 7 days
  // - proposers: [DAO Aragon]
  // - executors: [DAO Aragon]
  // - admin: address(0) - no admin
  const timelock = await TimelockController.deploy(
    MIN_DELAY,
    [DAO_ARAGON_ADDRESS],
    [DAO_ARAGON_ADDRESS],
    ethers.constants.AddressZero
  );

  await timelock.deployed();
  const timelockAddress = timelock.address;

  console.log("✅ TimelockController deployed!");
  console.log("   Address:", timelockAddress);
  console.log("   Min Delay:", MIN_DELAY, "seconds (7 days)");
  console.log("   Proposer:", DAO_ARAGON_ADDRESS);
  console.log("   Executor:", DAO_ARAGON_ADDRESS);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION 2: Deploy MinterGateway
  // ═══════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("ACTION 2: Deploying MinterGateway v3.3...");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const MinterGateway = await ethers.getContractFactory("MinterGateway");

  // Constructor params:
  // - cgcToken: CGC address
  // - owner: Safe 3/5 (respuesta rápida)
  // - guardian: Safe 2/3 (puede pausar)
  const gateway = await MinterGateway.deploy(
    CGC_TOKEN_ADDRESS,
    SAFE_OWNER_ADDRESS,
    SAFE_GUARDIAN_ADDRESS
  );

  await gateway.deployed();
  const gatewayAddress = gateway.address;

  console.log("✅ MinterGateway deployed!");
  console.log("   Address:", gatewayAddress);
  console.log("   CGC Token:", CGC_TOKEN_ADDRESS);
  console.log("   Owner (Safe 3/5):", SAFE_OWNER_ADDRESS);
  console.log("   Guardian (Safe 2/3):", SAFE_GUARDIAN_ADDRESS);
  console.log("");

  // Verify gateway state
  const initialSupply = await gateway.initialSupplyAtDeployment();
  const maxMintable = await gateway.maxMintableViaGateway();

  console.log("📊 Gateway State:");
  console.log("   Initial Supply at Deploy:", ethers.utils.formatUnits(initialSupply, 18), "CGC");
  console.log("   Max Mintable via Gateway:", ethers.utils.formatUnits(maxMintable, 18), "CGC");
  console.log("   MAX_TOTAL_SUPPLY:", "22,000,000 CGC");
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                    📋 DEPLOYMENT COMPLETE                        ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log(`║ TimelockController: ${timelockAddress} ║`);
  console.log(`║ MinterGateway:      ${gatewayAddress} ║`);
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION 3: MANUAL STEPS (Batch atómico via Gnosis Safe)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║           ⚠️  ACCIONES MANUALES REQUERIDAS                       ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║                                                                  ║");
  console.log("║  ACTION 3: BATCH ATÓMICO EN GNOSIS SAFE                         ║");
  console.log("║  ─────────────────────────────────────────────────────────────── ║");
  console.log("║  Ejecutar estas 4 llamadas como MULTICALL desde DAO Aragon:     ║");
  console.log("║                                                                  ║");
  console.log(`║  1. cgcToken.addMinter(${gatewayAddress})   ║`);
  console.log(`║  2. cgcToken.removeMinter(${MILESTONE_ESCROW_ADDRESS})   ║`);
  console.log(`║  3. cgcToken.removeMinter(${deployer.address})   ║`);
  console.log(`║  4. cgcToken.transferOwnership(${timelockAddress})   ║`);
  console.log("║                                                                  ║");
  console.log("║  IMPORTANTE: Ejecutar TODAS juntas como batch atómico!         ║");
  console.log("║                                                                  ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log("║                                                                  ║");
  console.log("║  ACTION 5: AÑADIR AUTHORIZED CALLERS (después de ACTION 3)     ║");
  console.log("║  ─────────────────────────────────────────────────────────────── ║");
  console.log("║  Desde Safe Owner (3/5):                                        ║");
  console.log("║                                                                  ║");
  console.log(`║  gateway.addAuthorizedCaller(<rewards_system_address>)         ║`);
  console.log("║                                                                  ║");
  console.log("║  ⚠️  SIN ESTE PASO, NINGÚN SISTEMA PUEDE MINTEAR!              ║");
  console.log("║                                                                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════════════════════════════════════
  // VERIFICATION CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════
  console.log("📋 VERIFICATION CHECKLIST (ACTION 4):");
  console.log("   [ ] gateway.cgcToken() == " + CGC_TOKEN_ADDRESS);
  console.log("   [ ] gateway.owner() == " + SAFE_OWNER_ADDRESS);
  console.log("   [ ] gateway.guardian() == " + SAFE_GUARDIAN_ADDRESS);
  console.log("   [ ] gateway.initialSupplyAtDeployment() == " + ethers.utils.formatUnits(initialSupply, 18) + " CGC");
  console.log("   [ ] cgcToken.minters(gateway) == true (después de ACTION 3)");
  console.log("   [ ] cgcToken.minters(escrow) == false (después de ACTION 3)");
  console.log("   [ ] cgcToken.owner() == timelock (después de ACTION 3)");
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════
  // ENV VARIABLES TO UPDATE
  // ═══════════════════════════════════════════════════════════════════════
  console.log("📝 ACTUALIZAR EN .env.local Y .env.dao:");
  console.log(`   TIMELOCK_CONTROLLER_ADDRESS=${timelockAddress}`);
  console.log(`   MINTER_GATEWAY_ADDRESS=${gatewayAddress}`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════
  // BASESCAN LINKS
  // ═══════════════════════════════════════════════════════════════════════
  console.log("🔗 BASESCAN LINKS:");
  console.log(`   TimelockController: https://basescan.org/address/${timelockAddress}`);
  console.log(`   MinterGateway: https://basescan.org/address/${gatewayAddress}`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════
  // VERIFY CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log("🔍 Verificando contratos en BaseScan...\n");

  try {
    console.log("Verificando TimelockController...");
    await hre.run("verify:verify", {
      address: timelockAddress,
      constructorArguments: [
        MIN_DELAY,
        [DAO_ARAGON_ADDRESS],
        [DAO_ARAGON_ADDRESS],
        ethers.constants.AddressZero
      ],
    });
    console.log("✅ TimelockController verificado!\n");
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("✅ TimelockController ya estaba verificado\n");
    } else {
      console.log("⚠️  Error verificando TimelockController:", error.message);
    }
  }

  try {
    console.log("Verificando MinterGateway...");
    await hre.run("verify:verify", {
      address: gatewayAddress,
      constructorArguments: [
        CGC_TOKEN_ADDRESS,
        SAFE_OWNER_ADDRESS,
        SAFE_GUARDIAN_ADDRESS
      ],
    });
    console.log("✅ MinterGateway verificado!\n");
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("✅ MinterGateway ya estaba verificado\n");
    } else {
      console.log("⚠️  Error verificando MinterGateway:", error.message);
    }
  }

  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                    🎉 DEPLOYMENT EXITOSO                         ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // Return addresses for programmatic use
  return {
    timelockAddress,
    gatewayAddress,
    cgcToken: CGC_TOKEN_ADDRESS,
    safeOwner: SAFE_OWNER_ADDRESS,
    safeGuardian: SAFE_GUARDIAN_ADDRESS,
    initialSupply: ethers.utils.formatUnits(initialSupply, 18),
    maxMintable: ethers.utils.formatUnits(maxMintable, 18)
  };
}

main()
  .then((result) => {
    console.log("📊 RESULTADO JSON:");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ ERROR CRÍTICO:", error);
    process.exit(1);
  });
