//! Reputation Registry Contract
//!
//! Tracks on-chain trade-completion history and a running reputation score
//! per user. The Trade contract calls into this contract cross-contract
//! whenever a barter closes — either successfully (both parties delivered)
//! or in default (one party failed to deliver and forfeited their bond).
//!
//! Score model: +2 for a completed trade, -3 for a defaulted trade, floor of
//! 0. This is intentionally simple and transparent rather than a black-box
//! algorithm — anyone can recompute a user's score from their on-chain
//! history.

#![no_std]

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TradeOutcome {
    Completed,
    Defaulted,
}

#[contracttype]
#[derive(Clone)]
pub struct TradeRecord {
    pub trade_id: u64,
    pub counterparty: Address,
    pub outcome: TradeOutcome,
    pub ledger_timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ReputationProfile {
    pub score: u32,
    pub completed_trades: u32,
    pub defaulted_trades: u32,
}

#[contracttype]
pub enum DataKey {
    AuthorizedTrade,
    Profile(Address),
    History(Address), // Vec<TradeRecord>
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ReputationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct ReputationUpdated {
    #[topic]
    pub user: Address,
    pub trade_id: u64,
    pub outcome: TradeOutcome,
    pub new_score: u32,
}

const COMPLETE_DELTA: u32 = 2;
const DEFAULT_PENALTY: u32 = 3;

#[contract]
pub struct ReputationRegistryContract;

#[contractimpl]
impl ReputationRegistryContract {
    /// Set the single Trade contract permitted to record outcomes.
    pub fn initialize(env: Env, trade_contract: Address) -> Result<(), ReputationError> {
        if env.storage().instance().has(&DataKey::AuthorizedTrade) {
            return Err(ReputationError::AlreadyInitialized);
        }
        trade_contract.require_auth();
        env.storage().instance().set(&DataKey::AuthorizedTrade, &trade_contract);
        Ok(())
    }

    /// Called cross-contract by the Trade contract when a trade closes.
    /// Records history and updates the running score for one participant.
    /// The Trade contract calls this once per participant (so both sides of
    /// a barter get their own outcome — e.g. the defaulting party gets
    /// `Defaulted` while the delivering party still gets `Completed`).
    pub fn record_outcome(
        env: Env,
        user: Address,
        trade_id: u64,
        counterparty: Address,
        outcome: TradeOutcome,
    ) -> Result<u32, ReputationError> {
        let trade_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedTrade)
            .ok_or(ReputationError::NotInitialized)?;
        trade_contract.require_auth();

        let mut profile: ReputationProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Profile(user.clone()))
            .unwrap_or(ReputationProfile { score: 0, completed_trades: 0, defaulted_trades: 0 });

        match outcome {
            TradeOutcome::Completed => {
                profile.score += COMPLETE_DELTA;
                profile.completed_trades += 1;
            }
            TradeOutcome::Defaulted => {
                profile.score = profile.score.saturating_sub(DEFAULT_PENALTY);
                profile.defaulted_trades += 1;
            }
        }
        env.storage().persistent().set(&DataKey::Profile(user.clone()), &profile);

        let history_key = DataKey::History(user.clone());
        let mut history: Vec<TradeRecord> = env.storage().persistent().get(&history_key).unwrap_or(Vec::new(&env));
        history.push_back(TradeRecord {
            trade_id,
            counterparty,
            outcome: outcome.clone(),
            ledger_timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        ReputationUpdated { user, trade_id, outcome, new_score: profile.score }.publish(&env);
        Ok(profile.score)
    }

    pub fn get_profile(env: Env, user: Address) -> ReputationProfile {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(user))
            .unwrap_or(ReputationProfile { score: 0, completed_trades: 0, defaulted_trades: 0 })
    }

    pub fn get_history(env: Env, user: Address) -> Vec<TradeRecord> {
        env.storage().persistent().get(&DataKey::History(user)).unwrap_or(Vec::new(&env))
    }
}

mod test;
