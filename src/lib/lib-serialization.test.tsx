import { Account, PublicKey } from '@solana/web3.js';
import { TrustTableEntry, SearchEngineAccount, Resource, Location, ResourceInstance, ResourceIndex } from './lib-types';
import { toBorsh, toTyped } from './lib-serialization';

describe('borsh', () => {

    test('can deserialize TrustTableEntry', () => {
        let account = new Account();
        let trustTableEntry = new TrustTableEntry(account.publicKey, 100);

        const arr = toBorsh(trustTableEntry);

        const buffer = Buffer.from(arr);
        const typed = toTyped(TrustTableEntry, buffer);

        expect(trustTableEntry).toEqual(typed);
    })

    test('can deserialize SearchEngineAccount', () => {
        let them = new Account();
        let trustTableEntry = new TrustTableEntry(them.publicKey, 100);
        let searchEngineAccount = new SearchEngineAccount("us", [trustTableEntry]);

        const arr = toBorsh(searchEngineAccount);

        const buffer = Buffer.from(arr);
        const typed = toTyped(SearchEngineAccount, buffer);
        expect(searchEngineAccount).toStrictEqual(typed);
    })

    test('can desserialize Resource', () => {
        let account = new Account();
        let resource = new Resource("myname", new Location("94040"), account.publicKey, 10);

        const arr = toBorsh(resource);

        const buffer = Buffer.from(arr);
        const typed = toTyped(Resource, buffer);
        expect(resource).toStrictEqual(typed);
    })

    test('can deserialize ResourceIndex', () => {
        let map = new Map<Location, Array<PublicKey>>();
        map.set(new Location("94040"), [new Account().publicKey])
        let index = new ResourceIndex(map);

        const arr = toBorsh(index);

        const buffer = Buffer.from(arr);
        const typed = toTyped(ResourceIndex, buffer);
        expect(index).toStrictEqual(typed);
    })
})