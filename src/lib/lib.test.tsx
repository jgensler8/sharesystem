import { PublicKey, Account } from '@solana/web3.js';
import { MockSearchEngineAPI, Resource } from './lib'
import { Store, KeyNotFoundError } from './util'

describe('serach engine', () => {
  let address: PublicKey;
  let store: Store;
  let account: Account;
  let system: MockSearchEngineAPI;

  beforeAll(async () => {
    store = new Store();
    system = new MockSearchEngineAPI(store);
  })

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let createdAccount = await system.createDefaultSearchEngineAccount("name");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(storedAccount).toStrictEqual(storedAccount);
  });

  test('can list resources', async () => {

    expect(await system.listResources()).toHaveLength(0);

    await system.registerResource(new Resource(
      "palo alto potatoes",
      "9420",
      new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"),
      1.5,
    ))
    await system.registerResource(new Resource(
      "mountain view tomatoes",
      "94040",
      new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"),
      0.9,
    ))

    expect(await system.listResources()).toHaveLength(2);
  });
})