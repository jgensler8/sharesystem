import { Account, PublicKey } from '@solana/web3.js';
import {
    loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment,
    loadResourceAddressFromEnvironment, loadDatabaseAddressFromEnvironment, loadResourceDatabaseAddressFromEnvironment
} from './util'

describe("environment specific functions", () => {
    
    test("payer account", async () => {
        let account = await loadAccountFromEnvironment();
        expect(account).not.toEqual(new Account());
    })

    test("search engine address", async () => {
        let address = await loadSearchEngineAddressFromEnvironment();
        expect(address).not.toEqual(new PublicKey([]));
    })

    test('resource address', async () => {
        let address = await loadResourceAddressFromEnvironment();
        expect(address).not.toEqual(new PublicKey([]));
    });

    test('search engine database', async () => {
        let account = await loadDatabaseAddressFromEnvironment();
        expect(account).not.toEqual(new Account());
    });

    test('resource database', async () => {
        let account = await loadResourceDatabaseAddressFromEnvironment();
        expect(account).not.toEqual(new Account());
    });
});