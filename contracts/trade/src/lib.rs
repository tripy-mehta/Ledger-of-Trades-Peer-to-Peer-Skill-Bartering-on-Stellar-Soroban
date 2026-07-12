//! Skill Trade Contract
//!
//! Two people agree to swap services instead of money — "I'll design your
//! logo if you build my website." Neither side pays the other; instead both
//! post a good-faith stablecoin bond into this contract. Each party marks
//! their own side as delivered. Once both sides confirm, both bonds return
//! to their original owners and the trade closes as `Completed` on both
//! reputations. If a deadline passes with one side undelivered, the honest
//! party can claim the defaulting party's bond, and the trade closes as
//! `Defaulted` for the non-deliverer only.
//!
//! Every close makes a cross-contract call into the Reputation contract —
//! once per participant, since a trade can resolve asymmetrically (one
//! party delivered, the other didn't).

#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String};

mod reputation {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/reputation_registry.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TradeStatus {
    Open,
    BothDelivered,
    Completed,
    Defaulted,
}

#[contracttype]
#[derive(Clone)]
pub struct Trade {
    pub party_a: Address,
    pub party_b: Address,
    pub offer_a: String, // what party_a is delivering, e.g. "Logo design"
    pub offer_b: String, // what party_b is delivering, e.g. "Website build"
    pub bond_token: Address,
    pub bond_amount: i128, // each party posts this amount
    pub reputation_contract: Address,
    pub delivered_a: bool,
    pub delivered_b: bool,
    pub deadline: u64,
    pub status: TradeStatus,
}

#[contracttype]
pub enum DataKey {
    Trade(u64),
    NextTradeId,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TradeError {
    TradeNotFound = 1,
    Unauthorized = 2,
    InvalidStatus = 3,
    DeadlineNotPassed = 4,
    DeadlineAlreadyPassed = 5,
    AlreadyDelivered = 6,
}



#[contract]
pub struct SkillTradeContract;

#[contractimpl]
impl SkillTradeContract {
    /// party_a proposes a trade; both parties must each post `bond_amount`
    /// as collateral before the trade is considered open. This call pulls
    /// party_a's bond immediately; party_b posts theirs via `accept_trade`.
    pub fn propose_trade(
        env: Env,
        party_a: Address,
        party_b: Address,
        offer_a: String,
        offer_b: String,
        bond_token: Address,
        bond_amount: i128,
        reputation_contract: Address,
        deadline: u64,
    ) -> Result<u64, TradeError> {
        party_a.require_auth();

        let token_client = token::Client::new(&env, &bond_token);
        token_client.transfer(&party_a, &env.current_contract_address(), &bond_amount);

        let trade_id: u64 = env.storage().instance().get(&DataKey::NextTradeId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextTradeId, &(trade_id + 1));

        let trade = Trade {
            party_a: party_a.clone(),
            party_b: party_b.clone(),
            offer_a,
            offer_b,
            bond_token,
            bond_amount,
            reputation_contract,
            delivered_a: false,
            delivered_b: false,
            deadline,
            status: TradeStatus::Open,
        };
        env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);

        let topics = (symbol_short!("Proposed"), trade_id);
        let data = (party_a, party_b, bond_amount);
        env.events().publish(topics, data);
        Ok(trade_id)
    }

    /// party_b posts their matching bond to accept the trade.
    pub fn accept_trade(env: Env, trade_id: u64) -> Result<(), TradeError> {
        let trade = Self::load_trade(&env, trade_id)?;
        trade.party_b.require_auth();

        if trade.status != TradeStatus::Open {
            return Err(TradeError::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &trade.bond_token);
        token_client.transfer(&trade.party_b, &env.current_contract_address(), &trade.bond_amount);

        env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);
        Ok(())
    }

    /// Either party marks their own side of the barter as delivered.
    pub fn mark_delivered(env: Env, trade_id: u64, party: Address) -> Result<(), TradeError> {
        party.require_auth();
        let mut trade = Self::load_trade(&env, trade_id)?;

        if env.ledger().timestamp() > trade.deadline {
            return Err(TradeError::DeadlineAlreadyPassed);
        }

        if party == trade.party_a {
            if trade.delivered_a {
                return Err(TradeError::AlreadyDelivered);
            }
            trade.delivered_a = true;
        } else if party == trade.party_b {
            if trade.delivered_b {
                return Err(TradeError::AlreadyDelivered);
            }
            trade.delivered_b = true;
        } else {
            return Err(TradeError::Unauthorized);
        }

        let topics = (symbol_short!("Delivered"), trade_id);
        let data = (party,);
        env.events().publish(topics, data);

        if trade.delivered_a && trade.delivered_b {
            trade.status = TradeStatus::BothDelivered;
            env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);
            Self::settle_completed(&env, trade_id, &trade)?;
        } else {
            env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);
        }

        Ok(())
    }

    /// Internal: both sides delivered — return both bonds and record
    /// `Completed` on both reputations. Two cross-contract calls, one per participant.
    fn settle_completed(env: &Env, trade_id: u64, trade: &Trade) -> Result<(), TradeError> {
        let token_client = token::Client::new(env, &trade.bond_token);
        token_client.transfer(&env.current_contract_address(), &trade.party_a, &trade.bond_amount);
        token_client.transfer(&env.current_contract_address(), &trade.party_b, &trade.bond_amount);

        let reputation_client = reputation::Client::new(env, &trade.reputation_contract);
        reputation_client.record_outcome(
            &trade.party_a,
            &trade_id,
            &trade.party_b,
            &reputation::TradeOutcome::Completed,
        );
        reputation_client.record_outcome(
            &trade.party_b,
            &trade_id,
            &trade.party_a,
            &reputation::TradeOutcome::Completed,
        );

        let mut updated = trade.clone();
        updated.status = TradeStatus::Completed;
        env.storage().persistent().set(&DataKey::Trade(trade_id), &updated);

        let topics = (symbol_short!("Completed"), trade_id);
        let data = ();
        env.events().publish(topics, data);
        Ok(())
    }

    /// After the deadline, the honest party can claim the defaulting
    /// party's bond. Records `Defaulted` for the non-deliverer and
    /// `Completed` for the party who did deliver, via two cross-contract
    /// calls into Reputation.
    pub fn claim_default(env: Env, trade_id: u64, claimant: Address) -> Result<(), TradeError> {
        claimant.require_auth();
        let mut trade = Self::load_trade(&env, trade_id)?;

        if trade.status != TradeStatus::Open && trade.status != TradeStatus::BothDelivered {
            return Err(TradeError::InvalidStatus);
        }
        if env.ledger().timestamp() <= trade.deadline {
            return Err(TradeError::DeadlineNotPassed);
        }

        let (defaulting_party, honest_party, honest_delivered) = if claimant == trade.party_a && !trade.delivered_b {
            (trade.party_b.clone(), trade.party_a.clone(), trade.delivered_a)
        } else if claimant == trade.party_b && !trade.delivered_a {
            (trade.party_a.clone(), trade.party_b.clone(), trade.delivered_b)
        } else {
            return Err(TradeError::Unauthorized);
        };

        let token_client = token::Client::new(&env, &trade.bond_token);
        // Honest party gets their own bond back plus the defaulter's bond.
        let payout = trade.bond_amount * 2;
        token_client.transfer(&env.current_contract_address(), &honest_party, &payout);

        let reputation_client = reputation::Client::new(&env, &trade.reputation_contract);
        reputation_client.record_outcome(
            &defaulting_party,
            &trade_id,
            &honest_party,
            &reputation::TradeOutcome::Defaulted,
        );
        if honest_delivered {
            reputation_client.record_outcome(
                &honest_party,
                &trade_id,
                &defaulting_party,
                &reputation::TradeOutcome::Completed,
            );
        }

        trade.status = TradeStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);

        let topics = (symbol_short!("Defaulted"), trade_id);
        let data = (defaulting_party, honest_party);
        env.events().publish(topics, data);
        Ok(())
    }

    pub fn get_trade(env: Env, trade_id: u64) -> Result<Trade, TradeError> {
        Self::load_trade(&env, trade_id)
    }

    fn load_trade(env: &Env, trade_id: u64) -> Result<Trade, TradeError> {
        env.storage().persistent().get(&DataKey::Trade(trade_id)).ok_or(TradeError::TradeNotFound)
    }
}

mod test;
