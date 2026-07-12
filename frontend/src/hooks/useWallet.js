import { useCallback, useEffect, useState } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from '@creit.tech/stellar-wallets-kit';
import { NETWORK } from '../contracts/config';

let kitInstance = null;

function getKit() {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: undefined,
      modules: allowAllModules(),
    });
  }
  return kitInstance;
}

/**
 * Wallet connection + signing hook. Wraps Stellar Wallets Kit so components
 * never touch the underlying provider directly.
 */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const response = await fetch(`${NETWORK.horizonUrl}/accounts/${addr}`);
      if (response.ok) {
        const data = await response.json();
        const nativeBalance = data.balances.find((b) => b.asset_type === 'native');
        setBalance(nativeBalance ? nativeBalance.balance : '0');
      } else {
        setBalance('0');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance('0');
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ledger:lastAddress');
    if (saved) {
      setAddress(saved);
      fetchBalance(saved);
    }
  }, [fetchBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const kit = getKit();
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address: addr } = await kit.getAddress();
          setAddress(addr);
          localStorage.setItem('ledger:lastAddress', addr);
          fetchBalance(addr);
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    localStorage.removeItem('ledger:lastAddress');
  }, []);

  const signTransaction = useCallback(async (xdr) => {
    const kit = getKit();
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      networkPassphrase: NETWORK.networkPassphrase,
      address,
    });
    return signedTxXdr;
  }, [address]);

  return {
    address,
    balance,
    connecting,
    error,
    connect,
    disconnect,
    signTransaction,
    isConnected: !!address,
    refreshBalance: () => fetchBalance(address),
  };
}
