import React from 'react';

/**
 * Full-screen overlay that blocks interaction while a Soroban transaction
 * is being signed and confirmed on-chain.
 */
export default function TransactionOverlay({ visible, stage }) {
  if (!visible) return null;

  const stages = {
    signing: { label: 'Waiting for wallet signature…', icon: '✍️' },
    submitting: { label: 'Submitting transaction…', icon: '📡' },
    confirming: { label: 'Confirming on-chain…', icon: '⛓️' },
  };

  const current = stages[stage] || stages.confirming;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(244,242,237,0.92)', backdropFilter: 'blur(6px)' }}
    >
      <div className="flex flex-col items-center gap-6 max-w-xs text-center">
        {/* Spinning ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-rule" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
            style={{ animation: 'spin 0.85s linear infinite' }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl"
            style={{ animation: 'none' }}
          >
            {current.icon}
          </span>
        </div>

        <div>
          <p className="font-display font-semibold text-ink text-lg">{current.label}</p>
          <p className="text-xs text-ink/50 mt-1 font-mono">
            This may take 5–30 seconds. Please don&apos;t close the tab.
          </p>
        </div>

        <div className="flex gap-1.5 mt-2">
          {['signing', 'submitting', 'confirming'].map((s) => (
            <span
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === stage ? 'bg-accent' : 'bg-rule'
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
