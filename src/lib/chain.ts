import type { InterfaceAbi } from 'ethers';
import agentLedgerArtifact from '../generated/AgentLedger.json';

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? '16661');
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME ?? '0G Mainnet';
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? 'https://evmrpc.0g.ai';
export const INDEXER_RPC =
  import.meta.env.VITE_ZEROG_INDEXER_RPC ?? 'https://indexer-storage-turbo.0g.ai';
export const BLOCK_EXPLORER = import.meta.env.VITE_BLOCK_EXPLORER ?? 'https://chainscan.0g.ai';
export const AGENT_LEDGER_ADDRESS = import.meta.env.VITE_AGENT_LEDGER_ADDRESS ?? '';

export const agentLedgerAbi = agentLedgerArtifact.abi as InterfaceAbi;
export const agentLedgerBytecode = agentLedgerArtifact.bytecode;

export async function request0GNetwork() {
  if (!window.ethereum) {
    throw new Error('Wallet extension not found');
  }

  const hexChainId = `0x${CHAIN_ID.toString(16)}`;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }]
    });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;

    if (code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: hexChainId,
          chainName: CHAIN_NAME,
          nativeCurrency: {
            name: '0G',
            symbol: '0G',
            decimals: 18
          },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [BLOCK_EXPLORER]
        }
      ]
    });
  }
}
