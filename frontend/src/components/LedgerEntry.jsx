import React from 'react';

const STATUS_LABELS = {
  Open: 'Awaiting acceptance',
  BothDelivered: 'Settling…',
  Completed: 'Settled ✓',
  Defaulted: 'Defaulted',
};

const STATUS_STYLES = {
  Open: 'border-ink/30 text-ink/60',
  BothDelivered: 'border-accent/40 text-accent bg-accent-soft',
  Completed: 'border-good/40 text-good bg-good/10',
  Defaulted: 'border-bad/40 text-bad bg-bad/10',
};

function addrMatch(a, b) {
  if (!a || !b) return false;
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

function getStatusKey(status) {
  if (!status) return 'Open';
  if (typeof status === 'string') return status;
  // Handle Soroban SDK returning enums as objects e.g. { Open: null }
  const key = Object.keys(status)[0];
  return key || 'Open';
}

function PartyColumn({ label, offer, address, delivered, isMe }) {
  return (
    <div className={`p-5 sm:p-6 ${isMe ? 'bg-accent-soft/30' : ''}`}>
      <p className="text-xs font-mono text-ink/40 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {label}
        {isMe && <span className="text-accent font-semibold">(You)</span>}
      </p>
      <p className="font-display text-lg text-ink leading-snug">{offer}</p>
      <p className="text-xs text-ink/40 font-mono mt-3 truncate">{address}</p>
      <span className={`pill mt-2 ${delivered ? STATUS_STYLES.Completed : STATUS_STYLES.Open}`}>
        {delivered ? '✓ Delivered' : 'Pending'}
      </span>
    </div>
  );
}

export default function LedgerEntry({ trade, currentAddress, onAction, actionLoading }) {
  if (!trade) {
    return (
      <div className="ledger-card p-8 text-center">
        <p className="text-ink/50 text-sm">No trade loaded. Propose one or enter a Trade ID above to inspect.</p>
      </div>
    );
  }

  const statusKey = getStatusKey(trade.status);
  const isPartyA = addrMatch(currentAddress, trade.party_a);
  const isPartyB = addrMatch(currentAddress, trade.party_b);
  const isParticipant = isPartyA || isPartyB;
  const isOpen = statusKey === 'Open';
  const isCompleted = statusKey === 'Completed' || statusKey === 'BothDelivered' || statusKey === 'Defaulted';
  const myDelivered = isPartyA ? trade.delivered_a : trade.delivered_b;
  const deadlinePassed = trade.deadline && Date.now() / 1000 > Number(trade.deadline);

  const canAccept = isPartyB && isOpen;
  const canMarkDelivered = isParticipant && isOpen && !myDelivered && !deadlinePassed;
  const canClaimDefault = isParticipant && deadlinePassed && !isCompleted;

  let nextStep = null;
  if (!isParticipant && isOpen) {
    nextStep = 'You are viewing this trade as an observer.';
  } else if (!currentAddress) {
    nextStep = '🔌 Connect your wallet to interact with this trade.';
  } else if (canAccept) {
    nextStep = '👇 Post your bond to accept this trade and lock in the agreement.';
  } else if (isPartyA && isOpen) {
    nextStep = '⏳ Waiting for your trading partner to accept and post their bond.';
  } else if (canMarkDelivered) {
    nextStep = '👇 When you have completed your side of the deal, click "Mark my side delivered".';
  } else if (statusKey === 'Completed') {
    nextStep = '🎉 Both sides delivered — bonds returned and reputations updated!';
  } else if (statusKey === 'Defaulted') {
    nextStep = '⚠️ Trade defaulted — the honest party received both bonds.';
  }

  return (
    <div className="ledger-card overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-rule flex items-center justify-between">
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wide">Trade #{trade.id ?? '—'}</span>
        <span className={`pill ${STATUS_STYLES[statusKey] || STATUS_STYLES.Open}`}>
          {STATUS_LABELS[statusKey] || statusKey}
        </span>
      </div>

      {/* Two-column offers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule">
        <PartyColumn
          label="Party A gives"
          offer={trade.offer_a}
          address={trade.party_a}
          delivered={trade.delivered_a}
          isMe={isPartyA}
        />
        <PartyColumn
          label="Party B gives"
          offer={trade.offer_b}
          address={trade.party_b}
          delivered={trade.delivered_b}
          isMe={isPartyB}
        />
      </div>

      {/* Next-step hint */}
      {nextStep && (
        <div className="px-5 sm:px-6 py-3 border-t border-rule bg-accent-soft/20">
          <p className="text-xs text-ink/70">{nextStep}</p>
        </div>
      )}

      {/* Action footer — always visible */}
      <div className="px-5 sm:px-6 py-4 border-t border-rule">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-ink/50 font-mono">
              Bond: {Number(trade.bond_amount).toLocaleString()} stroops each
            </p>
            {trade.deadline && (
              <p className="text-xs text-ink/40 font-mono">
                Deadline: {new Date(Number(trade.deadline) * 1000).toLocaleDateString()}
                {deadlinePassed && <span className="text-bad ml-1">— passed</span>}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* ACCEPT: shown for party_b when trade is open */}
            {canAccept && (
              <button
                id="accept-trade-btn"
                className="btn-primary text-sm py-2 px-4"
                style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                disabled={actionLoading}
                onClick={() => onAction('accept')}
              >
                ✅ Accept &amp; post bond
              </button>
            )}

            {/* MARK DELIVERED */}
            {canMarkDelivered && (
              <button
                id="mark-delivered-btn"
                className="btn-primary text-xs py-2"
                disabled={actionLoading}
                onClick={() => onAction('markDelivered')}
              >
                Mark my side delivered
              </button>
            )}

            {/* CLAIM DEFAULT */}
            {canClaimDefault && (
              <button
                id="claim-default-btn"
                className="btn-secondary text-xs py-2 !border-bad/30 !text-bad"
                disabled={actionLoading}
                onClick={() => onAction('claimDefault')}
              >
                Claim default (deadline passed)
              </button>
            )}

            {/* FALLBACK: if wallet connected but not matching either party */}
            {currentAddress && !isParticipant && (
              <p className="text-xs text-ink/40 italic">
                Connect with Party A or B&apos;s wallet to interact.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
