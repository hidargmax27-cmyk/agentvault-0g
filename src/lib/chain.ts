export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? '16661');
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME ?? '0G Mainnet';
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? 'https://evmrpc.0g.ai';
export const BLOCK_EXPLORER = import.meta.env.VITE_BLOCK_EXPLORER ?? 'https://chainscan.0g.ai';
export const AGENT_LEDGER_ADDRESS = import.meta.env.VITE_AGENT_LEDGER_ADDRESS ?? '';

export const agentLedgerAbi = [
  {
    inputs: [
      { internalType: 'string', name: 'agentId', type: 'string' },
      { internalType: 'bytes32', name: 'profileRoot', type: 'bytes32' },
      { internalType: 'string', name: 'profileTxHash', type: 'string' }
    ],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'agentId', type: 'string' },
      { internalType: 'bytes32', name: 'storageRoot', type: 'bytes32' },
      { internalType: 'string', name: 'storageTxHash', type: 'string' },
      { internalType: 'string', name: 'vendor', type: 'string' },
      { internalType: 'uint256', name: 'amountCents', type: 'uint256' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
      { internalType: 'string', name: 'memo', type: 'string' }
    ],
    name: 'recordDecision',
    outputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

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
