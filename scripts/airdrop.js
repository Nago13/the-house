const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

// TODO [Hours 17-20] — Airdrop child tokens to parent-token holders
// Process per TECHNICAL_DECISIONS.md §4:
//   1. Query balanceOf() for 6 pre-defined test wallets (3 MOM, 3 DAD)
//   2. Calculate proportional share of child supply off-chain
//   3. Loop transfers (or use Disperse contract) to distribute
//   4. All verifiable on testnet.bscscan.com

// Pre-defined test wallets for demo (fund these before the hackathon)
const TEST_WALLETS = {
  mom_holders: [
    "0x0000000000000000000000000000000000000001", // TODO: replace with real test wallets
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
  ],
  dad_holders: [
    "0x0000000000000000000000000000000000000004",
    "0x0000000000000000000000000000000000000005",
    "0x0000000000000000000000000000000000000006",
  ],
};

async function executeAirdrop(childTokenAddress, momTokenAddress, dadTokenAddress) {
  // TODO [Hours 17-20] — Implement airdrop logic
  throw new Error("Not implemented");
}

module.exports = { executeAirdrop, TEST_WALLETS };
