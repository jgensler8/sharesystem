import { Connection, PublicKey, Account } from '@solana/web3.js';
import { SearchEngineAPI } from './lib'
import {establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment} from './util'

describe('serach engine', () => {
    let address: PublicKey;
    let account: Account;
    let conn: Connection;
    let system: SearchEngineAPI;

    beforeAll(async () => {
      address = await loadSearchEngineAddressFromEnvironment();
      account = await loadAccountFromEnvironment();
      console.log(account);
      conn = await establishConnection();
      system = new SearchEngineAPI(conn, address, account);
    })

    test('can list resources', async () => {
        expect(await system.listResources()).toEqual([])
    });
})

