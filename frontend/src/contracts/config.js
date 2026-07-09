// Network + contract configuration.
// Fill in TRADE_CONTRACT_ID and REPUTATION_CONTRACT_ID after running scripts/deploy.sh
export const NETWORK = {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

export const CONTRACTS = {
  TRADE_CONTRACT_ID: import.meta.env.VITE_TRADE_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  REPUTATION_CONTRACT_ID: import.meta.env.VITE_REPUTATION_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  BOND_TOKEN_ID: import.meta.env.VITE_BOND_TOKEN_ID || 'CA...REPLACE_AFTER_DEPLOY',
};
