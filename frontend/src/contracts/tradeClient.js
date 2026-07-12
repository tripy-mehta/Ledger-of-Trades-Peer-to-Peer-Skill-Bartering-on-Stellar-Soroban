import { Contract, rpc, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from './config';

const server = new rpc.Server(NETWORK.rpcUrl);

/**
 * Thin client around the SkillTrade Soroban contract.
 * Builds, simulates, and (where a signer is supplied) submits transactions.
 */
export class TradeClient {
  constructor(contractId = CONTRACTS.TRADE_CONTRACT_ID) {
    this.contract = new Contract(contractId);
  }

  async _buildAndSimulate(method, args, sourceAddress) {
    const account = await server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }
    return { tx, simulated };
  }

  async view(method, args = [], sourceAddress) {
    const { simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    if (simulated.result?.retval) {
      return scValToNative(simulated.result.retval);
    }
    return null;
  }

  async invoke(method, args, sourceAddress, signTransaction, onStage) {
    const { tx, simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    const prepared = rpc.assembleTransaction(tx, simulated).build();

    onStage?.('signing');
    const signedXdr = await signTransaction(prepared.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);

    onStage?.('submitting');
    const sendResponse = await server.sendTransaction(signedTx);
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
    }

    onStage?.('confirming');
    return this._pollTransaction(sendResponse.hash);
  }

  async _pollTransaction(hash, attempts = 15) {
    for (let i = 0; i < attempts; i++) {
      const result = await server.getTransaction(hash);
      if (result.status === 'SUCCESS') {
        let returnValue = null;
        if (result.returnValue) {
          try {
            returnValue = scValToNative(result.returnValue);
          } catch (e) {
            console.error('Could not parse returnValue', e);
          }
        }
        return { hash, status: 'SUCCESS', result, returnValue };
      }
      if (result.status === 'FAILED') {
        throw new Error(`Transaction failed: ${hash}`);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Transaction ${hash} did not confirm in time`);
  }

  proposeTrade(partyA, partyB, offerA, offerB, bondToken, bondAmount, reputationContract, deadline, signTransaction, onStage) {
    const args = [
      nativeToScVal(partyA, { type: 'address' }),
      nativeToScVal(partyB, { type: 'address' }),
      nativeToScVal(offerA, { type: 'string' }),
      nativeToScVal(offerB, { type: 'string' }),
      nativeToScVal(bondToken, { type: 'address' }),
      nativeToScVal(BigInt(bondAmount), { type: 'i128' }),
      nativeToScVal(reputationContract, { type: 'address' }),
      nativeToScVal(BigInt(deadline), { type: 'u64' }),
    ];
    return this.invoke('propose_trade', args, partyA, signTransaction, onStage);
  }

  acceptTrade(tradeId, partyB, signTransaction, onStage) {
    const args = [nativeToScVal(BigInt(tradeId), { type: 'u64' })];
    return this.invoke('accept_trade', args, partyB, signTransaction, onStage);
  }

  markDelivered(tradeId, party, signTransaction, onStage) {
    const args = [nativeToScVal(BigInt(tradeId), { type: 'u64' }), nativeToScVal(party, { type: 'address' })];
    return this.invoke('mark_delivered', args, party, signTransaction, onStage);
  }

  claimDefault(tradeId, claimant, signTransaction, onStage) {
    const args = [nativeToScVal(BigInt(tradeId), { type: 'u64' }), nativeToScVal(claimant, { type: 'address' })];
    return this.invoke('claim_default', args, claimant, signTransaction, onStage);
  }

  getTrade(tradeId, sourceAddress) {
    return this.view('get_trade', [nativeToScVal(BigInt(tradeId), { type: 'u64' })], sourceAddress);
  }
}

export const tradeClient = new TradeClient();

/** Read-only client for the Reputation contract, used to show scores in the UI. */
export class ReputationClient {
  constructor(contractId = CONTRACTS.REPUTATION_CONTRACT_ID) {
    this.contract = new Contract(contractId);
  }

  async getProfile(user, sourceAddress) {
    const account = await server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK.networkPassphrase,
    })
      .addOperation(this.contract.call('get_profile', nativeToScVal(user, { type: 'address' })))
      .setTimeout(60)
      .build();
    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }
    return simulated.result?.retval ? scValToNative(simulated.result.retval) : null;
  }
}

export const reputationClient = new ReputationClient();
