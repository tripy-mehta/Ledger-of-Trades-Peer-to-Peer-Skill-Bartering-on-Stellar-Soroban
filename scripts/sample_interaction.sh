#!/usr/bin/env bash
# Runs one end-to-end interaction against deployed testnet contracts so you
# have a real transaction hash for the submission checklist: propose a trade.
#
# Fill in these values after running deploy.sh:
TRADE_ID_CONTRACT="REPLACE_WITH_TRADE_CONTRACT_ID"
REPUTATION_ID="REPLACE_WITH_REPUTATION_CONTRACT_ID"
BOND_TOKEN_ID="REPLACE_WITH_TESTNET_TOKEN_ID"
PARTY_A_IDENTITY="deployer"
PARTY_B_ADDRESS="REPLACE_WITH_A_TESTNET_ADDRESS"

set -euo pipefail

PARTY_A_ADDRESS="$(stellar keys address $PARTY_A_IDENTITY)"
DEADLINE=$(( $(date +%s) + 1209600 )) # 14 days from now

echo "==> Proposing a sample trade"
stellar contract invoke \
  --id "$TRADE_ID_CONTRACT" \
  --source "$PARTY_A_IDENTITY" \
  --network testnet \
  -- propose_trade \
  --party_a "$PARTY_A_ADDRESS" \
  --party_b "$PARTY_B_ADDRESS" \
  --offer_a "Logo design" \
  --offer_b "Website build" \
  --bond_token "$BOND_TOKEN_ID" \
  --bond_amount 100 \
  --reputation_contract "$REPUTATION_ID" \
  --deadline "$DEADLINE"

echo ""
echo "Copy the transaction hash printed above into your README / submission form."
