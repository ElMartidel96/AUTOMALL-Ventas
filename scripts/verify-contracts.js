/**
 * Script para verificar contratos en BaseScan
 */
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando contratos en BaseScan...\n");

  // Addresses
  const TIMELOCK_ADDRESS = "0x9753d772C632e2d117b81d96939B878D74fB5166";
  const GATEWAY_ADDRESS = "0xdd10540847a4495e21f01230a0d39C7c6785598F";

  // Constructor args
  const DAO_ARAGON = "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31";
  const CGC_TOKEN = "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175";
  const SAFE_OWNER = "0x11323672b5f9bB899Fa332D5d464CC4e66637b42";
  const SAFE_GUARDIAN = "0xe9411DD1f2AF42186b2bCE828B6e7d0dd0D7a6bc";
  const MIN_DELAY = 604800; // 7 days

  // Verify TimelockController
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Verificando TimelockController...");
  console.log("Address:", TIMELOCK_ADDRESS);
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    await hre.run("verify:verify", {
      address: TIMELOCK_ADDRESS,
      constructorArguments: [
        MIN_DELAY,
        [DAO_ARAGON],
        [DAO_ARAGON],
        ethers.constants.AddressZero
      ],
    });
    console.log("✅ TimelockController verificado!\n");
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("✅ TimelockController ya estaba verificado\n");
    } else {
      console.log("⚠️  Error:", error.message);
    }
  }

  // Verify MinterGateway
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Verificando MinterGateway...");
  console.log("Address:", GATEWAY_ADDRESS);
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    await hre.run("verify:verify", {
      address: GATEWAY_ADDRESS,
      constructorArguments: [
        CGC_TOKEN,
        SAFE_OWNER,
        SAFE_GUARDIAN
      ],
    });
    console.log("✅ MinterGateway verificado!\n");
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log("✅ MinterGateway ya estaba verificado\n");
    } else {
      console.log("⚠️  Error:", error.message);
    }
  }

  console.log("🎉 Verificación completada!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ ERROR:", error);
    process.exit(1);
  });
