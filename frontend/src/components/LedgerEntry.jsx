import React from 'react';

const STATUS_LABELS = {
  Open: 'Awaiting acceptance',
  BothDelivered: 'Settling…',
  Completed: 'Settled',
  Defaulted: 'Defaulted',
};

const STATUS_STYLES = {
  Open: 'border-ink/30 text-ink/60',
  BothDelivered: 'border-accent/40 text-accent bg-accent-soft',
  Completed: 'border-good/40 text-good bg-good/10',
  Defaulted: 'border-bad/40 text-bad bg-bad/10',
};

/**
 * The signature UI element: a two-column ledger entry, styled like a real
 * bookkeeping line, showing exactly what each party owes the other and
 * whether they've delivered. This deliberately reads as a ledger row, not
 * a generic transaction card — the whole point of barter is the symmetry
 * of the two columns.
 */
export default function LedgerEntry({ trade, currentAddress, onAction, actionLoading }) {
  if (!trade) {
    return (
      <div className="ledger-card p-8 text-center">
        <p className="text-ink/50 text-sm">No trade loaded. Propose one or paste a Trade ID to inspect.</p>
      </div>
    );
  }

  const isPartyA = currentAddress === trade.party_a;
  const isPartyB = currentAddress === trade.party_b;
  const myDelivered = isPartyA ? trade.delivered_a : trade.delivered_b;
  const canMarkDelivered = (isPartyA || isPartyB) && trade.status === 'Open' && !myDelivered;
  const deadlinePassed = trade.deadline && Date.now() / 1000 > Number(trade.deadline);

  return (
    <div className="ledger-card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-rule flex items-center justify-between">
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wide">Trade #{trade.id ?? '—'}</span>
        <span className={`pill ${STATUS_STYLES[trade.status] || STATUS_STYLES.Open}`}>
          {STATUS_LABELS[trade.status] || trade.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule">
        <div className="p-5 sm:p-6">
          <p className="text-xs font-mono text-ink/40 uppercase tracking-wide mb-1">Party A gives</p>
          <p className="font-display text-lg text-ink leading-snug">{trade.offer_a}</p>
          <p className="text-xs text-ink/40 font-mono mt-3 truncate">{trade.party_a}</p>
          <span className={`pill mt-2 ${trade.delivered_a ? STATUS_STYLES.Completed : STATUS_STYLES.Open}`}>
            {trade.delivered_a ? 'Delivered' : 'Pending'}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-mono text-ink/40 uppercase tracking-wide mb-1">Party B gives</p>
          <p className="font-display text-lg text-ink leading-snug">{trade.offer_b}</p>
          <p className="text-xs text-ink/40 font-mono mt-3 truncate">{trade.party_b}</p>
          <span className={`pill mt-2 ${trade.delivered_b ? STATUS_STYLES.Completed : STATUS_STYLES.Open}`}>
            {trade.delivered_b ? 'Delivered' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-rule flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink/50 font-mono">
          Bond: {Number(trade.bond_amount).toLocaleString()} tokens each
        </p>
        <div className="flex flex-wrap gap-2">
          {canMarkDelivered && (
            <button
              className="btn-primary text-xs py-2"
              disabled={actionLoading}
              onClick={() => onAction('markDelivered')}
            >
              Mark my side delivered
            </button>
          )}
          {(isPartyA || isPartyB) && deadlinePassed && trade.status !== 'Completed' && trade.status !== 'Defaulted' && (
            <button
              className="btn-secondary text-xs py-2 !border-bad/30 !text-bad"
              disabled={actionLoading}
              onClick={() => onAction('claimDefault')}
            >
              Claim default (deadline passed)
            </button>
          )}
          {trade.status === 'Open' && isPartyB && !trade.accepted && (
            <button className="btn-secondary text-xs py-2" disabled={actionLoading} onClick={() => onAction('accept')}>
              Accept &amp; post bond
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
