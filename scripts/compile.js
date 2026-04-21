/**
 * Compiles HouseToken.sol using solc-js and writes artifacts/HouseToken.json.
 * Run once before first deploy: node scripts/compile.js
 */
const solc  = require("solc");
const fs    = require("fs");
const path  = require("path");

const SOL_PATH      = path.join(__dirname, "contracts", "HouseToken.sol");
const ARTIFACT_PATH = path.join(__dirname, "artifacts", "HouseToken.json");

const source = fs.readFileSync(SOL_PATH, "utf8");

const input = {
  language: "Solidity",
  sources: { "HouseToken.sol": { content: source } },
  settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
};

console.log("Compiling HouseToken.sol...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors || []).filter(e => e.severity === "error");
if (errors.length > 0) {
  console.error("Compilation errors:");
  errors.forEach(e => console.error(e.formattedMessage));
  process.exit(1);
}

const contract  = output.contracts["HouseToken.sol"]["HouseToken"];
const artifact  = {
  abi:      contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
};

fs.mkdirSync(path.dirname(ARTIFACT_PATH), { recursive: true });
fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(artifact, null, 2));
console.log(`Artifact written to ${ARTIFACT_PATH}`);
console.log(`Bytecode size: ${artifact.bytecode.length / 2 - 1} bytes`);
