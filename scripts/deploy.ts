import 'dotenv/config';
import { ethers } from 'ethers';
import { compileAgentLedger, writeArtifact } from './utils/compile.js';

const rpcUrl = process.env.ZEROG_RPC_URL ?? 'https://evmrpc.0g.ai';
const explorer = process.env.ZEROG_EXPLORER ?? 'https://chainscan.0g.ai';
const privateKey = process.env.ZEROG_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('Set ZEROG_PRIVATE_KEY in .env before deploying to 0G.');
}

const compiled = compileAgentLedger();
const artifactPath = writeArtifact(compiled);
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

console.log(`Deploying AgentLedger from ${wallet.address}`);
console.log(`RPC: ${rpcUrl}`);

const factory = new ethers.ContractFactory(compiled.abi as ethers.InterfaceAbi, compiled.bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

const address = await contract.getAddress();
const deployment = await contract.deploymentTransaction()?.wait();

console.log(`Artifact: ${artifactPath}`);
console.log(`AgentLedger address: ${address}`);
console.log(`Deployment tx: ${deployment?.hash ?? 'unknown'}`);
console.log(`Explorer: ${explorer}/address/${address}`);
console.log('');
console.log('Add this to .env and redeploy the frontend:');
console.log(`VITE_AGENT_LEDGER_ADDRESS=${address}`);
