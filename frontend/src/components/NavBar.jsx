import React from 'react';

function truncate(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function NavBar({ wallet, view, onViewChange }) {
  return (
    <header className="sticky top-0 z-30 bg-page/90 backdrop-blur border-b border-rule">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-card bg-accent-soft border border-accent/40 flex items-center justify-center">
            <span className="font-display font-semibold text-accent text-sm">L</span>
          </div>
          <span className="font-display font-semibold text-lg text-ink">Ledger of Trades</span>
          <span className="hidden sm:inline text-[10px] font-mono text-ink/50 border border-rule rounded px-1.5 py-0.5 ml-1 uppercase">
            testnet
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {[
            { id: 'propose', label: 'Propose' },
            { id: 'trade', label: 'My trade' },
            { id: 'reputation', label: 'Reputation' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`text-sm px-3 py-1.5 rounded-card transition-colors ${
                view === v.id ? 'bg-accent-soft border border-accent/30 text-ink' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        {wallet.isConnected ? (
          <div className="flex items-center gap-2">
            {wallet.balance && (
              <span className="text-xs font-mono text-ink/70 bg-page border border-rule px-2 py-1 rounded-card">
                {parseFloat(wallet.balance).toFixed(2)} XLM
              </span>
            )}
            <button onClick={wallet.disconnect} className="btn-secondary text-sm font-mono">
              {truncate(wallet.address)}
            </button>
          </div>
        ) : (
          <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-primary text-sm">
            {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      <div className="sm:hidden flex border-t border-rule">
        {[
          { id: 'propose', label: 'Propose' },
          { id: 'trade', label: 'My trade' },
          { id: 'reputation', label: 'Reputation' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex-1 text-xs py-2.5 ${view === v.id ? 'text-accent border-b-2 border-accent' : 'text-ink/50'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
