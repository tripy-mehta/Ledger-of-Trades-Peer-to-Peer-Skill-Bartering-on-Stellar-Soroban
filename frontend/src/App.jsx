import React, { useState } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import ProposeTradeForm from './components/ProposeTradeForm';
import LedgerEntry from './components/LedgerEntry';
import TradeLookup from './components/TradeLookup';
import ReputationCard from './components/ReputationCard';
import EventFeed from './components/EventFeed';
import Banner from './components/Banner';
import Skeleton from './components/Skeleton';
import { useWallet } from './hooks/useWallet';
import { useContractEvents } from './hooks/useContractEvents';
import { tradeClient, reputationClient } from './contracts/tradeClient';
import { CONTRACTS } from './contracts/config';

export default function App() {
  const wallet = useWallet();
  const { events, connected, error: eventError } = useContractEvents();

  const [view, setView] = useState('propose');
  const [trade, setTrade] = useState(null);
  const [currentTradeId, setCurrentTradeId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingTrade, setLoadingTrade] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleLookupTrade(tradeId) {
    setError(null);
    setLoadingTrade(true);
    try {
      const result = await tradeClient.getTrade(tradeId, wallet.address);
      setTrade({ ...result, id: tradeId });
      setCurrentTradeId(tradeId);
    } catch (err) {
      setError(`Could not load trade #${tradeId}. It may not exist, or contract IDs in config.js need updating. (${err.message})`);
      setTrade(null);
    } finally {
      setLoadingTrade(false);
    }
  }

  async function handlePropose({ partyB, offerA, offerB, bondAmount, deadline }) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to propose a trade.');
      return;
    }
    setError(null);
    setProposing(true);
    try {
      const { hash } = await tradeClient.proposeTrade(
        wallet.address,
        partyB,
        offerA,
        offerB,
        CONTRACTS.BOND_TOKEN_ID,
        bondAmount,
        CONTRACTS.REPUTATION_CONTRACT_ID,
        deadline,
        wallet.signTransaction
      );
      setSuccess(`Trade proposed and bond posted. Transaction: ${hash}`);
      setView('trade');
    } catch (err) {
      setError(`Failed to propose trade: ${err.message}`);
    } finally {
      setProposing(false);
    }
  }

  async function handleAction(action) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first.');
      return;
    }
    if (currentTradeId === null) return;
    setError(null);
    setActionLoading(true);
    try {
      let result;
      if (action === 'accept') {
        result = await tradeClient.acceptTrade(currentTradeId, wallet.address, wallet.signTransaction);
      } else if (action === 'markDelivered') {
        result = await tradeClient.markDelivered(currentTradeId, wallet.address, wallet.signTransaction);
      } else if (action === 'claimDefault') {
        result = await tradeClient.claimDefault(currentTradeId, wallet.address, wallet.signTransaction);
      }
      setSuccess(`Action confirmed on-chain. Transaction: ${result.hash}`);
      await handleLookupTrade(currentTradeId);
    } catch (err) {
      setError(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLookupReputation(address) {
    setError(null);
    setLoadingProfile(true);
    try {
      const result = await reputationClient.getProfile(address, wallet.address || address);
      setProfile(result);
    } catch (err) {
      setError(`Could not load reputation for that address. (${err.message})`);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar wallet={wallet} view={view} onViewChange={setView} />
      {view === 'propose' && <Hero />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {(error || wallet.error) && <Banner type="error" message={error || wallet.error} onDismiss={() => setError(null)} />}
        {success && <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {view === 'propose' && <ProposeTradeForm onPropose={handlePropose} loading={proposing} />}

            {view === 'trade' && (
              <>
                <TradeLookup onLookup={handleLookupTrade} loading={loadingTrade} />
                {loadingTrade ? (
                  <Skeleton />
                ) : (
                  <LedgerEntry
                    trade={trade}
                    currentAddress={wallet.address}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                  />
                )}
              </>
            )}

            {view === 'reputation' && (
              <ReputationCard onLookup={handleLookupReputation} profile={profile} loading={loadingProfile} />
            )}
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={events} connected={connected} error={eventError} />
          </div>
        </div>
      </main>

      <footer className="border-t border-rule py-8 text-center">
        <p className="text-xs text-ink/40 font-mono">
          Ledger of Trades · Soroban Testnet · Trade {CONTRACTS.TRADE_CONTRACT_ID.slice(0, 6)}…{CONTRACTS.TRADE_CONTRACT_ID.slice(-4)}
        </p>
      </footer>
    </div>
  );
}
