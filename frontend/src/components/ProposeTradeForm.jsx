import React, { useState } from 'react';

export default function ProposeTradeForm({ onPropose, loading }) {
  const [partyB, setPartyB] = useState('');
  const [offerA, setOfferA] = useState('');
  const [offerB, setOfferB] = useState('');
  const [bondAmount, setBondAmount] = useState('');
  const [daysUntilDeadline, setDaysUntilDeadline] = useState('14');

  const canSubmit = partyB && offerA && offerB && bondAmount;

  return (
    <form
      className="ledger-card p-5 sm:p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const deadline = Math.floor(Date.now() / 1000) + Number(daysUntilDeadline) * 86400;
        onPropose({ partyB, offerA, offerB, bondAmount: Number(bondAmount), deadline });
      }}
    >
      <h3 className="font-display text-xl font-semibold text-ink">Propose a trade</h3>

      <div>
        <label className="block text-xs text-ink/50 mb-1.5">Trading partner's address</label>
        <input
          value={partyB}
          onChange={(e) => setPartyB(e.target.value)}
          placeholder="G..."
          className="w-full bg-page border border-rule rounded-card px-3 py-2 text-sm font-mono text-ink focus:border-accent/60 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">What you'll deliver</label>
          <input
            value={offerA}
            onChange={(e) => setOfferA(e.target.value)}
            placeholder="Logo design"
            className="w-full bg-page border border-rule rounded-card px-3 py-2 text-sm focus:border-accent/60 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">What they'll deliver</label>
          <input
            value={offerB}
            onChange={(e) => setOfferB(e.target.value)}
            placeholder="Website build"
            className="w-full bg-page border border-rule rounded-card px-3 py-2 text-sm focus:border-accent/60 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Good-faith bond (each side)</label>
          <input
            value={bondAmount}
            onChange={(e) => setBondAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="50"
            className="w-full bg-page border border-rule rounded-card px-3 py-2 text-sm font-mono focus:border-accent/60 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Deadline (days from now)</label>
          <input
            value={daysUntilDeadline}
            onChange={(e) => setDaysUntilDeadline(e.target.value)}
            type="number"
            min="1"
            className="w-full bg-page border border-rule rounded-card px-3 py-2 text-sm font-mono focus:border-accent/60 outline-none"
          />
        </div>
      </div>

      <button type="submit" disabled={!canSubmit || loading} className="btn-primary text-sm w-full">
        {loading ? 'Posting bond…' : 'Propose trade & post bond'}
      </button>
    </form>
  );
}
