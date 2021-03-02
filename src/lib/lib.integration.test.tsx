import { Connection, PublicKey, Account } from '@solana/web3.js';
import { Location, MAX_TRUST_TABLE_SIZE, Resource, TrustTableEntry } from './lib-types';
import { ResourceAPI, SearchEngineAPI } from './lib';
import {
  establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment,
  loadDatabaseAddressFromEnvironment, Store, KeyNotFoundError,
  loadResourceAddressFromEnvironment, loadResourceDatabaseAddressFromEnvironment
} from './util'

describe('serach engine', () => {
  let conn: Connection;
  let address: PublicKey;
  let database: Account;
  let store: Store;
  let payerAccount: Account;
  let searchEnginePayerAccount: Account;
  let resourceProgramAccount: PublicKey;
  let resourceProgramDatabaseAccount: Account;
  let system: SearchEngineAPI;
  let resourceAPI: ResourceAPI;
  let location: Location;
  let resource: Resource;

  beforeAll(async () => {
    conn = await establishConnection();
    address = await loadSearchEngineAddressFromEnvironment();
    database = await loadDatabaseAddressFromEnvironment();
    store = new Store();
    payerAccount = await loadAccountFromEnvironment();
    // stable customer account so both databases don't fill up
    searchEnginePayerAccount = new Account(Uint8Array.from([
      102,193,136,7,193,248,25,69,123,93,192,155,11,116,137,149,85,149,246,134,11,101,230,64,166,161,143,161,109,224,194,112,59,242,56,4,233,182,168,169,147,48,18,145,175,118,3,103,87,180,7,42,234,7,88,152,234,47,244,235,70,156,12,125
    ]));
    resourceProgramAccount = await loadResourceAddressFromEnvironment();
    resourceProgramDatabaseAccount = await loadResourceDatabaseAddressFromEnvironment();
    location = new Location("94040");
    resource = new Resource("potato", location, resourceProgramAccount, 10);
    
    resourceAPI = new ResourceAPI(conn, resource, resourceProgramDatabaseAccount.publicKey, payerAccount);
    system = new SearchEngineAPI(conn, address, database.publicKey, store, payerAccount);

    console.log(`payer account: ${payerAccount.publicKey.toBase58()}`)
    console.log(`searchengine account: ${searchEnginePayerAccount.publicKey.toBase58()}`)
    console.log(`search engine: ${address}`)
  });

  // *************************************************************************
  // Search Engine Contract
  // ************************************************************************* 

  test('healthcheck search engine', async () => {
    await system.healthCheck();
  });

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let recreatedAccount = new Account();

    let createdAccount = await system.createDefaultSearchEngineAccount(recreatedAccount, "jeff");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(createdAccount).toStrictEqual(storedAccount);

    let detailsAccount = await system.getAccountDetails(recreatedAccount.publicKey);
    expect(createdAccount).toStrictEqual(detailsAccount);
  });

  test('can read trust table', async () => {
    // create account if it doesn't exist
    // note that this account will be used if the test suite runs again
    let details = await system.getAccountDetails(searchEnginePayerAccount.publicKey).catch(() => {})
    if (!details) {
      await system.createDefaultSearchEngineAccount(searchEnginePayerAccount, "stable")
    }

    let defaultAccount = await system.getDefaultSearchEngineAccount();
    let entries = Array(MAX_TRUST_TABLE_SIZE).fill(new TrustTableEntry(new PublicKey("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE"), 10));
    defaultAccount.trustTable = entries;
    await system.updateSearchEngineAccount(searchEnginePayerAccount, defaultAccount);

    let storedAccount = await system.getAccountDetails(searchEnginePayerAccount.publicKey);
    expect(defaultAccount).toStrictEqual(storedAccount);
  });

  test('can register resource', async () => {
    await system.registerResource(resource).catch(err => {});

    let index = await system.getResourceIndex();
    expect(index.resources.has(location.zip)).toEqual(true);
    expect(index.resources.get(location.zip)).toContainEqual(resourceProgramAccount);
  });
  
  test('can register intent', async () => {
    await system.registerIntent(searchEnginePayerAccount, resourceProgramAccount);

    let storedAccount = await system.getAccountDetails(searchEnginePayerAccount.publicKey);
    expect(storedAccount.intents).toHaveLength(1);
  });

  // *************************************************************************
  // Resource Contract
  // *************************************************************************

  test('healthcheck resource', async () => {
    await resourceAPI.healthCheck();
  });

  test('can register intent', async () => {
    await resourceAPI.registerIntent(searchEnginePayerAccount);

    let database = await resourceAPI.getDatabase();
    expect(database.intents).toHaveLength(1);
    expect(database.intents[0]).toEqual(searchEnginePayerAccount);
  });
})