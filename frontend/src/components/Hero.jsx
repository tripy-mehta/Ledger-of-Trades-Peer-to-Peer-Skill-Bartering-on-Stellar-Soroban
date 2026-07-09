import React from 'react';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
      <div className="max-w-2xl">
        <span className="pill border-accent/40 text-accent bg-accent-soft">Soroban · Testnet</span>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight mt-4 leading-[1.1] text-ink">
          You build my site.
          <span className="block text-accent">I design your logo.</span>
        </h1>
        <p className="text-ink/70 mt-4 text-base sm:text-lg leading-relaxed font-body">
          No money changes hands. Both sides post a good-faith bond, deliver, and get their bond back —
          or forfeit it if they don't. Every trade closes onto both people's on-chain reputation.
        </p>
      </div>
    </section>
  );
}
