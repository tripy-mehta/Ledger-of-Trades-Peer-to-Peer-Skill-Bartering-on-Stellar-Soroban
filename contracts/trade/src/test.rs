#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Env, String as SorobanString};

fn create_token<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    let admin_client = token::StellarAssetClient::new(env, &address);
    let client = token::Client::new(env, &address);
    (address, admin_client, client)
}

mod reputation_test_shim {
    pub use reputation_registry::{ReputationRegistryContract, ReputationRegistryContractClient};
}

fn setup_trade(
    env: &Env,
    deadline: u64,
) -> (SkillTradeContractClient<'static>, u64, Address, Address, token::Client<'static>, Address) {
    env.mock_all_auths();
    let contract_id = env.register(SkillTradeContract, ());
    let client = SkillTradeContractClient::new(env, &contract_id);

    let party_a = Address::generate(env);
    let party_b = Address::generate(env);
    let token_admin = Address::generate(env);
    let (token_addr, token_admin_client, token_client) = create_token(env, &token_admin);
    token_admin_client.mint(&party_a, &1_000i128);
    token_admin_client.mint(&party_b, &1_000i128);

    let reputation_id = env.register(reputation_test_shim::ReputationRegistryContract, ());
    reputation_test_shim::ReputationRegistryContractClient::new(env, &reputation_id).initialize(&contract_id);

    let trade_id = client.propose_trade(
        &party_a,
        &party_b,
        &SorobanString::from_str(env, "Logo design"),
        &SorobanString::from_str(env, "Website build"),
        &token_addr,
        &100i128,
        &reputation_id,
        &deadline,
    );

    (client, trade_id, party_a, party_b, token_client, reputation_id)
}

#[test]
fn test_propose_trade_pulls_party_a_bond() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, _a, _b, token_client, _rep) = setup_trade(&env, 100_000);

    assert_eq!(token_client.balance(&client.address), 100i128);
    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.status, TradeStatus::Open);
}

#[test]
fn test_accept_trade_pulls_party_b_bond() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, _a, _b, token_client, _rep) = setup_trade(&env, 100_000);

    client.accept_trade(&trade_id);
    assert_eq!(token_client.balance(&client.address), 200i128);
}

#[test]
fn test_both_delivered_returns_bonds_and_completes() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, party_a, party_b, token_client, rep_id) = setup_trade(&env, 100_000);

    client.accept_trade(&trade_id);
    client.mark_delivered(&trade_id, &party_a);
    client.mark_delivered(&trade_id, &party_b);

    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.status, TradeStatus::Completed);
    assert_eq!(token_client.balance(&party_a), 1000i128);
    assert_eq!(token_client.balance(&party_b), 1000i128);

    let rep_client = reputation_test_shim::ReputationRegistryContractClient::new(&env, &rep_id);
    let profile_a = rep_client.get_profile(&party_a);
    assert_eq!(profile_a.completed_trades, 1u32);
}

#[test]
fn test_claim_default_before_deadline_rejected() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, party_a, _b, _token_client, _rep) = setup_trade(&env, 100_000);

    let result = client.try_claim_default(&trade_id, &party_a);
    assert!(result.is_err());
}

#[test]
fn test_claim_default_after_deadline_awards_double_bond() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, party_a, party_b, token_client, rep_id) = setup_trade(&env, 2000);

    client.accept_trade(&trade_id);
    client.mark_delivered(&trade_id, &party_a); // party_a delivers, party_b does not

    env.ledger().set_timestamp(3000); // pass the deadline

    client.claim_default(&trade_id, &party_a);

    // party_a started with 900 (1000-100 bond), gets back 200 (both bonds) = 1100
    assert_eq!(token_client.balance(&party_a), 1100i128);

    let rep_client = reputation_test_shim::ReputationRegistryContractClient::new(&env, &rep_id);
    let profile_b = rep_client.get_profile(&party_b);
    assert_eq!(profile_b.defaulted_trades, 1u32);
    let profile_a = rep_client.get_profile(&party_a);
    assert_eq!(profile_a.completed_trades, 1u32);
}

#[test]
fn test_double_delivery_rejected() {
    let env = Env::default();
    env.ledger().set_timestamp(1000);
    let (client, trade_id, party_a, _b, _token_client, _rep) = setup_trade(&env, 100_000);

    client.accept_trade(&trade_id);
    client.mark_delivered(&trade_id, &party_a);
    let result = client.try_mark_delivered(&trade_id, &party_a);
    assert!(result.is_err());
}

#[test]
fn test_trade_not_found_errors() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SkillTradeContract, ());
    let client = SkillTradeContractClient::new(&env, &contract_id);
    let result = client.try_get_trade(&999u64);
    assert!(result.is_err());
}
