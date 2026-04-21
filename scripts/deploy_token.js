/**
 * Deploy a HouseToken BEP-20 on BNB Testnet (Chapel, Chain ID 97).
 *
 * Usage:
 *   node scripts/deploy_token.js <name> <ticker> <deployer_address> [--mock]
 *
 * --mock  Skip actual deployment; return a deterministic fake address.
 *         Use this until you have tBNB. All downstream code works with mock addresses.
 *
 * Real deploy requirements:
 *   - scripts/artifacts/HouseToken.json must exist (run: node scripts/compile.js)
 *   - DEPLOYER_PRIVATE_KEY in .env
 *   - tBNB balance on the deployer address (https://testnet.bnbchain.org/faucet-smart)
 *
 * Output (stdout, JSON):
 *   { address, txHash, blockNumber, name, ticker, mock }
 *   Address is also written into content/contestants.json for the matching ticker.
 */
const { ethers } = require("ethers");
const fs         = require("fs");
const path       = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const ARTIFACT_PATH    = path.join(__dirname, "artifacts", "HouseToken.json");
const CONTESTANTS_PATH = path.join(__dirname, "..", "content", "contestants.json");

const RPC_URLS = [
  process.env.BSC_TESTNET_RPC        || "https://data-seed-prebsc-1-s1.binance.org:8545/",
  process.env.BSC_TESTNET_RPC_BACKUP || "https://data-seed-prebsc-2-s1.binance.org:8545/",
  "https://bsc-testnet-rpc.publicnode.com",
];

// ── Mock mode ──────────────────────────────────────────────────────────────

function mockAddress(ticker) {
  // Deterministic fake address — same ticker always gets same address
  const { createHash } = require("crypto");
  const hash = createHash("sha256").update(`HOUSE_TOKEN_${ticker}`).digest("hex");
  return "0x" + hash.slice(0, 40);
}

// ── Provider with fallback ─────────────────────────────────────────────────

async function getProvider() {
  for (const url of RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // ping
      console.error(`[RPC] Connected to ${url}`);
      return provider;
    } catch {
      console.error(`[RPC] Failed ${url}, trying next...`);
    }
  }
  throw new Error("All RPC endpoints failed. Check network connection.");
}

// ── Real deploy ────────────────────────────────────────────────────────────

async function deployReal(name, ticker, supply = 1_000_000) {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    throw new Error(
      `${ARTIFACT_PATH} not found. Run: node scripts/compile.js`
    );
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const provider = await getProvider();
  const wallet   = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.error(`[Deploy] Deployer: ${wallet.address}`);
  console.error(`[Deploy] Balance: ${ethers.formatEther(balance)} tBNB`);

  if (balance === 0n) {
    throw new Error(
      `Deployer has 0 tBNB. Get test tokens at:\n` +
      `  https://testnet.bnbchain.org/faucet-smart\n` +
      `  https://faucet.quicknode.com/binance-smart-chain/bnb-testnet\n` +
      `Or run with --mock to unblock development.`
    );
  }

  console.error(`[Deploy] Deploying ${name} (${ticker})...`);
  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(name, ticker, supply);
  const receipt  = await contract.deploymentTransaction().wait(1);

  return {
    address:     await contract.getAddress(),
    txHash:      receipt.hash,
    blockNumber: receipt.blockNumber,
    name,
    ticker,
    mock:        false,
  };
}

// ── Update contestants.json ────────────────────────────────────────────────

function updateContestants(ticker, address, txHash, mock) {
  if (!fs.existsSync(CONTESTANTS_PATH)) return;
  const contestants = JSON.parse(fs.readFileSync(CONTESTANTS_PATH, "utf8"));
  let updated = false;
  for (const c of contestants) {
    if (c.ticker === ticker) {
      c.token_address = address;
      c.deploy_tx     = txHash || null;
      c.mock_deploy   = mock;
      updated = true;
    }
  }
  if (updated) {
    fs.writeFileSync(CONTESTANTS_PATH, JSON.stringify(contestants, null, 2));
    console.error(`[Deploy] Updated contestants.json for ticker=${ticker}`);
  }
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main() {
  const args   = process.argv.slice(2);
  const isMock = args.includes("--mock");
  const params = args.filter(a => !a.startsWith("--"));

  const [name, ticker] = params;
  if (!name || !ticker) {
    console.error('Usage: node deploy_token.js <name> <ticker> [--mock]');
    console.error('Example: node deploy_token.js MOMCOIN MOM --mock');
    process.exit(1);
  }

  let result;
  if (isMock) {
    const address = mockAddress(ticker);
    console.error(`[Mock] Skipping real deploy — returning deterministic address`);
    result = { address, txHash: null, blockNumber: null, name, ticker, mock: true };
  } else {
    result = await deployReal(name, ticker);
  }

  // Persist to contestants.json
  updateContestants(ticker, result.address, result.txHash, result.mock);

  // JSON output to stdout (caller can parse this)
  console.log(JSON.stringify(result, null, 2));

  if (!isMock) {
    console.error(`\n✓ Verify at: https://testnet.bscscan.com/address/${result.address}`);
  }
}

main().catch(e => {
  console.error("[Error]", e.message);
  process.exit(1);
});

module.exports = { mockAddress, deployReal };
