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
    searchEnginePayerAccount = new Account();
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
  });
})