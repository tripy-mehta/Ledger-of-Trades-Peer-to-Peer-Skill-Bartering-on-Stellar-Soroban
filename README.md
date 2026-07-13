# 🤝 Ledger of Trades - Peer-to-Peer Skill Bartering Protocol

Ledger of Trades is a decentralized bartering protocol built on Stellar (Soroban). It allows two parties to safely swap services (e.g., "I'll design your logo if you build my website") without exchanging money. Instead, both parties post a stablecoin bond. The bond is returned when both sides confirm delivery, or forfeited to the honest party if the other side defaults. Every completed or defaulted trade automatically updates both users' on-chain reputations.

## 🔗 Live Demo & Video Pitch
- **Live Platform**: [ledger-of-trades.vercel.app](https://ledger-of-trades-peer-to-peer-skill.vercel.app/)
- **Demo Video**: [Watch the Demo on Google Drive](https://drive.google.com/file/d/1fGGgj5AZkHstn-jZTLA1eWcAU1cPq6Fa/view?usp=sharing)

## 📜 Deployed Smart Contracts (Stellar Testnet)
- **Reputation Registry**: `CAB6SC4RNZEGLM45KV6NEB22QSJBCFP2Q4NTT34IVGGSD3VKHHOIVX26`
- **Skill Trade Contract**: `CDCIRTNU4VBOGCQPHXCJ2LUTC3YKTCLT7DCHXLOPURJMJRBG6E6MLZNW`
- **Bond Token (Native XLM)**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## 🌟 Key Features

1. **Symmetric Bonds, No Payments**: Swap skills securely. Both parties post an identical bond, ensuring commitment without requiring either side to actually pay for the other's service.
2. **On-Chain Reputation System**: Reputation is a first-class on-chain object. A dedicated Reputation Contract automatically tracks completed (+2) and defaulted (-3) trades to generate a transparent public score.
3. **Inter-Contract Communication**: The SkillTrade contract executes cross-contract calls to the Reputation Registry at two distinct settlement paths (successful delivery and default claims).
4. **Real-time Event Streaming**: The React frontend uses Soroban `getEvents` to stream contract events, providing a live activity feed so users can watch their partner's delivery confirmations in real-time.
5. **Premium Responsive UI**: Built with React and Tailwind CSS, featuring a unique ledger-style interface that mirrors the symmetry of a barter, rather than a generic crypto swap UI.

---

## 📸 Platform Gallery & Submission Requirements

As per the submission checklist, here are the required screenshots demonstrating the platform's capabilities:

### 1. Mobile Responsive UI
The platform is fully responsive and optimized for mobile devices, stacking the two-column ledger beautifully on narrow screens.
<img src="screenshots/MOBILE_UI - Copy.png" width="100%" alt="Mobile Responsive UI" />

### 2. CI/CD Pipeline Running
Automated GitHub Actions workflow running tests and deploying the frontend.
<img src="screenshots/CICD_PIPELINE - Copy.png" width="100%" alt="CI/CD Pipeline" />

### 3. Test Output (3+ Passing Tests)
Comprehensive Rust integration tests and React frontend tests validating the smart contract and UI logic.
<img src="screenshots/test_output - Copy.png" width="100%" alt="Test Output" />

### 4. Trade Lifecycle on Chain
Users can verify their completed barters successfully settled on the Stellar blockchain.
<img src="screenshots/deliverd_onchain - Copy.png" width="100%" alt="Delivered On Chain" />

---

## 🏗️ Architecture

```text
Party A / Party B
        │
        ▼
 React frontend (two-column ledger view, live activity feed)
        │
        ▼
 SkillTrade contract ──────► Token contract (bond deposits & payouts)
        │
        └──────────────────► Reputation contract (record_outcome)
```

**Inter-contract communication**: The Trade contract calls into the Reputation contract at two distinct settlement paths — `settle_completed` (both sides delivered) and `claim_default` (deadline passed, one side didn't deliver). 

---

## 💻 Running Locally

### Contracts
```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace          # run all contract tests
stellar contract build          # build .wasm files
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
```

---

## 🚀 Deployment (Testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This builds both contracts, deploys them to Stellar Testnet, initializes the Reputation contract to authorize the Trade contract, and prints both contract IDs.

---

## ✅ Submission Checklist Mapping

| Requirement | Where |
|---|---|
| Inter-contract communication | `trade::settle_completed` / `claim_default` each call into `reputation` (twice) |
| Event streaming & real-time updates | Contract events + `useContractEvents` polling hook |
| CI/CD pipeline | `.github/workflows/ci.yml` |
| Deployment workflow | `scripts/deploy.sh` |
| Mobile responsive frontend | Tailwind responsive two-column ledger |
| Error handling & loading states | `Banner.jsx`, `Skeleton.jsx`, try/catch in `App.jsx` |
| Tests (contracts + frontend) | `contracts/*/src/test.rs`, `frontend/src/test/*.test.jsx` |
| Documentation | This README + inline doc comments in every contract |

## License
MIT
