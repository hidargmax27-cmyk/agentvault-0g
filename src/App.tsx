import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  CircleDollarSign,
  Database,
  FileClock,
  Link2,
  Loader2,
  ShieldCheck,
  Wallet,
  X
} from 'lucide-react';
import { BrowserProvider, Contract, ContractFactory } from 'ethers';
import {
  AGENT_LEDGER_ADDRESS,
  BLOCK_EXPLORER,
  CHAIN_NAME,
  agentLedgerAbi,
  agentLedgerBytecode,
  request0GNetwork
} from './lib/chain';
import {
  AgentMemory,
  Invoice,
  Policy,
  buildMemory,
  defaultInvoice,
  defaultPolicy,
  evaluateInvoice,
  toAmountCents
} from './lib/agent';
import { UploadResult, uploadAgentMemory } from './lib/storage';

type ChainProof = {
  txHash: string;
  explorerUrl: string;
};

type StepState = 'idle' | 'working' | 'done' | 'error';

const agentId = 'agentvault-apac-001';

function App() {
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [invoice, setInvoice] = useState<Invoice>(defaultInvoice);
  const [wallet, setWallet] = useState('');
  const [ledgerAddress, setLedgerAddress] = useState(
    () => AGENT_LEDGER_ADDRESS || window.localStorage.getItem('agentvault-ledger-address') || ''
  );
  const [deployState, setDeployState] = useState<StepState>(ledgerAddress ? 'done' : 'idle');
  const [uploadState, setUploadState] = useState<StepState>('idle');
  const [chainState, setChainState] = useState<StepState>('idle');
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [deployProof, setDeployProof] = useState<ChainProof | null>(null);
  const [chainProof, setChainProof] = useState<ChainProof | null>(null);
  const [error, setError] = useState('');

  const decision = useMemo(() => evaluateInvoice(policy, invoice), [policy, invoice]);
  const memory = useMemo<AgentMemory>(() => buildMemory(agentId, policy, invoice), [invoice, policy]);
  const remainingBudget = policy.monthlyBudgetUsd - policy.spentThisMonthUsd;

  async function connectWallet() {
    setError('');

    if (!window.ethereum) {
      setError('MetaMask or another EVM wallet is required.');
      return;
    }

    try {
      await request0GNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setWallet(accounts[0]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wallet connection failed.');
    }
  }

  async function uploadMemory() {
    setError('');

    if (!window.ethereum) {
      setError('MetaMask or another EVM wallet is required.');
      return;
    }

    setUploadState('working');

    try {
      await request0GNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(await signer.getAddress());
      const result = await uploadAgentMemory(memory, signer);
      setUpload(result);
      setUploadState('done');
    } catch (caught) {
      setUploadState('error');
      setError(caught instanceof Error ? caught.message : '0G Storage upload failed.');
    }
  }

  async function deployLedger() {
    setError('');

    if (!window.ethereum) {
      setError('MetaMask or another EVM wallet is required.');
      return;
    }

    setDeployState('working');

    try {
      await request0GNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(await signer.getAddress());
      const factory = new ContractFactory(agentLedgerAbi, agentLedgerBytecode, signer);
      const contract = await factory.deploy();
      const deploymentTx = contract.deploymentTransaction();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      const receipt = await deploymentTx?.wait();
      const txHash = receipt?.hash ?? deploymentTx?.hash ?? '';

      setLedgerAddress(address);
      window.localStorage.setItem('agentvault-ledger-address', address);
      setDeployProof({
        txHash,
        explorerUrl: txHash ? `${BLOCK_EXPLORER}/tx/${txHash}` : `${BLOCK_EXPLORER}/address/${address}`
      });
      setDeployState('done');
    } catch (caught) {
      setDeployState('error');
      setError(caught instanceof Error ? caught.message : 'Ledger deployment failed.');
    }
  }

  async function recordOnChain() {
    setError('');

    if (!upload) {
      setError('Upload agent memory before writing the chain proof.');
      return;
    }

    if (!ledgerAddress) {
      setError('Deploy AgentLedger with your wallet before writing the chain proof.');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask or another EVM wallet is required.');
      return;
    }

    setChainState('working');

    try {
      await request0GNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(await signer.getAddress());
      const contract = new Contract(ledgerAddress, agentLedgerAbi, signer);
      const tx = await contract.recordDecision(
        agentId,
        upload.rootHash,
        upload.txHash,
        invoice.vendor,
        toAmountCents(invoice.amountUsd),
        decision.approved,
        decision.reason
      );

      const receipt = await tx.wait();
      const hash = receipt?.hash ?? tx.hash;

      setChainProof({
        txHash: hash,
        explorerUrl: `${BLOCK_EXPLORER}/tx/${hash}`
      });
      setChainState('done');
    } catch (caught) {
      setChainState('error');
      setError(caught instanceof Error ? caught.message : 'Chain proof failed.');
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="AgentVault navigation">
        <div className="brand">
          <span className="brand-mark">
            <Bot size={22} />
          </span>
          <div>
            <strong>AgentVault</strong>
            <span>0G APAC build</span>
          </div>
        </div>

        <nav className="nav-list">
          <a className="nav-item active" href="#operate">
            <Activity size={18} />
            Operate
          </a>
          <a className="nav-item" href="#memory">
            <Database size={18} />
            Memory
          </a>
          <a className="nav-item" href="#proof">
            <ShieldCheck size={18} />
            Proof
          </a>
        </nav>

        <div className="network-chip">
          <span className="pulse" />
          {CHAIN_NAME}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Agentic Economy / Autonomous Billing</p>
            <h1>Self-custodial payment decisions with verifiable agent memory.</h1>
          </div>
          <button className="icon-button wide" onClick={connectWallet}>
            <Wallet size={18} />
            {wallet ? shorten(wallet) : 'Connect'}
          </button>
        </header>

        <section id="operate" className="grid">
          <div className="panel policy-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Policy</p>
                <h2>Agent limits</h2>
              </div>
              <span className="status-pill good">Live</span>
            </div>

            <div className="form-grid">
              <label>
                <span>Monthly budget</span>
                <input
                  type="number"
                  min="0"
                  value={policy.monthlyBudgetUsd}
                  onChange={(event) =>
                    setPolicy({ ...policy, monthlyBudgetUsd: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Spent this month</span>
                <input
                  type="number"
                  min="0"
                  value={policy.spentThisMonthUsd}
                  onChange={(event) =>
                    setPolicy({ ...policy, spentThisMonthUsd: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Payment cap</span>
                <input
                  type="number"
                  min="0"
                  value={policy.perPaymentCapUsd}
                  onChange={(event) =>
                    setPolicy({ ...policy, perPaymentCapUsd: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Vendors</span>
                <textarea
                  value={policy.approvedVendors.join(', ')}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      approvedVendors: event.target.value
                        .split(',')
                        .map((vendor) => vendor.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className="panel invoice-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Invoice</p>
                <h2>Incoming payment</h2>
              </div>
              <CircleDollarSign size={22} />
            </div>

            <div className="form-grid">
              <label>
                <span>Vendor</span>
                <input
                  value={invoice.vendor}
                  onChange={(event) => setInvoice({ ...invoice, vendor: event.target.value })}
                />
              </label>
              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  value={invoice.amountUsd}
                  onChange={(event) =>
                    setInvoice({ ...invoice, amountUsd: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Cadence</span>
                <select
                  value={invoice.cadence}
                  onChange={(event) =>
                    setInvoice({ ...invoice, cadence: event.target.value as Invoice['cadence'] })
                  }
                >
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label>
                <span>Purpose</span>
                <textarea
                  value={invoice.purpose}
                  onChange={(event) => setInvoice({ ...invoice, purpose: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="panel decision-panel">
            <div className="decision-ring" data-approved={decision.approved}>
              <span>{decision.riskScore}</span>
              <small>score</small>
            </div>
            <div className="decision-copy">
              <p className="eyebrow">Decision</p>
              <h2>{decision.approved ? 'Approve payment' : 'Hold for owner'}</h2>
              <p>{decision.reason}</p>
            </div>
            <div className="signal-row">
              {decision.signals.map((signal) => (
                <span key={signal} className="signal">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="memory" className="proof-grid">
          <div className="panel memory-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">0G Storage</p>
                <h2>Agent memory snapshot</h2>
              </div>
              <button className="icon-button" onClick={uploadMemory} disabled={uploadState === 'working'}>
                {uploadState === 'working' ? <Loader2 className="spin" size={18} /> : <Database size={18} />}
                Upload
              </button>
            </div>

            <pre className="memory-preview">{JSON.stringify(memory, null, 2)}</pre>
          </div>

          <div id="proof" className="panel proof-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">0G Chain</p>
                <h2>Verification trail</h2>
              </div>
              <ShieldCheck size={22} />
            </div>

            <div className="metrics">
              <Metric label="Remaining budget" value={`$${remainingBudget.toLocaleString()}`} />
              <Metric label="Storage mode" value={upload?.mode ?? 'pending'} />
              <Metric label="Ledger" value={ledgerAddress ? shorten(ledgerAddress) : 'not deployed'} />
            </div>

            <ProofRow
              icon={<ShieldCheck size={18} />}
              label="Ledger contract"
              value={ledgerAddress}
              state={deployState}
              href={ledgerAddress ? `${BLOCK_EXPLORER}/address/${ledgerAddress}` : deployProof?.explorerUrl}
            />
            <ProofRow
              icon={<Database size={18} />}
              label="Storage root"
              value={upload?.rootHash}
              state={uploadState}
              href={upload?.explorerUrl}
            />
            <ProofRow
              icon={<FileClock size={18} />}
              label="Storage tx"
              value={upload?.txHash}
              state={uploadState}
              href={upload?.explorerUrl}
            />
            <ProofRow
              icon={<Link2 size={18} />}
              label="Ledger tx"
              value={chainProof?.txHash}
              state={chainState}
              href={chainProof?.explorerUrl}
            />

            {!ledgerAddress && (
              <button className="primary-action" onClick={deployLedger} disabled={deployState === 'working'}>
                {deployState === 'working' ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
                Deploy Ledger
              </button>
            )}
            <button className="primary-action" onClick={recordOnChain} disabled={chainState === 'working'}>
              {chainState === 'working' ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
              Record on 0G Chain
            </button>

            {error && <div className="error-box">{error}</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProofRow({
  icon,
  label,
  value,
  state,
  href
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  state: StepState;
  href?: string;
}) {
  return (
    <div className="proof-row">
      <span className="proof-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value ? shorten(value) : 'waiting'}</strong>
      </div>
      <StateIcon state={state} />
      {href && (
        <a className="open-link" href={href} target="_blank" rel="noreferrer">
          <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}

function StateIcon({ state }: { state: StepState }) {
  if (state === 'working') return <Loader2 className="spin muted" size={18} />;
  if (state === 'done') return <Check className="success" size={18} />;
  if (state === 'error') return <X className="danger" size={18} />;
  return <span className="dot" />;
}

function shorten(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default App;
