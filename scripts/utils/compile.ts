import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

export type CompiledContract = {
  abi: unknown[];
  bytecode: string;
};

export function compileAgentLedger(): CompiledContract {
  const contractPath = path.resolve('contracts', 'AgentLedger.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'AgentLedger.sol': {
        content: source
      }
    },
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatal = errors.filter((item: { severity: string }) => item.severity === 'error');

  if (fatal.length > 0) {
    throw new Error(fatal.map((item: { formattedMessage: string }) => item.formattedMessage).join('\n'));
  }

  const contract = output.contracts['AgentLedger.sol'].AgentLedger;

  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`
  };
}

export function writeArtifact(compiled: CompiledContract): string {
  const artifactDir = path.resolve('artifacts');
  fs.mkdirSync(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, 'AgentLedger.json');
  fs.writeFileSync(artifactPath, JSON.stringify(compiled, null, 2));
  return artifactPath;
}
