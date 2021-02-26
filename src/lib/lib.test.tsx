import { PublicKey, Account } from '@solana/web3.js';
import { Location, MockSearchEngineAPI, Resource, AllBorshSchemas, TrustTableEntry, BorshTrustTableEntry, BorshTrustTable, BorshSearchEngineAccount, TrustTable, SearchEngineAccount } from './lib'
import { Store, KeyNotFoundError } from './util'
import { serialize, deserialize } from 'borsh';

describe('serach engine', () => {
  let address: PublicKey;
  let store: Store;
  let searchEngineAccount: Account;
  let system: MockSearchEngineAPI;

  beforeAll(async () => {
    store = new Store();
    searchEngineAccount = new Account();
    system = new MockSearchEngineAPI(store);
  })

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let createdAccount = await system.createDefaultSearchEngineAccount(searchEngineAccount, "name");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(storedAccount).toStrictEqual(storedAccount);
  });

  test('can list resources', async () => {

    expect(await system.listResources(new Location(""))).toHaveLength(0);

    await system.registerResource(new Resource(
      "palo alto potatoes",
      new Location("94200"),
      new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"),
      1.5,
    ))
    await system.registerResource(new Resource(
      "mountain view tomatoes",
      new Location("94040"),
      new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"),
      0.9,
    ))

    expect(await system.listResources(new Location(""))).toHaveLength(2);
  });
});

describe('borsh', () => {

  test('can deserialize TrustTableEntry', () => {
    let account = new Account();
    let trustTableEntry = new TrustTableEntry(account.publicKey, 100);

    const arr = serialize(AllBorshSchemas, trustTableEntry.to_borsh());
    const buffer = Buffer.from(arr);

    const deserialized = deserialize(AllBorshSchemas, BorshTrustTableEntry, buffer);
    const typed = deserialized.to_typed();
    expect(trustTableEntry).toEqual(typed);
  })

  test('can deserialize TrustTable', () => {
    let account = new Account;
    let trustTableEntry = new TrustTableEntry(account.publicKey, 100);
    let trustTable = new TrustTable([trustTableEntry]);

    const arr = serialize(AllBorshSchemas, trustTable.to_borsh());
    const buffer = Buffer.from(arr);

    const deserialized = deserialize(AllBorshSchemas, BorshTrustTable, buffer);
    const typed = deserialized.to_typed();
    expect(trustTable).toEqual(typed);
  })

  test('can deserialize SearchEngineAccount', () => {
    let them = new Account;
    let trustTableEntry = new TrustTableEntry(them.publicKey, 100);
    let trustTable = new TrustTable([trustTableEntry]);
    let us = new Account();
    let searchEngineAccount = new SearchEngineAccount("us", trustTable);

    const arr = serialize(AllBorshSchemas, searchEngineAccount.to_borsh());
    const buffer = Buffer.from(arr);

    const deserialized = deserialize(AllBorshSchemas, BorshSearchEngineAccount, buffer);
    const typed = deserialized.to_typed();
    expect(searchEngineAccount).toEqual(typed);
  })

})