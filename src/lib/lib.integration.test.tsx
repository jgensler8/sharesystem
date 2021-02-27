import { Connection, PublicKey, Account } from '@solana/web3.js';
import { MAX_TRUST_TABLE_SIZE, TrustTableEntry } from './lib-types';
import { SearchEngineAPI } from './lib';
import { establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, Store, KeyNotFoundError } from './util'

describe('serach engine', () => {
  let conn: Connection;
  let address: PublicKey;
  let store: Store;
  let payerAccount: Account;
  let searchEnginePayerAccount: Account;
  let system: SearchEngineAPI;

  beforeAll(async () => {
    conn = await establishConnection();
    address = await loadSearchEngineAddressFromEnvironment();
    store = new Store();
    payerAccount = await loadAccountFromEnvironment();
    searchEnginePayerAccount = new Account();

    system = new SearchEngineAPI(conn, address, store, payerAccount);

    console.log(`payer account: ${payerAccount.publicKey.toBase58()}`)
    console.log(`searchengine account: ${searchEnginePayerAccount.publicKey.toBase58()}`)
    console.log(`search engine: ${address}`)
  })

  test('healthcheck', async () => {
    await system.healthCheck();
  })

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let createdAccount = await system.createDefaultSearchEngineAccount(searchEnginePayerAccount, "jeff");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(createdAccount).toStrictEqual(storedAccount);

    let detailsAccount = await system.getAccountDetails(searchEnginePayerAccount.publicKey);
    expect(createdAccount).toStrictEqual(detailsAccount);
  });

  test('can read trust table', async () => {
    // assumes account created already
    let defaultAccount = await system.getDefaultSearchEngineAccount();
    let entries = Array(MAX_TRUST_TABLE_SIZE).fill(new TrustTableEntry(new PublicKey("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE"), 10));
    defaultAccount.trustTable = entries;
    await system.updateSearchEngineAccount(searchEnginePayerAccount, defaultAccount);

    let storedAccount = await system.getAccountDetails(searchEnginePayerAccount.publicKey);
    expect(defaultAccount).toStrictEqual(storedAccount);
  })

})