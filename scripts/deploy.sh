#!/usr/bin/env bash
# Deploys the ReputationRegistry and SkillTrade contracts to Stellar Testnet.
#
# Prerequisites:
#   - Stellar CLI installed: https://developers.stellar.org/docs/tools/cli
#   - A funded testnet identity: `stellar keys generate deployer --network testnet --fund`
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh

set -euo pipefail

NETWORK="testnet"
IDENTITY="deployer"

echo "==> Building contracts"
stellar contract build

echo "==> Deploying ReputationRegistry contract"
REPUTATION_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reputation_registry.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "ReputationRegistry deployed at: $REPUTATION_ID"

echo "==> Deploying SkillTrade contract"
TRADE_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/skill_trade.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "SkillTrade deployed at: $TRADE_ID"

echo "==> Initializing ReputationRegistry (authorizing the Trade contract to call it)"
stellar contract invoke \
  --id "$REPUTATION_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --trade_contract "$TRADE_ID"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " ReputationRegistry contract ID: $REPUTATION_ID"
echo " SkillTrade contract ID:         $TRADE_ID"
echo ""
echo " Next steps:"
echo " 1. Add these IDs to frontend/.env as VITE_REPUTATION_CONTRACT_ID and VITE_TRADE_CONTRACT_ID"
echo " 2. Deploy or reuse a testnet SEP-41 token for bonds, set VITE_BOND_TOKEN_ID"
echo " 3. Run scripts/sample_interaction.sh to propose a trade for your submission's tx hash"
echo "=================================================="
