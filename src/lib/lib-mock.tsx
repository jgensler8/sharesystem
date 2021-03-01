import {
    Account,
    PublicKey,
} from '@solana/web3.js';
import { ISearchEngine, SearchEngineAccount, Resource, Location, ResourceIndex } from './lib-types';
import { randomInt } from 'mz/crypto';
import { Store, WrongInstanceError, KeyNotFoundError } from './util';


export class MockSearchEngineAPI implements ISearchEngine {
    store: Store;
    readonly ACCOUNT_KEY = "mocksearchengine_this_account"
    readonly RESOURCES_KEY = "mocksearchengine_resources"
    readonly INTENTS_KEY = "mocksearchengine_intents"

    constructor(store: Store) {
        this.store = store;
    }

    async healthCheck(): Promise<void> { }

    async createDefaultSearchEngineAccount(account: Account, friendlyName: string): Promise<SearchEngineAccount> {
        let searchEngineAccount = new SearchEngineAccount(friendlyName, []);
        this.store.put(this.ACCOUNT_KEY, searchEngineAccount)
        return searchEngineAccount;
    }

    async _getSearchEngineAccount(key: string): Promise<SearchEngineAccount> {
        let account = await this.store.get(key);
        if (!account) {
            throw new KeyNotFoundError();
        }
        if (!(account instanceof SearchEngineAccount)) {
            throw new WrongInstanceError();
        }
        return account;
    }

    async getDefaultSearchEngineAccount(): Promise<SearchEngineAccount> {
        return this._getSearchEngineAccount(this.ACCOUNT_KEY);
    }

    async updateSearchEngineAccount(account: Account, searchEngineAccount: SearchEngineAccount): Promise<void> {
        this.store.put(this.ACCOUNT_KEY, account)
    }

    async getAccountDetails(address: PublicKey): Promise<SearchEngineAccount> {
        // check cache
        try {
            return this._getSearchEngineAccount(address.toBase58());
        } catch (error) {
            if (error instanceof KeyNotFoundError) {
                // read from chain
                let searchEngineAccount = new SearchEngineAccount("test_" + randomInt(10000), []);
                // store in cache
                this.store.put(address.toBase58(), searchEngineAccount)
                return searchEngineAccount;
            }
            throw error;
        }
    }

    async registerResource(resource: Resource): Promise<void> {
        let resourceList = await this.listResources(new Location(""));
        resourceList.push(resource);
        this.store.put(this.RESOURCES_KEY, resourceList);
    }

    async getResourceIndex(): Promise<ResourceIndex> {
        return new ResourceIndex(new Map());
    }

    async listResources(location: Location): Promise<Resource[]> {
        let resourceList = await this.store.get(this.RESOURCES_KEY)
        if (!resourceList) {
            this.store.put(this.RESOURCES_KEY, []);
            return [];
        }
        if (!(resourceList instanceof Array)) {
            throw new WrongInstanceError();
        }
        return resourceList;
    }

    async recordIntent(account: SearchEngineAccount, resource: PublicKey): Promise<void> {
        let intentsList = await this.listIntents(account);
        intentsList.push(resource);
        this.store.put(this.INTENTS_KEY, intentsList);
    }

    async listIntents(account: SearchEngineAccount): Promise<Array<PublicKey>> {
        let intentsList = await this.store.get(this.INTENTS_KEY)
        if (!intentsList) {
            this.store.put(this.INTENTS_KEY, []);
            return [];
        }
        if (!(intentsList instanceof Array)) {
            throw new WrongInstanceError();
        }
        return intentsList;
    }
}