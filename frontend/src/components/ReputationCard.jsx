import React, { useState } from 'react';

const KNOWN_TRADERS = [
  { address: 'GBXH7OCXCWVUFQWP4SIQBGMJ4MIM7DMFNELKKLBI7KCLJ7GDYGPSUGQ', label: 'alice.stellar' },
  { address: 'GA7QYNF7SOWQ3GLR2BGMZEHXR2R5PVXD5QZLPV6KBF7NXKC2RXY3ZGQ', label: 'bob.stellar' },
];

function truncate(addr) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ScoreBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-rule rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #8B5E3C, #c48a5c)',
        }}
      />
    </div>
  );
}

export default function ReputationCard({ onLookup, profile, loading, walletAddress }) {
  const [address, setAddress] = useState('');

  const total = profile ? Number(profile.completed_trades) + Number(profile.defaulted_trades) : 0;
  const reliability = total > 0 ? Math.round((Number(profile.completed_trades) / total) * 100) : null;
  const score = profile ? Number(profile.score) : 0;

  const scoreColor =
    score >= 10 ? 'text-good' : score >= 4 ? 'text-accent' : 'text-bad';

  const handleMyReputation = () => {
    if (walletAddress) {
      setAddress(walletAddress);
      onLookup(walletAddress);
    }
  };

  return (
    <div className="ledger-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-ink">Reputation</h3>
        {walletAddress && (
          <button
            onClick={handleMyReputation}
            className="text-xs text-accent border border-accent/30 rounded px-2 py-1 hover:bg-accent-soft transition-colors"
          >
            My score
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="G... address"
          className="flex-1 bg-page border border-rule rounded-card px-3 py-2 text-sm font-mono focus:border-accent/60 outline-none"
        />
        <button onClick={() => onLookup(address)} disabled={loading || !address} className="btn-secondary text-sm">
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </div>

      {/* Known traders quick-select */}
      <div className="flex flex-wrap gap-1.5">
        {KNOWN_TRADERS.map((t) => (
          <button
            key={t.address}
            onClick={() => { setAddress(t.address); onLookup(t.address); }}
            className="text-[10px] font-mono text-ink/50 border border-rule rounded px-2 py-0.5 hover:border-accent/40 hover:text-accent transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      {profile && (
        <div className="pt-3 border-t border-rule space-y-4">
          {/* Big score */}
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-5xl font-display font-bold ${scoreColor}`}>{score}</p>
              <p className="text-xs text-ink/50 mt-1">Reputation score</p>
            </div>
            {reliability !== null && (
              <div className="text-right">
                <p className="text-2xl font-display font-semibold text-ink">{reliability}%</p>
                <p className="text-xs text-ink/50">Reliability</p>
              </div>
            )}
          </div>

          <ScoreBar value={score} max={Math.max(score + 5, 20)} />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-good/10 border border-good/30 rounded-card px-3 py-2.5 text-center">
              <p className="text-2xl font-display font-semibold text-good">
                {Number(profile.completed_trades)}
              </p>
              <p className="text-xs text-ink/50 mt-0.5">Completed</p>
            </div>
            <div className="bg-bad/10 border border-bad/30 rounded-card px-3 py-2.5 text-center">
              <p className="text-2xl font-display font-semibold text-bad">
                {Number(profile.defaulted_trades)}
              </p>
              <p className="text-xs text-ink/50 mt-0.5">Defaulted</p>
            </div>
          </div>

          {total > 0 && (
            <p className="text-xs text-ink/40 font-mono text-center">
              {total} trade{total !== 1 ? 's' : ''} on record · +2 per complete, −3 per default
            </p>
          )}
        </div>
      )}

      {!profile && !loading && (
        <p className="text-xs text-ink/40 text-center py-4">
          Enter a wallet address to see their on-chain barter history.
        </p>
      )}
    </div>
  );
}
