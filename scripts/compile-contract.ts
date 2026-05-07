import { compileAgentLedger, writeArtifact } from './utils/compile.js';

const artifactPath = writeArtifact(compileAgentLedger());
console.log(`AgentLedger artifact written to ${artifactPath}`);
