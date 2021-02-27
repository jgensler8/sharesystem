import { Account } from '@solana/web3.js';
import { TrustTableEntry, SearchEngineAccount } from './lib-types';
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
        let them = new Account;
        let trustTableEntry = new TrustTableEntry(them.publicKey, 100);
        let us = new Account();
        let searchEngineAccount = new SearchEngineAccount("us", [trustTableEntry]);

        const arr = toBorsh(searchEngineAccount);

        const buffer = Buffer.from(arr);
        const typed = toTyped(SearchEngineAccount, buffer);
        expect(searchEngineAccount).toStrictEqual(typed);
    })

})