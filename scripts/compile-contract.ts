import { compileAgentLedger, writeArtifact, writeFrontendArtifact } from './utils/compile.js';

const compiled = compileAgentLedger();
const artifactPath = writeArtifact(compiled);
const frontendArtifactPath = writeFrontendArtifact(compiled);
console.log(`AgentLedger artifact written to ${artifactPath}`);
console.log(`Frontend artifact written to ${frontendArtifactPath}`);
