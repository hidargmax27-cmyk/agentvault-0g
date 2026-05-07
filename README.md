# AgentVault 0G

Self-custodial AI agent billing console with verifiable memory on 0G Storage and on-chain audit proofs on 0G Chain.

## Hackathon Fit

AgentVault targets the 0G APAC Hackathon Track 3: Agentic Economy & Autonomous Applications.

AI agents are starting to buy tools, storage, compute, data, and subscriptions for their users. The missing layer is a policy-bound wallet that can make payment decisions, preserve long-term memory, and leave an auditable trail. AgentVault lets an owner define payment limits, lets an agent evaluate an invoice, writes the decision memory to 0G Storage, and records the storage root on 0G Chain.

## 0G Integration

AgentVault uses two 0G components:

- 0G Storage: stores each agent decision as an immutable memory snapshot using the browser build of `@0gfoundation/0g-storage-ts-sdk`, `Indexer`, and wallet signing.
- 0G Chain: stores the 0G Storage root and storage transaction hash in `AgentLedger.sol`, giving judges an explorer-verifiable activity trail.

Mainnet defaults follow the 0G docs:

- Chain ID: `16661`
- RPC: `https://evmrpc.0g.ai`
- Storage Indexer: `https://indexer-storage-turbo.0g.ai`
- Explorer: `https://chainscan.0g.ai`

## Architecture

```mermaid
flowchart LR
  A["Owner policy"] --> B["Agent decision engine"]
  C["Incoming invoice"] --> B
  B --> D["Agent memory JSON"]
  D --> E["0G Storage upload"]
  E --> F["Storage root + tx hash"]
  F --> G["AgentLedger on 0G Chain"]
  G --> H["Explorer-verifiable proof"]
  F --> I["Frontend proof panel"]
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`.

No private key is required in `.env`. All live 0G actions use the connected browser wallet.

## Live 0G Submission Flow

1. Use a funded 0G mainnet wallet in MetaMask, Rabby, OKX Wallet, or another EVM wallet.

2. Start the app.

```bash
npm run dev
```

3. In the app:

- Connect wallet on 0G Mainnet.
- Click `Deploy Ledger` to deploy `AgentLedger.sol` with a wallet confirmation.
- Adjust the agent policy or invoice.
- Click `Upload` to store the memory snapshot on 0G Storage with a wallet confirmation.
- Click `Record on 0G Chain` to anchor the storage root in the ledger contract.
- Use the explorer links as the required proof.

4. Optional: if you already deployed `AgentLedger`, add the address to `.env`.

```bash
VITE_AGENT_LEDGER_ADDRESS=0x...
```

The app also saves a newly deployed ledger address in browser local storage for the next refresh.

## Security Model

- No private key is stored in the repository.
- No private key is required in `.env`.
- Contract deployment, 0G Storage upload, and ledger recording all use browser wallet confirmations.
- Use a fresh hackathon wallet with a small amount of 0G gas for demos.

## Useful Commands

```bash
npm run build
npm run contract:compile
```

## Submission Checklist

- GitHub repository link
- Public frontend URL
- 0G mainnet contract address
- 0G explorer transaction link for `DecisionRecorded`
- 0G Storage transaction/root proof
- Demo video under 3 minutes
- Public X post with `#0GHackathon` and `#BuildOn0G`

## Project Summary

One sentence:

AgentVault is a self-custodial AI payment console that writes every autonomous billing decision to 0G Storage and anchors it on 0G Chain.

Short summary:

AgentVault helps users safely delegate payment approvals to AI agents. The product combines configurable spending policy, deterministic agent decisioning, decentralized memory storage, and an on-chain audit ledger. 0G Storage preserves the full decision context, while 0G Chain records a verifiable pointer to each memory snapshot.

## License

MIT
