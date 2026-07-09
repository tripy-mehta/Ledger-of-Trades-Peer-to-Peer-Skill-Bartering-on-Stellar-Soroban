import React from 'react';

export default function Skeleton() {
  return (
    <div className="ledger-card p-6 space-y-4 animate-pulse" role="status" aria-label="Loading trade data">
      <div className="h-4 w-32 bg-rule rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-rule/60 rounded-card" />
        <div className="h-24 bg-rule/60 rounded-card" />
      </div>
    </div>
  );
}
