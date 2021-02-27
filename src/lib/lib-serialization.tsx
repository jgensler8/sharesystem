import { PublicKey } from "@solana/web3.js";
import { TextEncoder, TextDecoder } from "web-encoding";
import { DEFAULT_TRUST_TABLE_ENTRY, MAX_TRUST_TABLE_SIZE, SearchEngineAccount, TrustTableEntry } from "./lib-types";
import { serialize, deserialize } from 'borsh';

class BorshConstructable {
    constructor(properties: object) {
        Object.keys(properties).map((key) => {
            this[key] = properties[key];
        });
    }
}
export let AllBorshSchemas = new Map();

export class BorshTrustTableEntry extends BorshConstructable { }
AllBorshSchemas.set(BorshTrustTableEntry, {
    kind: 'struct',
    fields: [
        ['id', [32]],
        ['value', 'u8']
    ]
});


export class BorshSearchEngineAccount extends BorshConstructable { }
AllBorshSchemas.set(BorshSearchEngineAccount, {
    kind: 'struct',
    fields: [
        ['friendlyName', [12]],
        ['trustTable', [33]]
    ]
})

function toBorsh(libObject: Object): Uint8Array {
    if (libObject instanceof TrustTableEntry) {
        return serialize(AllBorshSchemas,
            new BorshTrustTableEntry({
                id: Uint8Array.from(libObject.id.toBuffer()),
                value: libObject.value
            })
        );
    } else if (libObject instanceof SearchEngineAccount) {
        let name = new Uint8Array(12);
        let encoder = new TextEncoder("utf-8");
        let nameSlice = encoder.encode(libObject.friendlyName).slice(0, 12);
        name.set(nameSlice);

        let trustTableEntryIndex = 0;
        let trustTableEntries = new Uint8Array();
        while(trustTableEntryIndex < libObject.trustTable.length) {
            let serialized = toBorsh(libObject.trustTable[trustTableEntryIndex]);
            trustTableEntries = Uint8Array.from([...trustTableEntries, ...serialized]);
            trustTableEntryIndex +=1 ;
        }
        while(trustTableEntryIndex < MAX_TRUST_TABLE_SIZE) {
            let serialized = toBorsh(DEFAULT_TRUST_TABLE_ENTRY);
            trustTableEntries = Uint8Array.from([...trustTableEntries, ...serialized]);
            trustTableEntryIndex +=1 ;
        }
        return serialize(AllBorshSchemas,
            new BorshSearchEngineAccount({
                friendlyName: name,
                trustTable: trustTableEntries,
            })
        );
    } else if (libObject == undefined) {
        throw "undefined passed to toBorsh. This is probably from an assumption in a specific if-else block of toBorsh (arrays are certain size, certain fields set)"  
    } else {
        throw "type not supported, add to AllBorshSchemas variable in lib-serialization. also make sure server side supports this type";
    }
}

function toTyped(t: any, borshBuffer: Buffer): Object {
    if (t == TrustTableEntry) {
        let deserialized = deserialize(AllBorshSchemas, BorshTrustTableEntry, borshBuffer)
        return new TrustTableEntry(new PublicKey(deserialized.id), deserialized.value);
    } else if (t == SearchEngineAccount) {
        let deserialized = deserialize(AllBorshSchemas, BorshSearchEngineAccount, borshBuffer);

        let decoder = new TextDecoder("utf-8");
        // Note: text decoder would normally return 'NAME%00%00%00%00%00%00%00%00'
        // Unfortunately, this will also strip out any character with an encoding: ñ
        // TODO: add some other algorithm to trim %00 from end
        let friendlyNameWithEncodedNulls = decoder.decode(deserialized.friendlyName);
        let friendlyName = encodeURIComponent(friendlyNameWithEncodedNulls).split("%")[0];
        // TODO: iterative over buffer and deserialze individual elements
        let trustTableEntry = toTyped(TrustTableEntry, Buffer.from(deserialized.trustTable));
        let trustTable = [];
        if(trustTableEntry.id.toBase58() != DEFAULT_TRUST_TABLE_ENTRY.id.toBase58()) {
            trustTable.push(trustTableEntry);
        }
        return new SearchEngineAccount(friendlyName, trustTable);
    } else {
        throw "type not supported. add a custom Borsh object in lib-serialization. also make sure server side supports this type";
    }
}

export { toBorsh, toTyped };