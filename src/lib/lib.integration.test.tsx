import { Connection, PublicKey, Account } from '@solana/web3.js';
import { Location, MAX_TRUST_TABLE_SIZE, Resource, TrustTableEntry } from './lib-types';
import { SearchEngineAPI } from './lib';
import { establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, loadDatabaseAddressFromEnvironment, Store, KeyNotFoundError } from './util'

describe('serach engine', () => {
  let conn: Connection;
  let address: PublicKey;
  let database: Account;
  let store: Store;
  let payerAccount: Account;
  let searchEnginePayerAccount: Account;
  let resourceProgramAccount: Account;
  let system: SearchEngineAPI;
  let location: Location;

  beforeAll(async () => {
    conn = await establishConnection();
    address = await loadSearchEngineAddressFromEnvironment();
    database = await loadDatabaseAddressFromEnvironment();
    store = new Store();
    payerAccount = await loadAccountFromEnvironment();
    searchEnginePayerAccount = new Account();
    resourceProgramAccount = new Account(Uint8Array.from([
      129, 158, 227, 153, 159, 115, 205,  30,  40, 165,  49,
      128,  97,  91,   5,  21, 103,  53,  15,  30, 174, 111,
      190,  72,  65, 187, 132,  72, 119,  82,  73, 253,  20,
       31, 154, 220, 250, 122, 202, 112, 106, 237,  17,  66,
      153, 111,  62, 125, 230,  33, 225,  71, 153, 117,  90,
      176, 197,   4, 211, 143,  57, 118, 148, 237
    ]));
    location = new Location("94040");

    system = new SearchEngineAPI(conn, address, database.publicKey, store, payerAccount);

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

  test('can register intent', async () => {
    await system.registerIntent(searchEnginePayerAccount, resourceProgramAccount.publicKey);

    let storedAccount = await system.getAccountDetails(searchEnginePayerAccount.publicKey);
    expect(storedAccount.intents).toHaveLength(1);
  });

  test('can register resource', async () => {
    let resource = new Resource("potato", location, resourceProgramAccount.publicKey, 10);
    await system.registerResource(resource).catch(err => {});

    let index = await system.getResourceIndex();
    expect(index.resources.has(location.zip)).toEqual(true);
    expect(index.resources.get(location.zip)).toContainEqual(resourceProgramAccount.publicKey);
  })

})