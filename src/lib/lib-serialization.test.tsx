import { Account, PublicKey } from '@solana/web3.js';
import { TrustTableEntry, SearchEngineAccount, Resource, Location, ResourceInstance, ResourceIndex, Challenge, ResourceDatabase } from './lib-types';
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
        let intent = new Account().publicKey;
        let searchEngineAccount = new SearchEngineAccount("us", [trustTableEntry], [intent]);

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
        let map = new Map<string, Array<PublicKey>>();
        map.set("94040", [new Account().publicKey])
        let index = new ResourceIndex(map);

        const arr = toBorsh(index);

        const buffer = Buffer.from(arr);
        const typed = toTyped(ResourceIndex, buffer);
        expect(index).toStrictEqual(typed);
    })

    test('can deserialize Challenge', () => {
        // true
        let challenge = new Challenge(new Account().publicKey, new Account().publicKey, true);
        const arr = toBorsh(challenge);
        const buffer = Buffer.from(arr);
        const typed = toTyped(Challenge, buffer);
        expect(challenge).toStrictEqual(typed);

        // false
        let challenge_2 = new Challenge(new Account().publicKey, new Account().publicKey, false);
        const arr_2 = toBorsh(challenge_2);
        const buffer_2 = Buffer.from(arr_2);
        const typed_2 = toTyped(Challenge, buffer_2);
        expect(challenge_2).toStrictEqual(typed_2);
    })

    test('can deserialize ResourceInstance', () => {
        let resourceInstance = new ResourceInstance(new Account().publicKey, 100);

        const arr = toBorsh(resourceInstance);

        const buffer = Buffer.from(arr);
        const typed = toTyped(ResourceInstance, buffer);
        expect(resourceInstance).toStrictEqual(typed);
    })

    test('can desserialize ResourceDatabase', () => {
        let intents = [new Account().publicKey];
        let instances = [new ResourceInstance(new Account().publicKey, 10)];
        let challenges = [new Challenge(new Account().publicKey, new Account().publicKey, true)];
        let claims = [new Account().publicKey];
        let database = new ResourceDatabase(true, 10, intents, instances, challenges, claims);

        const arr = toBorsh(database);

        const buffer = Buffer.from(arr);
        const typed = toTyped(ResourceDatabase, buffer);
        expect(database).toStrictEqual(typed);
    })
})