import type { Signer } from 'ethers';
import { Blob as ZgBlob, Indexer } from '@0gfoundation/0g-storage-ts-sdk/browser';
import type { AgentMemory } from './agent';
import { BLOCK_EXPLORER, INDEXER_RPC, RPC_URL } from './chain';

export type UploadResult = {
  mode: '0g-storage';
  rootHash: string;
  txHash: string;
  explorerUrl: string;
  bytes: number;
};

export async function uploadAgentMemory(memory: AgentMemory, signer: Signer): Promise<UploadResult> {
  const body = JSON.stringify(memory, null, 2);
  const blob = new File([body], `${memory.agentId}-memory.json`, { type: 'application/json' });
  const file = new ZgBlob(blob);
  const [tree, treeErr] = await file.merkleTree();

  if (treeErr !== null) {
    throw new Error(`Merkle tree error: ${treeErr.message}`);
  }

  const indexer = new Indexer(INDEXER_RPC);
  const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer as never);

  if (uploadErr !== null) {
    throw new Error(`0G Storage upload error: ${uploadErr.message}`);
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

  return {
    mode: '0g-storage',
    rootHash: normalized.rootHash ?? tree?.rootHash() ?? '',
    txHash: normalized.txHash,
    explorerUrl: `${BLOCK_EXPLORER}/tx/${normalized.txHash}`,
    bytes: blob.size
  };
}
