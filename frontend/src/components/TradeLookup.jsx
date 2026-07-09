import React, { useState } from 'react';

export default function TradeLookup({ onLookup, loading }) {
  const [tradeId, setTradeId] = useState('');

  return (
    <div className="ledger-card p-5 sm:p-6">
      <h3 className="font-display text-xl font-semibold text-ink mb-3">Find a trade</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
          placeholder="Trade ID (e.g. 0)"
          className="flex-1 bg-page border border-rule rounded-card px-3 py-2 text-sm font-mono text-ink focus:border-accent/60 outline-none"
        />
        <button onClick={() => onLookup(tradeId)} disabled={loading || tradeId === ''} className="btn-secondary text-sm">
          {loading ? 'Loading…' : 'Load trade'}
        </button>
      </div>
    </div>
  );
}
