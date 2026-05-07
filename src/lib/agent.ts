export type Policy = {
  monthlyBudgetUsd: number;
  spentThisMonthUsd: number;
  perPaymentCapUsd: number;
  approvedVendors: string[];
};

export type Invoice = {
  vendor: string;
  amountUsd: number;
  purpose: string;
  cadence: 'one-time' | 'weekly' | 'monthly';
};

export type AgentDecision = {
  approved: boolean;
  riskScore: number;
  reason: string;
  signals: string[];
  nextAction: string;
};

export type AgentMemory = {
  agentId: string;
  policy: Policy;
  invoice: Invoice;
  decision: AgentDecision;
  createdAt: string;
  version: string;
};

export const defaultPolicy: Policy = {
  monthlyBudgetUsd: 4200,
  spentThisMonthUsd: 1210,
  perPaymentCapUsd: 650,
  approvedVendors: ['0G Storage Credits', 'AWS Marketplace', 'Figma', 'Stripe']
};

export const defaultInvoice: Invoice = {
  vendor: '0G Storage Credits',
  amountUsd: 188,
  purpose: 'prepay decentralized storage for agent memory and audit snapshots',
  cadence: 'monthly'
};

export function evaluateInvoice(policy: Policy, invoice: Invoice): AgentDecision {
  const normalizedVendors = policy.approvedVendors.map((vendor) => vendor.trim().toLowerCase());
  const vendorApproved = normalizedVendors.includes(invoice.vendor.trim().toLowerCase());
  const withinCap = invoice.amountUsd <= policy.perPaymentCapUsd;
  const withinBudget = policy.spentThisMonthUsd + invoice.amountUsd <= policy.monthlyBudgetUsd;
  const purposeLooksOperational = /storage|compute|api|cloud|billing|subscription|memory|audit/i.test(
    invoice.purpose
  );

  const signals = [
    vendorApproved ? 'allowlisted vendor' : 'vendor needs approval',
    withinCap ? 'below per-payment cap' : 'above per-payment cap',
    withinBudget ? 'inside monthly budget' : 'monthly budget exceeded',
    purposeLooksOperational ? 'operational purpose' : 'unclear purpose'
  ];

  const riskScore =
    100 -
    (vendorApproved ? 0 : 35) -
    (withinCap ? 0 : 25) -
    (withinBudget ? 0 : 25) -
    (purposeLooksOperational ? 0 : 15);

  const approved = vendorApproved && withinCap && withinBudget && purposeLooksOperational;

  return {
    approved,
    riskScore: Math.max(0, riskScore),
    signals,
    reason: approved
      ? 'The invoice matches policy and can be paid by the agent.'
      : 'The agent should pause payment and request owner approval.',
    nextAction: approved ? 'Approve payment and write audit memory' : 'Hold payment and write review memory'
  };
}

export function buildMemory(agentId: string, policy: Policy, invoice: Invoice): AgentMemory {
  return {
    agentId,
    policy,
    invoice,
    decision: evaluateInvoice(policy, invoice),
    createdAt: new Date().toISOString(),
    version: '0.1.0'
  };
}

export function toAmountCents(amountUsd: number): bigint {
  return BigInt(Math.round(amountUsd * 100));
}
