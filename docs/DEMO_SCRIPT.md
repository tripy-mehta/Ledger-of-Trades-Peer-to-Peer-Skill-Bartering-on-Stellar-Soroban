# Demo video script (1–2 minutes)

Use two browser profiles (or two devices) to represent Party A and Party B.

1. **(0:00–0:15) Hook** — "This is peer-to-peer skill bartering — no money
   changes hands, both sides post a bond, and completing your side of the
   trade builds on-chain reputation."

2. **(0:15–0:35) Propose & accept** — As Party A, propose a trade ("Logo
   design" for "Website build"), show the bond transaction confirm. Switch
   to Party B, accept the trade, show their bond post. Point out both bonds
   now sitting in the contract on the ledger view.

3. **(0:35–0:55) Deliver** — Party A marks their side delivered — show the
   live activity feed pick up `DeliveryMarked` instantly on Party B's
   screen. Party B marks their side delivered — show the trade auto-settle,
   both bonds return, and `TradeCompleted` fire.

4. **(0:55–1:15) Reputation** — Switch to the Reputation view, look up
   Party A's address, show the score go up and "1 completed" appear. Briefly
   explain the default path: if one side never delivers, the honest party
   can claim both bonds after the deadline and the non-deliverer's score
   drops.

5. **(1:15–1:30) Wrap-up** — Resize to phone width to show mobile
   responsiveness, show `cargo test --workspace` passing, and show the
   GitHub Actions CI run green.

Keep narration plain and specific — name what's on screen, not what it's
"powered by."
