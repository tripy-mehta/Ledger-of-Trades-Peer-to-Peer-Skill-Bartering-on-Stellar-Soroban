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

if [ -f "contract_ids.env" ]; then
  echo "==> Found cached contract_ids.env, skipping deployment..."
  source contract_ids.env
  echo " ReputationRegistry contract ID: $REPUTATION_ID"
  echo " SkillTrade contract ID:         $TRADE_ID"
  echo " Native Token ID is:             $TOKEN_ID"
  exit 0
fi

if ! stellar keys ls | grep -q "$IDENTITY"; then
  echo "==> Generating and funding identity: $IDENTITY"
  stellar keys generate "$IDENTITY" --network "$NETWORK"
  stellar keys fund "$IDENTITY" --network "$NETWORK"
fi

echo "==> Building contracts"
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/reputation_registry.wasm
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/skill_trade.wasm

echo "==> Deploying ReputationRegistry contract"
REPUTATION_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reputation_registry.optimized.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>deploy_rep_err.log) || { cat deploy_rep_err.log; exit 1; }
echo "ReputationRegistry deployed at: $REPUTATION_ID"

echo "==> Deploying SkillTrade contract"
TRADE_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/skill_trade.optimized.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>deploy_trade_err.log) || { cat deploy_trade_err.log; exit 1; }
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

echo "Fetching Test Token (Native XLM asset) ID..."
TOKEN_ID=$(stellar contract id asset --asset native --network testnet)
echo " Native Token ID is:             $TOKEN_ID"

echo "REPUTATION_ID=$REPUTATION_ID" > contract_ids.env
echo "TRADE_ID=$TRADE_ID" >> contract_ids.env
echo "TOKEN_ID=$TOKEN_ID" >> contract_ids.env

echo ""
echo " Next steps:"
echo " 1. Add these IDs to frontend/.env as VITE_REPUTATION_CONTRACT_ID, VITE_TRADE_CONTRACT_ID, and VITE_BOND_TOKEN_ID"
echo " 2. Run scripts/sample_interaction.sh to test a trade"
echo "=================================================="
