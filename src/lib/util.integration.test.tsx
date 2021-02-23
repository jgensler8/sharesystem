import { Account, PublicKey } from '@solana/web3.js';
import { loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment } from './util'

describe("environment specific functions", () => {

    test("searche engine address", async () => {
        let address = await loadSearchEngineAddressFromEnvironment();
        expect(address).not.toEqual(new PublicKey([]));
    })

    test("payer account", async () => {
        let account = await loadAccountFromEnvironment();
        expect(account).not.toEqual(new PublicKey([]));
    })
});