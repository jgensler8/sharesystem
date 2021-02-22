import { loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment } from './util'

describe("environment specific functions", () => {

    test("searche engine address", async () => {
        let address = await loadSearchEngineAddressFromEnvironment();
        expect(address).toBeDefined();
    })

    test("payer account", async () => {
        let account = await loadAccountFromEnvironment();
        expect(account).toBeDefined();
    })
});