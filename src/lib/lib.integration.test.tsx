import { Connection, PublicKey, Account } from '@solana/web3.js';
import { SearchEngineAPI } from './lib'
import { establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, Store, KeyNotFoundError } from './util'

describe('serach engine', () => {
  let conn: Connection;
  let address: PublicKey;
  let store: Store;
  let payerAccount: Account;
  let system: SearchEngineAPI;

  beforeAll(async () => {
    conn = await establishConnection();
    address = await loadSearchEngineAddressFromEnvironment();
    store = new Store();
    payerAccount = await loadAccountFromEnvironment();
    system = new SearchEngineAPI(conn, address, store, payerAccount);

    console.log(`payer account: ${payerAccount.publicKey.toBase58()}`)
    console.log(`search engine: ${address}`)
  })

  test('can create and read search engine account', async () => {
    await expect(system.getDefaultSearchEngineAccount()).rejects.toEqual(new KeyNotFoundError());

    let createdAccount = await system.createDefaultSearchEngineAccount("name");
    let storedAccount = await system.getDefaultSearchEngineAccount();
    expect(createdAccount).toStrictEqual(storedAccount);
  });
})