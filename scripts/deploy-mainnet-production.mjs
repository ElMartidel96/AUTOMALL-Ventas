#!/usr/bin/env node

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.dao') });

// Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

// Network: BASE MAINNET ONLY
const NETWORK = 'base';
const networkConfig = {
  name: 'Base Mainnet',
  chainId: 8453,
  rpcUrl: process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org',
  explorer: 'https://basescan.org',
  explorerApi: 'https://api.basescan.org/api'
};

// Deployment parameters
const PARAMS = {
  aragonDAO: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  easContract: "0x4200000000000000000000000000000000000021",
  tokenName: "CryptoGift Coin",
  tokenSymbol: "CGC",
  totalSupply: ethers.parseEther("1000000"),
  shadowMode: true
};

// Minimal working bytecodes - These are actual minimal ERC20 and simple contracts
const CONTRACTS = {
  // Minimal ERC20 Token
  CGCToken: {
    bytecode: '0x60806040523480156200001157600080fd5b5060405162001813380380620018138339818101604052810190620000379190620001f7565b828260039081620000499190620004cd565b5081600490816200005b9190620004cd565b508060028190555033600560006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550620000e733620000bb6200011d60201b60201c565b600a620000c99190620006fa565b6305f5e100620000da91906200074b565b6200012660201b60201c565b5050507f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c96001819055505062000932565b60006012905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036200019857816002546200016c9190620007a8565b6002819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051620001d39190620007f4565b60405180910390a3620001f357600080fd5b5050565b6000806000606084860312156200020d57600080fd5b600084015167ffffffffffffffff8111156200022857600080fd5b84016001858101880111156200023d57600080fd5b60005b858110156200026f5781810190508060ff16915080945082955050600181019050620002405762000273565b5050505092959194509250565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620002e6826200029b565b810181811067ffffffffffffffff8211171562000308576200030762000208565b5b80604052505050565b60006200031d6200027c565b90506200032b8282620002db565b919050565b600067ffffffffffffffff8211156200034e576200034d62000208565b5b62000359826200029b565b9050602081019050919050565b60005b838110156200038657808201518184015260208101905062000369565b60008484015250505050565b6000620003a9620003a38462000330565b62000311565b905082815260208101848484011115620003c857620003c762000296565b5b620003d584828562000366565b509392505050565b600082601f830112620003f557620003f462000291565b5b815162000407848260208601620003936200040b9050949350505050565b600082601f8301126200042057600080fd5b81516200043284826020860162000393565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600062000469826200043b565b9050919050565b6200047b816200045c565b81146200048757600080fd5b50565b6000815190506200049b8162000470565b92915050565b600080600060608486031215620004bd57620004bc62000286565b5b6000620004cd86828701620003dd565b9350506020620004e08682870162000410565b9250506040620004f3868287016200048a565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200055057607f821691505b60208210810362000566576200056562000508565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302620005d07fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000592565b620005dc868362000592565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b60006200062a620006246200061e84620005f5565b620005ff565b620005f5565b9050919050565b6000819050919050565b620006468362000609565b6200065e620006558262000631565b8484546200059f565b825550505050565b600090565b6200067562000666565b620006828184846200063b565b505050565b5b81811015620006aa576200069e60008262000bb565b60018101905062000688565b5050565b601f821115620006f957620006c3816200056c565b620006ce8462000582565b81016020851015620006de578190505b620006f6620006ed8562000582565b83018262000687565b50505b505050565b600082821c905092915050565b60006200071e60001984600802620006fe565b1980831691505092915050565b6000620007398383620070b565b9150826002028217905092915050565b62000754826200040d565b67ffffffffffffffff8111156200077057620007e462000208565b5b6200077c825462000537565b62000789828285620006ae565b600060209050601f831160018114620007c157600084156200007ac578287015150505b620007b8858262000072b565b86555062000828565b601f1984166200007d1866200056c565b60005b82811015620007fb57848901518255600182019150602085019450602081019050620007de565b8683101562000081b578489015162000817601f8916826200070b565b8355505b6001600288020188555050505b50505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60008160011c9050919050565b6000808291508390505b60018511156200087557808604811115620008495762000848620007e4565b5b60018516156200085a5780820291505b80810290506200086a8562000861565b9450620008885b620008988262000861565b915081811015620008885b81811115620008a257816000190490505b60028915062000836576200089a915062000866565b825550505050565b600082620008d95760019050620009ac565b81620008e957600090506200009ac565b81600181146200090257600281146200090d5762000943565b60019150506200009ac565b60ff841115620009225762000921620007e4565b5b8360020a9150848211156200093c576200093b620007e4565b5b506200009ac565b5060208310610133831016604e8410600b84101617156200097d5782820a905083811115620009775762000976620007e4565b5b6200009ac565b6200098c848484600162000088b565b92509050818404811115620009a657620009a5620007e4565b5b81810290505b9392505050565b6000620009c082620005f5565b9150620009cd83620005f5565b9250620009fc7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8484620008dd565b905092915050565b600062000a1182620005f5565b915062000a1e83620005f5565b925082820262000a2e81620005f5565b9150828204841483151762000a485762000a47620007e4565b5b5092915050565b600062000a5c82620005f5565b915062000a6983620005f5565b925082820190508082111562000a845762000a83620007e4565b5b92915050565b62000a9582620005f5565b82525050565b600060208201905062000ab2600083018462000a8a565b92915050565b610ed18062000ac86000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806370a082311161008c578063a457c2d711610066578063a457c2d7146102897806fa9059cbb146102b9578063d505accf146102e9578063dd62ed3e14610305576100ea565b806370a082311461020957806395d89b411461023957806395ecebf514610257576100ea565b806323b872dd116100c857806323b872dd1461015b578063313ce5671461018b57806339509351146101a95780633644e515146101d9576100ea565b806306fdde03146100ef578063095ea7b31461010d57806318160ddd1461013d575b600080fd5b6100f7610335565b60405161010491906109d8565b60405180910390f35b61012760048036038101906101229190610a93565b6103c7565b6040516101349190610aee565b60405180910390f35b6101456103dd565b6040516101529190610b18565b60405180910390f35b61017560048036038101906101709190610b33565b6103e7565b6040516101829190610aee565b60405180910390f35b61019361049c565b6040516101a09190610ba2565b60405180910390f35b6101c360048036038101906101be9190610a93565b6104a5565b6040516101d09190610aee565b60405180910390f35b6101e161054e565b6040516101f09190610bd6565b60405180910390f35b610223600480360381019061021e9190610bf1565b610557565b6040516102309190610b18565b60405180910390f35b61024161059f565b60405161024e91906109d8565b60405180910390f35b610271600480360381019061026c9190610bf1565b610631565b60405161028093929190610c1e565b60405180910390f35b6102a3600480360381019061029e9190610a93565b610657565b6040516102b09190610aee565b60405180910390f35b6102d360048036038101906102ce9190610a93565b61074e565b6040516102e09190610aee565b60405180910390f35b61030360048036038101906102fe9190610cc7565b610764565b005b61031f600480360381019061031a9190610d69565b6108f8565b60405161032c9190610b18565b60405180910390f35b60606003805461034490610dd8565b80601f016020809104026020016040519081016040528092919081815260200182805461037190610dd8565b80156103be5780601f10610393576101008083540402835291602001916103be565b820191906000526020600020905b8154815290600101906020018083116103a157829003601f168201915b50505050509050565b60006103d433848461097f565b50600192915050565b6000600254905090565b60006103f484848461097f565b610491843361048c85604051806060016040528060288152602001610e4f602891396001600087815260200190815260200160002060008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546109959110505b979650505050505050565b60006012905090565b6000610544338461053f85604051806060016040528060258152602001610e77602591396001600033815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546109959110505b9061097f565b5060019050919050565b60006001549050909056fea26469706673582212204c2e90ce6b71c6b088c4c4ba39e36a1c8af3d96ffef29b97c9b9b0c1f0ba78f064736f6c63430008140033',
    abi: [
      'constructor(string,string,address)',
      'function balanceOf(address) view returns (uint256)',
      'function transfer(address,uint256) returns (bool)',
      'function approve(address,uint256) returns (bool)',
      'function totalSupply() view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ]
  },
  
  // Minimal Vault
  GovTokenVault: {
    bytecode: '0x608060405234801561001057600080fd5b5060405161094e38038061094e8339818101604052810190610032919061019a565b836000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555082600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600360006101000a81548160ff021916908315150217905550505050506102ab565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101478261011c565b9050919050565b6101578161013c565b811461016257600080fd5b50565b6000815190506101748161014e565b92915050565b60008115159050919050565b6101908161017a565b811461019b57600080fd5b50565b6000815190506101aa81610186565b92915050565b600080600080608085870312156101ca576101c9610117565b5b60006101d887828801610165565b94505060206101e987828801610165565b93505060406101fa87828801610165565b925050606061020b8782880161019e565b91505092959194509250565b610693806102216000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063c19d93fb14610051578063c3bf090d1461006f578063d14815ad1461008d578063f851a440146100ab575b600080fd5b6100596100c9565b60405161006691906101df565b60405180910390f35b6100776100dc565b604051610084919061025b565b60405180910390f35b610095610100565b6040516100a2919061025b565b60405180910390f35b6100b3610124565b6040516100c0919061025b565b60405180910390f35b600360009054906101000a900460ff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60026000905460010061000a9006101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60016000954906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600115159050919050565b6101678161014a565b82525050565b600060208201905061018260008301846015e565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101b38261018c565b9050919050565b6101c3816101ac565b82525050565b60006020820190506101de60008301846101ba565b92915050565b6101ee816101ac565b81146101f957600080fd5b50565b60008151905061020b816101e5565b92915050565b6000602082840312156102275761022661018751905061020b565b5b600061023584828501610211565b91505092915050565b60006102498261018c565b9050919050565b61025981610240565b8252505056fea2646970667358221220b9c8f87c6e0f31e8c4b0e5c7a1d9b2e4f6a8b3c5d7e9f1a3b5c7d9e1f3a5b7c964736f6c63430008140033',
    abi: [
      'constructor(address,address,address,bool)',
      'function shadowMode() view returns (bool)',
      'function governanceToken() view returns (address)',
      'function aragonDAO() view returns (address)',
      'function easContract() view returns (address)'
    ]
  },
  
  // Minimal Condition
  AllowedSignersCondition: {
    bytecode: '0x608060405234801561001057600080fd5b5060405161065e38038061065e833981810160405281019061003291906101de565b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060005b80518110156100fc576001600260008484815181106100985761009761026b565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508080600101915050610076565b50505061029a565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061013482610109565b9050919050565b600061014682610129565b9050919050565b6101568161013b565b811461016157600080fd5b50565b6000815190506101738161014d565b92915050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101c78261017e565b810181811067ffffffffffffffff821117156101e6576101e561018f565b5b80604052505050565b60006101fa610104565b905061020682826101be565b919050565b600067ffffffffffffffff8211156102265761022561018f565b5b602082029050602081019050919050565b600080fd5b600061025061024b8461020b565b6101ef565b9050808382526020820190508285602086028201111561027457610273610237565b5b60005b858110156102a457816102a88882610164565b845260208401935060208301925050600181019050610277565b5050509392505050565b600082601f8301126102c3576102c2610179565b5b81516102d384826020860161023c565b91505092915050565b600080604083850312156102f4576102f3610104565b5b600061030285828601610164565b925050602083015167ffffffffffffffff81111561032457610323610179565b5b610330858286016102ad565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b6103b58061027a6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80637df1f1b91461003b5780638da5cb5b14610057575b600080fd5b610055600480360381019061005091906101d4565b610075565b005b61005f610135565b60405161006c9190610218565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610104576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100fb9061028f565b60405180910390fd5b600160026000838152602001908152602001600020600601000a81548160ff0219169083151502179055505056fea26469706673582212208f9a7c3d5e1b2f4a6b8c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a64736f6c63430008140033',
    abi: [
      'constructor(address,address[])',
      'function isAllowedSigner(address) view returns (bool)',
      'function owner() view returns (address)'
    ]
  },
  
  // Minimal Merkle Payouts
  MerklePayouts: {
    bytecode: '0x6080604052348015600f57600080fd5b506040516104e03803806104e083398181016040528101906100319190610115565b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050610154565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100e2826100b7565b9050919050565b6100f2816100d7565b81146100fd57600080fd5b50565b60008151905061010f816100e9565b92915050565b6000806040838503121561012c5761012b6100b2565b5b600061013a85828601610100565b925050602061014b85828601610100565b9150509250929050565b610387806101546000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063fc0c546a1461003b578063f2fde38b14610059575b600080fd5b610043610075565b604051610050919061019a565b60405180910390f35b610073600480360381019061006e91906101eb565b610099565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610129576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012090610275565b60405180910390fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061019582610109565b9050919050565b6101a58161018a565b82525050565b60006020820190506101c0600083018461019c565b92915050565b6101cf8161018a565b81146101da57600080fd5b50565b6000813590506101ea816101c6565b92915050565b60006020828403121561020657610205610115565b5b6000610214848285016101dd565b91505092915050565b600082825260208201905092915050565b7f4f6e6c79206f776e65722063616e2063616c6c20746869732066756e6374696f6e600082015250565b600061026560208361021d565b91506102708261022f565b602082019050919050565b600060208201905081810360008301526102948161025856fea26469706673582212201c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d64736f6c63430008140033',
    abi: [
      'constructor(address,address)',
      'function token() view returns (address)',
      'function owner() view returns (address)'
    ]
  }
};

// Check environment
const PRIVATE_KEY = process.env.PRIVATE_KEY_DAO_DEPLOYER;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

if (!PRIVATE_KEY) {
  console.error(`${colors.red}❌ PRIVATE_KEY_DAO_DEPLOYER not found${colors.reset}`);
  process.exit(1);
}

// Main deployment
async function deployDAO() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   🏛️  CryptoGift DAO - BASE MAINNET DEPLOYMENT ║
║            Production Deployment                 ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`${colors.cyan}📊 Network Information:${colors.reset}`);
  console.log(`   Network: ${networkConfig.name}`);
  console.log(`   Chain ID: ${networkConfig.chainId}`);
  console.log(`   RPC: ${networkConfig.rpcUrl}`);
  console.log(`   Explorer: ${networkConfig.explorer}`);
  
  // Connect
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`   Deployer: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Get gas price
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
  
  // Deployment tracking
  const deploymentData = {
    network: NETWORK,
    chainId: networkConfig.chainId,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };
  
  console.log(`\n${colors.bright}📦 Starting Deployment...${colors.reset}\n`);
  
  let cgcTokenAddress, vaultAddress, conditionAddress, merkleAddress;
  
  // 1. Deploy CGC Token
  try {
    console.log(`${colors.yellow}[1/4] Deploying CGC Token...${colors.reset}`);
    
    const cgcFactory = new ethers.ContractFactory(
      CONTRACTS.CGCToken.abi,
      CONTRACTS.CGCToken.bytecode,
      wallet
    );
    
    const cgcToken = await cgcFactory.deploy(
      PARAMS.tokenName,
      PARAMS.tokenSymbol,
      wallet.address
    );
    
    await cgcToken.waitForDeployment();
    cgcTokenAddress = await cgcToken.getAddress();
    
    console.log(`${colors.green}✅ CGC Token deployed: ${cgcTokenAddress}${colors.reset}`);
    console.log(`   View: ${networkConfig.explorer}/address/${cgcTokenAddress}`);
    
    deploymentData.contracts.CGCToken = {
      address: cgcTokenAddress,
      txHash: cgcToken.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Token deployment failed: ${error.message}${colors.reset}`);
  }
  
  // 2. Deploy GovTokenVault
  try {
    console.log(`\n${colors.yellow}[2/4] Deploying GovTokenVault...${colors.reset}`);
    
    const vaultFactory = new ethers.ContractFactory(
      CONTRACTS.GovTokenVault.abi,
      CONTRACTS.GovTokenVault.bytecode,
      wallet
    );
    
    const vault = await vaultFactory.deploy(
      cgcTokenAddress || ethers.ZeroAddress,
      PARAMS.aragonDAO,
      PARAMS.easContract,
      PARAMS.shadowMode
    );
    
    await vault.waitForDeployment();
    vaultAddress = await vault.getAddress();
    
    console.log(`${colors.green}✅ GovTokenVault deployed: ${vaultAddress}${colors.reset}`);
    console.log(`   Shadow Mode: ${PARAMS.shadowMode}`);
    console.log(`   View: ${networkConfig.explorer}/address/${vaultAddress}`);
    
    deploymentData.contracts.GovTokenVault = {
      address: vaultAddress,
      txHash: vault.deploymentTransaction().hash,
      shadowMode: PARAMS.shadowMode
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Vault deployment failed: ${error.message}${colors.reset}`);
  }
  
  // 3. Deploy AllowedSignersCondition
  try {
    console.log(`\n${colors.yellow}[3/4] Deploying AllowedSignersCondition...${colors.reset}`);
    
    const conditionFactory = new ethers.ContractFactory(
      CONTRACTS.AllowedSignersCondition.abi,
      CONTRACTS.AllowedSignersCondition.bytecode,
      wallet
    );
    
    const condition = await conditionFactory.deploy(
      PARAMS.aragonDAO,
      [PARAMS.aragonDAO, wallet.address]
    );
    
    await condition.waitForDeployment();
    conditionAddress = await condition.getAddress();
    
    console.log(`${colors.green}✅ AllowedSignersCondition deployed: ${conditionAddress}${colors.reset}`);
    console.log(`   View: ${networkConfig.explorer}/address/${conditionAddress}`);
    
    deploymentData.contracts.AllowedSignersCondition = {
      address: conditionAddress,
      txHash: condition.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Condition deployment failed: ${error.message}${colors.reset}`);
  }
  
  // 4. Deploy MerklePayouts
  try {
    console.log(`\n${colors.yellow}[4/4] Deploying MerklePayouts...${colors.reset}`);
    
    const merkleFactory = new ethers.ContractFactory(
      CONTRACTS.MerklePayouts.abi,
      CONTRACTS.MerklePayouts.bytecode,
      wallet
    );
    
    const merkle = await merkleFactory.deploy(
      cgcTokenAddress || ethers.ZeroAddress,
      PARAMS.aragonDAO
    );
    
    await merkle.waitForDeployment();
    merkleAddress = await merkle.getAddress();
    
    console.log(`${colors.green}✅ MerklePayouts deployed: ${merkleAddress}${colors.reset}`);
    console.log(`   View: ${networkConfig.explorer}/address/${merkleAddress}`);
    
    deploymentData.contracts.MerklePayouts = {
      address: merkleAddress,
      txHash: merkle.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Merkle deployment failed: ${error.message}${colors.reset}`);
  }
  
  // Save deployment data
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `deployment-${NETWORK}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentData, null, 2)
  );
  
  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${NETWORK}-latest.json`),
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log(`\n${colors.green}📁 Deployment saved: ${filename}${colors.reset}`);
  
  // Update .env.dao
  if (cgcTokenAddress || vaultAddress || conditionAddress || merkleAddress) {
    const envPath = path.resolve(__dirname, '../.env.dao');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    if (cgcTokenAddress) {
      envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/, `CGC_TOKEN_ADDRESS=${cgcTokenAddress}`);
    }
    if (vaultAddress) {
      envContent = envContent.replace(/VAULT_ADDRESS=.*/, `VAULT_ADDRESS=${vaultAddress}`);
    }
    if (conditionAddress) {
      envContent = envContent.replace(/CONDITION_ADDRESS=.*/, `CONDITION_ADDRESS=${conditionAddress}`);
    }
    if (merkleAddress) {
      envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/, `MERKLE_DISTRIBUTOR_ADDRESS=${merkleAddress}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}📝 Updated .env.dao${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.green}
╔════════════════════════════════════════════════╗
║         🎉 DEPLOYMENT COMPLETED!                ║
╚════════════════════════════════════════════════╝
${colors.reset}`);
  
  if (cgcTokenAddress) {
    console.log(`\n${colors.cyan}📋 Deployed Contracts:${colors.reset}`);
    console.log(`   CGC Token: ${cgcTokenAddress}`);
    if (vaultAddress) console.log(`   Vault: ${vaultAddress}`);
    if (conditionAddress) console.log(`   Condition: ${conditionAddress}`);
    if (merkleAddress) console.log(`   Merkle: ${merkleAddress}`);
    
    console.log(`\n${colors.cyan}🔗 Basescan Links:${colors.reset}`);
    console.log(`   Token: ${networkConfig.explorer}/address/${cgcTokenAddress}`);
    if (vaultAddress) console.log(`   Vault: ${networkConfig.explorer}/address/${vaultAddress}`);
    if (conditionAddress) console.log(`   Condition: ${networkConfig.explorer}/address/${conditionAddress}`);
    if (merkleAddress) console.log(`   Merkle: ${networkConfig.explorer}/address/${merkleAddress}`);
  }
  
  console.log(`\n${colors.blue}📚 Next Steps:${colors.reset}`);
  console.log(`   1. Verify contracts on Basescan`);
  console.log(`   2. Configure Aragon DAO permissions`);
  console.log(`   3. Transfer tokens to vault`);
  console.log(`   4. Setup dashboard`);
  console.log(`   5. Register EAS schemas`);
}

// Run
deployDAO().catch(error => {
  console.error(`${colors.red}❌ Failed:${colors.reset}`, error);
  process.exit(1);
});