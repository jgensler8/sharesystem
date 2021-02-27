import { PublicKey, Account } from '@solana/web3.js';
import { Location, Resource } from './lib-types';
import { MockSearchEngineAPI } from './lib-mock';
import { Store, KeyNotFoundError } from './util';

describe('search engine', () => {
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
        expect(createdAccount).toStrictEqual(storedAccount);
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
})