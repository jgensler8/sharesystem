import { loadSearchEngineAddressFromEnvironment, loadResourceAddressFromEnvironment, loadAccountFromEnvironment, loadDatabaseAddressFromEnvironment } from './util'

describe("environment specific functions", () => {

    test("searche engine address", async () => {
        let address = await loadSearchEngineAddressFromEnvironment();
        expect(address).toBeDefined();
    })

    test('test resource address', async () => {
        let address = await loadResourceAddressFromEnvironment();
        expect(address).toBeDefined();
    })

    test("payer account", async () => {
        let account = await loadAccountFromEnvironment();
        expect(account).toBeDefined();
    })

    test("database account", async() => {
        let account = await loadDatabaseAddressFromEnvironment();
        expect(account).toBeDefined();
    })
});