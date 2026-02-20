import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy CGC Token to Base Network
 * 
 * This script deploys the CGC governance token and transfers
 * the entire supply to the Aragon DAO treasury
 */

// Configuration - Must match your Aragon DAO
const DAO_ADDRESS = "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"; // Your Aragon DAO on Base

async function main() {
  console.log("🚀 Starting CGC Token deployment...");
  console.log("================================================");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient ETH balance for deployment");
  }
  
  // Verify DAO address
  console.log(`\n🏛️ DAO Address: ${DAO_ADDRESS}`);
  const daoCode = await ethers.provider.getCode(DAO_ADDRESS);
  if (daoCode === "0x") {
    throw new Error("DAO contract not found at specified address. Please verify the address.");
  }
  console.log("✅ DAO contract verified");
  
  // Deploy CGC Token
  console.log("\n📝 Deploying CGC Token...");
  const CGCToken = await ethers.getContractFactory("CGCToken");
  
  const estimatedGas = await ethers.provider.estimateGas({
    data: CGCToken.bytecode + 
      ethers.AbiCoder.defaultAbiCoder().encode(["address"], [DAO_ADDRESS]).slice(2)
  });
  console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
  
  const gasPrice = await ethers.provider.getFeeData();
  console.log(`⛽ Gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} gwei`);
  
  const estimatedCost = estimatedGas * (gasPrice.gasPrice || 0n);
  console.log(`💸 Estimated deployment cost: ${ethers.formatEther(estimatedCost)} ETH`);
  
  // Deploy with explicit gas settings
  const cgcToken = await CGCToken.deploy(DAO_ADDRESS, {
    gasLimit: estimatedGas * 120n / 100n, // 20% buffer
    gasPrice: gasPrice.gasPrice
  });
  
  console.log(`⏳ Transaction hash: ${cgcToken.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for confirmations...");
  
  // Wait for deployment
  await cgcToken.waitForDeployment();
  
  const tokenAddress = await cgcToken.getAddress();
  console.log(`\n✅ CGC Token deployed to: ${tokenAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  const name = await cgcToken.name();
  const symbol = await cgcToken.symbol();
  const decimals = await cgcToken.decimals();
  const totalSupply = await cgcToken.totalSupply();
  const daoBalance = await cgcToken.balanceOf(DAO_ADDRESS);
  
  console.log(`📌 Token Name: ${name}`);
  console.log(`📌 Token Symbol: ${symbol}`);
  console.log(`📌 Decimals: ${decimals}`);
  console.log(`📌 Total Supply: ${ethers.formatEther(totalSupply)} CGC`);
  console.log(`📌 DAO Balance: ${ethers.formatEther(daoBalance)} CGC`);
  
  // Verify DAO received all tokens
  if (totalSupply !== daoBalance) {
    throw new Error("DAO did not receive full token supply!");
  }
  console.log("✅ DAO successfully received entire token supply");
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      CGCToken: {
        address: tokenAddress,
        deployer: deployer.address,
        deploymentBlock: cgcToken.deploymentTransaction()?.blockNumber || 0,
        transactionHash: cgcToken.deploymentTransaction()?.hash || "",
        constructorArgs: [DAO_ADDRESS],
        verified: false
      }
    },
    dao: {
      address: DAO_ADDRESS,
      tokenBalance: ethers.formatEther(daoBalance)
    }
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment file
  const deploymentFile = path.join(deploymentsDir, `deployment-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment info saved to: ${deploymentFile}`);
  
  // Print summary
  console.log("\n================================================");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("================================================");
  console.log(`CGC Token: ${tokenAddress}`);
  console.log(`DAO Treasury: ${DAO_ADDRESS}`);
  console.log(`Total Supply: 1,000,000 CGC`);
  console.log("================================================");
  
  console.log("\n📋 Next steps:");
  console.log("1. Verify the contract on Basescan:");
  console.log(`   npx hardhat verify --network ${network.name} ${tokenAddress} "${DAO_ADDRESS}"`);
  console.log("2. Update .env with CGC_TOKEN_ADDRESS:");
  console.log(`   CGC_TOKEN_ADDRESS=${tokenAddress}`);
  console.log("3. Deploy the Vault contract:");
  console.log("   npx hardhat run scripts/deploy/01-deploy-vault.ts --network base");
  
  return tokenAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });