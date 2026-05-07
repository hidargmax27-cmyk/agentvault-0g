import 'dotenv/config';
import { createHash } from 'node:crypto';
import { ethers } from 'ethers';
import { Indexer, MemData } from '@0gfoundation/0g-storage-ts-sdk';

const rpcUrl = process.env.ZEROG_RPC_URL ?? 'https://evmrpc.0g.ai';
const indexerRpc = process.env.ZEROG_INDEXER_RPC ?? 'https://indexer-storage-turbo.0g.ai';
const explorer = process.env.ZEROG_EXPLORER ?? 'https://chainscan.0g.ai';
const privateKey = process.env.ZEROG_PRIVATE_KEY;

const sampleMemory = {
  agentId: 'agentvault-apac-demo',
  policy: {
    monthlyBudgetUsd: 4200,
    perPaymentCapUsd: 650,
    approvedVendors: ['AWS Marketplace', '0G Storage Credits', 'Figma']
  },
  invoice: {
    vendor: '0G Storage Credits',
    amountUsd: 188,
    purpose: 'prepay decentralized storage for agent memory'
  },
  decision: {
    approved: true,
    reason: 'vendor is allowlisted and amount is below cap',
    riskScore: 8
  },
  createdAt: new Date().toISOString()
};

const body = JSON.stringify(sampleMemory, null, 2);

if (!privateKey || process.env.OFFLINE_DEMO === 'true') {
  const digest = createHash('sha256').update(body).digest('hex');
  console.log('OFFLINE preview only. Set ZEROG_PRIVATE_KEY for a real 0G Storage upload.');
  console.log(`previewRootHash: 0x${digest}`);
  process.exit(0);
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
const indexer = new Indexer(indexerRpc);
const memData = new MemData(new TextEncoder().encode(body));
const [tree, treeErr] = await memData.merkleTree();

if (treeErr !== null) {
  throw new Error(`Merkle tree error: ${treeErr}`);
}

console.log(`Root before upload: ${tree?.rootHash()}`);
const [tx, uploadErr] = await indexer.upload(memData, rpcUrl, signer as never);

if (uploadErr !== null) {
  throw new Error(`Upload error: ${uploadErr}`);
}

if ('rootHash' in tx) {
  console.log(`0G Storage root: ${tx.rootHash}`);
  console.log(`0G Storage tx: ${tx.txHash}`);
  console.log(`Explorer tx: ${explorer}/tx/${tx.txHash}`);
} else {
  console.log(`0G Storage roots: ${tx.rootHashes.join(', ')}`);
  console.log(`0G Storage txs: ${tx.txHashes.join(', ')}`);
}
