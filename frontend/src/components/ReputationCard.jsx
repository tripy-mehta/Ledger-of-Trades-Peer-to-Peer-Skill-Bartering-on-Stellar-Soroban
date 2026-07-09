import React, { useState } from 'react';

export default function ReputationCard({ onLookup, profile, loading }) {
  const [address, setAddress] = useState('');

  const total = profile ? profile.completed_trades + profile.defaulted_trades : 0;
  const reliability = total > 0 ? Math.round((profile.completed_trades / total) * 100) : null;

  return (
    <div className="ledger-card p-5 sm:p-6 space-y-4">
      <h3 className="font-display text-xl font-semibold text-ink">Look up reputation</h3>
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

      {profile && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-rule">
          <div>
            <p className="text-2xl font-display font-semibold text-accent">{profile.score}</p>
            <p className="text-xs text-ink/50 mt-1">Score</p>
          </div>
          <div>
            <p className="text-2xl font-display font-semibold text-good">{profile.completed_trades}</p>
            <p className="text-xs text-ink/50 mt-1">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-display font-semibold text-bad">{profile.defaulted_trades}</p>
            <p className="text-xs text-ink/50 mt-1">Defaulted</p>
          </div>
          {reliability !== null && (
            <p className="col-span-3 text-xs text-ink/50 font-mono pt-1">{reliability}% reliability over {total} trades</p>
          )}
        </div>
      )}
    </div>
  );
}
