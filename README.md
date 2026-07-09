# Ledger of Trades — Peer-to-Peer Skill Bartering on Stellar Soroban

Two people swap services instead of money — "I'll design your logo if you
build my website." Neither side pays the other. Instead, both post a
stablecoin bond as a good-faith deposit; the bond returns once both sides
confirm delivery, or gets forfeited to the honest party if the other side
never delivers. Every closed trade updates both people's on-chain
reputation via a dedicated Reputation contract.

Built for the Stellar Orange Belt submission — a genuinely different domain
(barter + reputation) from payment escrow or ticketing.

---

## Why this project

Barter has no natural enforcement mechanism — if I design your logo first
and you never build my website, I have no recourse. This project gives
barter the same commitment device that money escrow has, without requiring
either side to actually pay for the other's service:

- **Symmetric bonds, not payment.** Both parties post the same bond amount; nobody's service is priced against the other's.
- **Reputation is a first-class on-chain object**, not a star rating on a centralized platform — anyone can recompute a user's score from their public trade history.
- **Default is asymmetric on purpose.** If one side delivers and the other doesn't, the delivering party still gets `Completed` on their record — only the non-deliverer takes the reputation hit.

---

## Architecture

```
Party A / Party B
        │
        ▼
 React frontend (two-column ledger view, live activity feed)
        │
        ▼
 SkillTrade contract ──────► Token contract (bond deposits & payouts)
        │
        └──────────────────► Reputation contract (record_outcome, called once per participant)
```

**Inter-contract communication**: the Trade contract calls into the
Reputation contract at two distinct settlement paths —
`settle_completed` (both sides delivered) and `claim_default` (deadline
passed, one side didn't deliver) — each making **two** cross-contract calls,
once per participant, since a trade's outcome can be asymmetric (one party
`Completed`, the other `Defaulted`). The Reputation contract requires
`trade_contract.require_auth()` on `record_outcome`, so only the authorized
Trade contract instance can write to anyone's score.

**Event streaming**: every state change (`TradeProposed`, `DeliveryMarked`,
`TradeCompleted`, `TradeDefaulted`) is emitted as a Soroban contract event.
The frontend's `useContractEvents` hook polls `getEvents` on a short
interval and renders a live activity feed, so both parties can watch the
other side's delivery confirmation land in real time.

---

## Project structure

```
skill-barter/
├── contracts/
│   ├── trade/            # Main contract: propose, accept, deliver, settle
│   │   └── src/
│   │       ├── lib.rs
│   │       └── test.rs   # 7 unit tests
│   └── reputation/         # Score + history, called cross-contract
│       └── src/
│           ├── lib.rs
│           └── test.rs   # 6 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/    # LedgerEntry, ProposeTradeForm, ReputationCard
│   │   ├── hooks/         # useWallet, useContractEvents
│   │   ├── contracts/     # tradeClient.js, config.js
│   │   └── test/          # Vitest + Testing Library specs
│   └── package.json
├── scripts/
│   ├── deploy.sh              # Deploys + initializes both contracts to testnet
│   └── sample_interaction.sh  # Runs propose_trade for a demo tx hash
├── .github/workflows/ci.yml   # CI: contract tests + frontend tests + build
└── vercel.json
```

---

## Smart contract design

### SkillTrade contract (`contracts/trade`)

| Function | Caller | What it does |
|---|---|---|
| `propose_trade` | Party A | Posts party A's bond, records both offers and a deadline |
| `accept_trade` | Party B | Posts party B's matching bond |
| `mark_delivered` | Either party | Flags their own side as delivered; auto-settles once both are |
| `claim_default` | The non-defaulting party, after deadline | Awards both bonds to the honest party |
| `get_trade` | Anyone (read-only) | Returns full trade state |

### Reputation contract (`contracts/reputation`)

| Function | Caller | What it does |
|---|---|---|
| `initialize` | Deployer | Authorizes the one Trade contract permitted to record outcomes |
| `record_outcome` | Trade contract only | +2 score for `Completed`, -3 (floored at 0) for `Defaulted`; appends history |
| `get_profile` | Anyone (read-only) | Returns score, completed count, defaulted count |
| `get_history` | Anyone (read-only) | Returns the full list of past trade outcomes for a user |

Errors are typed contract errors (`TradeError`, `ReputationError`) rather
than panics, so the frontend gets a clean, catchable failure reason — e.g.
"deadline not yet passed" when someone tries to claim a default early —
instead of a raw trap.

---

## Frontend

- **React 18 + Vite + Tailwind**, mobile-first, styled around a ledger/
  notebook metaphor — a two-column entry showing exactly what each side
  gives and whether they've delivered, rather than a generic transaction
  card. This mirrors the actual symmetry of a barter.
- **Wallet connect** via Stellar Wallets Kit (Freighter, xBull, Albedo, etc.).
- **Three views**: Propose (start a trade), My trade (look up and act on a
  trade by ID), Reputation (look up any address's score and history).
- **Live activity feed** driven by `useContractEvents` (polls Soroban RPC `getEvents`).
- **Error and loading states** throughout: skeleton loaders while fetching a
  trade, dismissible error/success banners, disabled buttons mid-transaction,
  a clear "deadline not passed" message surfaced straight from the contract error.

### Environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the contract IDs
from `scripts/deploy.sh`:

```
VITE_TRADE_CONTRACT_ID=
VITE_REPUTATION_CONTRACT_ID=
VITE_BOND_TOKEN_ID=
```

---

## Running locally

### Contracts

```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace          # run all contract tests
stellar contract build           # build .wasm files
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
npm run build     # production build
```

---

## Deployment (testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This builds both contracts, deploys them to Stellar Testnet, initializes the
Reputation contract to authorize the Trade contract, and prints both
contract IDs.

Then run the sample interaction script to propose a demo trade and get a
real transaction hash for your submission:

```bash
chmod +x scripts/sample_interaction.sh
# fill in the contract IDs at the top of the script first
./scripts/sample_interaction.sh
```

Deploy the frontend to Vercel/Netlify pointing at `frontend/` as the root
(see `vercel.json`), with the three `VITE_*` env vars set in the dashboard.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Contracts job** — builds both contracts to `wasm32-unknown-unknown` and runs `cargo test --workspace`.
2. **Frontend job** — installs deps, lints, runs Vitest, builds the production bundle.
3. **Deploy-readiness job** — gates on both passing before signaling the build is deploy-ready.

---

## Testing

- **Contracts**: 13 Rust unit tests total (7 in `trade`, 6 in `reputation`) covering the happy path, price/deadline edge cases, double delivery, unauthorized callers, and score floor behavior. Run with `cargo test --workspace`.
- **Frontend**: Vitest + React Testing Library specs for the ledger entry's role-gated actions and the reputation lookup card. Run with `npm run test` inside `frontend/`.

---

## Submission checklist mapping

| Requirement | Where |
|---|---|
| Inter-contract communication | `trade::settle_completed` / `claim_default` each call into `reputation` (twice) |
| Event streaming & real-time updates | Contract events + `useContractEvents` polling hook |
| CI/CD pipeline | `.github/workflows/ci.yml` |
| Deployment workflow | `scripts/deploy.sh` |
| Mobile responsive frontend | Tailwind responsive two-column ledger, stacks on narrow screens |
| Error handling & loading states | `Banner.jsx`, `Skeleton.jsx`, try/catch in `App.jsx` |
| Tests (contracts + frontend) | `contracts/*/src/test.rs`, `frontend/src/test/*.test.jsx` |
| Documentation | This README + inline doc comments in every contract |

---

## License

MIT
