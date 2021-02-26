import { Connection, PublicKey, Account } from '@solana/web3.js';
import { SearchEngineAPI, TrustTable, TrustTableEntry, MAX_TRUST_TABLE_SIZE } from './lib'
import { establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, Store, KeyNotFoundError } from './util'

describe('serach engine', () => {
  let conn: Connection;
  let address: PublicKey;
  let store: Store;
  let payerAccount: Account;
  let searchEngineAccount: Account;
  let system: SearchEngineAPI;

  beforeAll(async () => {
    conn = await establishConnection();
    address = await loadSearchEngineAddressFromEnvironment();
    store = new Store();
    payerAccount = await loadAccountFromEnvironment();
    searchEngineAccount = new Account();

    system = new SearchEngineAPI(conn, address, store, payerAccount);

    console.log(`payer account: ${payerAccount.publicKey.toBase58()}`)
    console.log(`search engine: ${address}`)
  })

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let createdAccount = await system.createDefaultSearchEngineAccount(searchEngineAccount, "jeff");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(createdAccount).toStrictEqual(storedAccount);
  });

  test('healthcheck', async () => {
    await system.healthCheck();
  })

  test('can read trust table', async () => {
    // assumes account created already
    let defaultAccount = await system.getDefaultSearchEngineAccount();
    let entries = Array(MAX_TRUST_TABLE_SIZE).fill(new TrustTableEntry(new PublicKey("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE"), 10));
    defaultAccount.trustTable = entries;
    await system.updateSearchEngineAccount(searchEngineAccount, defaultAccount);

    let storedAccount = await system.getAccountDetails(searchEngineAccount.publicKey);
    expect(defaultAccount).toStrictEqual(storedAccount);
  })

})