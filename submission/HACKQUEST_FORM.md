# HackQuest Submission Draft

## Project Name

AgentVault 0G

## One-Sentence Description

AgentVault is a self-custodial AI payment console that writes autonomous billing decisions to 0G Storage and anchors proofs on 0G Chain.

## Short Summary

AgentVault lets a user configure spending limits for an AI agent, evaluate incoming invoices, store the full agent memory snapshot on 0G Storage, and write a verifiable storage root to an on-chain ledger on 0G Chain.

The project solves a practical problem for agentic commerce: autonomous agents need payment authority, but owners and counterparties need clear policy controls and auditable memory. AgentVault gives agents a narrow operating lane and gives humans explorer-verifiable proof of what happened.

0G components used:

- 0G Storage for persistent agent memory snapshots.
- 0G Chain for `AgentLedger` contract proofs.

## Track

Track 3: Agentic Economy & Autonomous Applications

## GitHub Repository

TODO: paste public repo URL.

## Frontend Demo

TODO: paste deployed frontend URL.

## 0G Mainnet Contract Address

TODO: paste `AgentLedger` address after `npm run deploy:0g`.

## 0G Explorer Link

TODO: paste `DecisionRecorded` transaction link.

## 0G Storage Proof

TODO: paste storage root and storage upload transaction hash.

## Demo Video

TODO: paste YouTube or Loom URL. Keep it under 3 minutes.

## Reviewer Notes

Run locally:

```bash
npm install
cp .env.example .env
npm run dev
```

Live 0G mode requires `ZEROG_PRIVATE_KEY` for Storage uploads and `VITE_AGENT_LEDGER_ADDRESS` after deploying the contract.
