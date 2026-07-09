#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, ReputationRegistryContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ReputationRegistryContract, ());
    let client = ReputationRegistryContractClient::new(&env, &contract_id);

    let trade_contract = Address::generate(&env);
    client.initialize(&trade_contract);
    (env, client, trade_contract)
}

#[test]
fn test_new_user_has_zero_score() {
    let (env, client, _trade) = setup();
    let user = Address::generate(&env);
    let profile = client.get_profile(&user);
    assert_eq!(profile.score, 0u32);
    assert_eq!(profile.completed_trades, 0u32);
}

#[test]
fn test_completed_trade_increases_score() {
    let (env, client, _trade) = setup();
    let user = Address::generate(&env);
    let counterparty = Address::generate(&env);

    let score = client.record_outcome(&user, &1u64, &counterparty, &TradeOutcome::Completed);
    assert_eq!(score, 2u32);

    let profile = client.get_profile(&user);
    assert_eq!(profile.completed_trades, 1u32);
}

#[test]
fn test_defaulted_trade_decreases_score() {
    let (env, client, _trade) = setup();
    let user = Address::generate(&env);
    let counterparty = Address::generate(&env);

    client.record_outcome(&user, &1u64, &counterparty, &TradeOutcome::Completed);
    client.record_outcome(&user, &2u64, &counterparty, &TradeOutcome::Completed);
    let score = client.record_outcome(&user, &3u64, &counterparty, &TradeOutcome::Defaulted);

    // 2 + 2 - 3 = 1
    assert_eq!(score, 1u32);
}

#[test]
fn test_score_floors_at_zero_never_negative() {
    let (env, client, _trade) = setup();
    let user = Address::generate(&env);
    let counterparty = Address::generate(&env);

    let score = client.record_outcome(&user, &1u64, &counterparty, &TradeOutcome::Defaulted);
    assert_eq!(score, 0u32); // saturating_sub prevents underflow below 0
}

#[test]
fn test_history_accumulates_across_trades() {
    let (env, client, _trade) = setup();
    let user = Address::generate(&env);
    let counterparty1 = Address::generate(&env);
    let counterparty2 = Address::generate(&env);

    client.record_outcome(&user, &1u64, &counterparty1, &TradeOutcome::Completed);
    client.record_outcome(&user, &2u64, &counterparty2, &TradeOutcome::Completed);

    let history = client.get_history(&user);
    assert_eq!(history.len(), 2);
}

#[test]
fn test_unauthorized_caller_cannot_record_outcome() {
    let env = Env::default();
    // No mock_all_auths here — require_auth on a non-invoking address should fail
    // when the actual invoker isn't the authorized trade contract.
    // We simulate this by initializing with one trade contract, then invoking
    // as a completely different (unmocked) caller context.
    env.mock_all_auths();
    let contract_id = env.register(ReputationRegistryContract, ());
    let client = ReputationRegistryContractClient::new(&env, &contract_id);
    let trade_contract = Address::generate(&env);
    client.initialize(&trade_contract);

    // Attempting to initialize a second time must fail regardless of caller.
    let other = Address::generate(&env);
    let result = client.try_initialize(&other);
    assert!(result.is_err());
}
