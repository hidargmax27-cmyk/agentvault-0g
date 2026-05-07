import 'dotenv/config';
import { createHash } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { ethers } from 'ethers';
import { Indexer, MemData } from '@0gfoundation/0g-storage-ts-sdk';
import { z } from 'zod';

const memorySchema = z.object({
  agentId: z.string().min(1),
  policy: z.record(z.unknown()),
  invoice: z.record(z.unknown()),
  decision: z.record(z.unknown()),
  createdAt: z.string(),
  version: z.string().default('0.1.0')
});

const rpcUrl = process.env.ZEROG_RPC_URL ?? 'https://evmrpc.0g.ai';
const indexerRpc = process.env.ZEROG_INDEXER_RPC ?? 'https://indexer-storage-turbo.0g.ai';
const explorer = process.env.ZEROG_EXPLORER ?? 'https://chainscan.0g.ai';
const privateKey = process.env.ZEROG_PRIVATE_KEY;
const offlineDemo = process.env.OFFLINE_DEMO === 'true' || !privateKey;
const port = Number(process.env.API_PORT ?? 8787);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    network: {
      rpcUrl,
      indexerRpc,
      explorer
    },
    storageMode: offlineDemo ? 'preview' : '0g-storage'
  });
});

app.post('/api/upload-memory', async (req, res) => {
  try {
    const memory = memorySchema.parse(req.body);
    const body = JSON.stringify(memory, null, 2);

    if (offlineDemo) {
      const digest = createHash('sha256').update(body).digest('hex');
      res.json({
        mode: 'preview',
        rootHash: `0x${digest}`,
        txHash: `0x${digest.slice(0, 64)}`,
        explorerUrl: '',
        bytes: Buffer.byteLength(body)
      });
      return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const indexer = new Indexer(indexerRpc);
    const memData = new MemData(new TextEncoder().encode(body));
    const [tree, treeErr] = await memData.merkleTree();

    if (treeErr !== null) {
      throw new Error(`Merkle tree error: ${treeErr}`);
    }

    const [tx, uploadErr] = await indexer.upload(memData, rpcUrl, signer as never);

    if (uploadErr !== null) {
      throw new Error(`Upload error: ${uploadErr}`);
    }

    const normalized =
      'rootHash' in tx
        ? {
            rootHash: tx.rootHash,
            txHash: tx.txHash
          }
        : {
            rootHash: tx.rootHashes[0],
            txHash: tx.txHashes[0]
          };

    res.json({
      mode: '0g-storage',
      ...normalized,
      merkleRoot: tree?.rootHash(),
      explorerUrl: `${explorer}/tx/${normalized.txHash}`,
      bytes: Buffer.byteLength(body)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    res.status(400).json({ error: message });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`AgentVault API listening on http://127.0.0.1:${port}`);
  console.log(`0G Storage mode: ${offlineDemo ? 'preview' : 'live'}`);
});
