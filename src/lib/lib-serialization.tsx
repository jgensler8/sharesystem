// @ts-nocheck
// no-check needed for:
// * BorshConstructable constructor
// * [...] spread syntax

import { PublicKey } from "@solana/web3.js";
import { TextEncoder, TextDecoder } from "web-encoding";
import {
    EMPTY_PUBLIC_KEY, DEFAULT_TRUST_TABLE_ENTRY, Location, MAX_TRUST_TABLE_SIZE,
    Resource, ResourceIndex, SearchEngineAccount, TrustTableEntry, Challenge, ResourceInstance, ResourceDatabase
} from "./lib-types";
import { serialize, deserialize } from 'borsh';
import { types } from "util";

class BorshConstructable {
    constructor(properties: object) {
        Object.keys(properties).map((key) => {
            return this[key] = properties[key];
        });
    }
}
export let AllBorshSchemas = new Map();

const PUBLIC_KEY_SIZE = 32;
export class BorshTrustTableEntry extends BorshConstructable { }
AllBorshSchemas.set(BorshTrustTableEntry, {
    kind: 'struct',
    fields: [
        ['id', [PUBLIC_KEY_SIZE]],
        ['value', 'u8']
    ]
});

const MAX_FRIENDLY_NAME_SIZE = 32;
const MAX_NUM_INTENTS = 3;
export class BorshSearchEngineAccount extends BorshConstructable { }
AllBorshSchemas.set(BorshSearchEngineAccount, {
    kind: 'struct',
    fields: [
        ['friendlyName', [MAX_FRIENDLY_NAME_SIZE]],
        ['trustTable', [PUBLIC_KEY_SIZE + 1]],
        ['intents', [PUBLIC_KEY_SIZE * MAX_NUM_INTENTS]],
    ]
})
// TODO calculate this using borsh library
export const SEARCH_ENGINE_ACCOUNT_SPACE = 161;

const MAX_ZIP_SIZE = 32;
export class BorshLocation extends BorshConstructable { }
AllBorshSchemas.set(BorshLocation, {
    kind: 'struct',
    fields: [
        ['zip', [MAX_ZIP_SIZE]]
    ]
})

export class BorshResource extends BorshConstructable { }
AllBorshSchemas.set(BorshResource, {
    kind: 'struct',
    fields: [
        ['address', [PUBLIC_KEY_SIZE]],
        ['name', [PUBLIC_KEY_SIZE]],
        ['location', [MAX_ZIP_SIZE]],
        ['trustThreshold', 'u8']
    ]
})

const MAX_NUM_RESOURCE_IN_BUCKET = 3;
const MAX_INDEX_BUCKETS = 3;
const BUCKET_SPACE = (MAX_ZIP_SIZE + (PUBLIC_KEY_SIZE * MAX_NUM_RESOURCE_IN_BUCKET))
const RESOURCE_INDEX_ACCOUNT_SPACE = (MAX_INDEX_BUCKETS * BUCKET_SPACE);
export class BorshResourceIndex extends BorshConstructable { }
AllBorshSchemas.set(BorshResourceIndex, {
    kind: 'struct',
    fields: [
        ['resources', [RESOURCE_INDEX_ACCOUNT_SPACE]]
    ]
})

export class BorshResourceInstance extends BorshConstructable { }
AllBorshSchemas.set(BorshResourceInstance, {
    kind: 'struct',
    fields: [
        ['from', [PUBLIC_KEY_SIZE]],
        ['quantity', 'u8'],
    ]
})
const RESOURCE_INSTANCE_SPACE = PUBLIC_KEY_SIZE + 1;

export class BorshChallenge extends BorshConstructable { }
AllBorshSchemas.set(BorshChallenge, {
    kind: 'struct',
    fields: [
        ['from', [PUBLIC_KEY_SIZE]],
        ['to', [PUBLIC_KEY_SIZE]],
        ['value', 'u8'],
    ]
})
const CHALLENGE_SPACE = PUBLIC_KEY_SIZE + PUBLIC_KEY_SIZE + 1;

const MAX_NUM_RECIPIENTS = 2;
const MAX_NUM_RESOURCE_INSTANCES = MAX_NUM_RECIPIENTS;
const MAX_NUM_CHALLENGES = MAX_NUM_RECIPIENTS * MAX_NUM_RECIPIENTS;
export class BorshResourceDatabase extends BorshConstructable { }
AllBorshSchemas.set(BorshResourceDatabase, {
    kind: 'struct',
    fields: [
        ['isDistributed', 'u8'],
        ['finalQuantity', 'u8'],
        ['intents', [PUBLIC_KEY_SIZE * MAX_NUM_RECIPIENTS]],
        ['instances', [RESOURCE_INSTANCE_SPACE * MAX_NUM_RESOURCE_INSTANCES]],
        ['challenges', [CHALLENGE_SPACE * MAX_NUM_CHALLENGES]],
        ['claims', [PUBLIC_KEY_SIZE * MAX_NUM_RECIPIENTS]],
    ]
})

function paddedString(str: string, len: number): Uint8Array {
    let name = new Uint8Array(len);
    let encoder = new TextEncoder();
    let nameSlice = encoder.encode(str).slice(0, len);
    name.set(nameSlice);
    return name;
}

// Note: text decoder would normally return 'NAME%00%00%00%00%00%00%00%00'
// Unfortunately, this will also strip out any character with an encoding: ñ
// TODO: add some other algorithm to trim %00 from end
function decodeAndUnescape(str: Uint8Array): string {
    let decoder = new TextDecoder("utf-8");
    let strWithEncodedNulls = decoder.decode(str);
    return encodeURIComponent(strWithEncodedNulls).split("%")[0];
}

function toBorsh(libObject: any): Uint8Array {
    if (libObject instanceof TrustTableEntry) {
        return serialize(AllBorshSchemas,
            new BorshTrustTableEntry({
                id: Uint8Array.from(libObject.id.toBuffer()),
                value: libObject.value
            })
        );
    } else if (libObject instanceof SearchEngineAccount) {
        let name = paddedString(libObject.friendlyName, MAX_FRIENDLY_NAME_SIZE);

        let trustTableEntryIndex = 0;
        let trustTableEntries = new Uint8Array();
        // TODO can probably replace this with .set(..., index * size)
        while (trustTableEntryIndex < libObject.trustTable.length) {
            let serialized = toBorsh(libObject.trustTable[trustTableEntryIndex]);
            trustTableEntries = Uint8Array.from([...trustTableEntries, ...serialized]);
            trustTableEntryIndex += 1;
        }
        while (trustTableEntryIndex < MAX_TRUST_TABLE_SIZE) {
            let serialized = toBorsh(DEFAULT_TRUST_TABLE_ENTRY);
            trustTableEntries = Uint8Array.from([...trustTableEntries, ...serialized]);
            trustTableEntryIndex += 1;
        }

        let intents = new Uint8Array(96);
        let intentIndex = 0;
        while (intentIndex < MAX_NUM_INTENTS) {
            if (intentIndex >= libObject.intents.length) {
                break;
            }
            intents.set(Uint8Array.from(libObject.intents[intentIndex].toBuffer()), intentIndex * PUBLIC_KEY_SIZE);
            intentIndex += 1;
        }
        return serialize(AllBorshSchemas,
            new BorshSearchEngineAccount({
                friendlyName: name,
                trustTable: trustTableEntries,
                intents: intents,
            })
        );
    } else if (libObject instanceof Resource) {
        let name = paddedString(libObject.name, MAX_FRIENDLY_NAME_SIZE);
        let zip = paddedString(libObject.location.zip, MAX_ZIP_SIZE);
        return serialize(AllBorshSchemas,
            new BorshResource({
                address: Uint8Array.from(libObject.address.toBuffer()),
                name: name,
                location: zip,
                trustThreshold: 10,
            })
        );
    } else if (libObject instanceof ResourceIndex) {
        let bucketIndex = 0;
        let resources = new Uint8Array(RESOURCE_INDEX_ACCOUNT_SPACE);
        libObject.resources.forEach((value, zip, map) => {
            let bucketOffset = bucketIndex * BUCKET_SPACE;
            resources.set(paddedString(zip, MAX_ZIP_SIZE), bucketOffset);
            value.forEach((value, index, arr) => {
                let addressOffset = bucketOffset + MAX_ZIP_SIZE + (index * PUBLIC_KEY_SIZE);
                resources.set(Uint8Array.from(value.toBuffer()), addressOffset);
            })
            bucketIndex += 1;
        })

        return serialize(AllBorshSchemas,
            new BorshResourceIndex({
                resources: resources,
            })
        );
    } else if (libObject instanceof Challenge) {
        return serialize(AllBorshSchemas, new BorshChallenge({
            from: Uint8Array.from(libObject.fromAddress.toBuffer()),
            to: Uint8Array.from(libObject.toAddress.toBuffer()),
            value: libObject.accepted,
        }));
    } else if (libObject instanceof ResourceInstance) {
        return serialize(AllBorshSchemas, new BorshResourceInstance({
            from: Uint8Array.from(libObject.from.toBuffer()),
            quantity: libObject.quantity,
        }));
    } else if (libObject instanceof ResourceDatabase) {
        let intents = new Uint8Array(64);
        libObject.intents.forEach((intent, index) => {
            intents.set(Uint8Array.from(intent.toBuffer()), index * PUBLIC_KEY_SIZE)
        });

        let instances = new Uint8Array(66);
        libObject.instances.forEach((instance, index) => {
            let serialized = toBorsh(instance);
            instances.set(serialized, index * RESOURCE_INSTANCE_SPACE);
        })

        let challeneges = new Uint8Array(260);
        libObject.challenges.forEach((challenge, index) => {
            let serialized = toBorsh(challenge);
            challeneges.set(serialized, index * CHALLENGE_SPACE);
        });

        let claims = new Uint8Array(64);
        libObject.claims.forEach((claim, index) => {
            claims.set(Uint8Array.from(claim.toBuffer()), index * PUBLIC_KEY_SIZE)
        });

        return serialize(AllBorshSchemas, new BorshResourceDatabase({
            isDistributed: libObject.isDistributed,
            finalQuantity: libObject.finalQuantity,
            intents: intents,
            instances: instances,
            challenges: challeneges,
            claims: claims,
        }));
    } else if (libObject === undefined) {
        throw new Error("undefined passed to toBorsh. This is probably from an assumption in a specific if-else block of toBorsh (arrays are certain size, certain fields set)");
    } else {
        throw new Error("type not supported, add to AllBorshSchemas variable in lib-serialization. also make sure server side supports this type");
    }
}

function toTyped(t: any, borshBuffer: Buffer): any {
    if (t === TrustTableEntry) {
        let deserialized = deserialize(AllBorshSchemas, BorshTrustTableEntry, borshBuffer)
        return new TrustTableEntry(new PublicKey(deserialized.id), deserialized.value);
    } else if (t === SearchEngineAccount) {
        let deserialized = deserialize(AllBorshSchemas, BorshSearchEngineAccount, borshBuffer);
        let friendlyName = decodeAndUnescape(deserialized.friendlyName);
        // TODO: iterative over buffer and deserialze individual elements
        let trustTableEntry = toTyped(TrustTableEntry, Buffer.from(deserialized.trustTable));
        let trustTable = [];
        if (trustTableEntry.id.toBase58() !== DEFAULT_TRUST_TABLE_ENTRY.id.toBase58()) {
            trustTable.push(trustTableEntry);
        }

        let intentIndex = 0;
        let intents = [];
        while (intentIndex < MAX_NUM_INTENTS) {
            let key = new PublicKey(deserialized.intents.slice(intentIndex * PUBLIC_KEY_SIZE, intentIndex * PUBLIC_KEY_SIZE + PUBLIC_KEY_SIZE));
            if (key.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                intents.push(key);
            }
            intentIndex += 1;
        }
        return new SearchEngineAccount(friendlyName, trustTable, intents);
    } else if (t === Resource) {
        let deserialized = deserialize(AllBorshSchemas, BorshResource, borshBuffer)
        let name = decodeAndUnescape(deserialized.name);
        let zip = decodeAndUnescape(deserialized.location);
        return new Resource(name, new Location(zip), new PublicKey(deserialized.address), deserialized.trustThreshold);
    } else if (t === ResourceIndex) {
        let bucketIndex = 0;
        let map = new Map<Location, Array<PublicKey>>();
        while (bucketIndex < MAX_INDEX_BUCKETS) {
            let bucketOffset = bucketIndex * BUCKET_SPACE;
            let zip = borshBuffer.slice(bucketOffset, MAX_ZIP_SIZE);
            if (!zip.length) {
                bucketIndex += 1;
                continue;
            }
            let location = new Location(decodeAndUnescape(zip))
            let bucket = [];
            let bucketValueIndex = 0;
            while (bucketValueIndex < MAX_NUM_RESOURCE_IN_BUCKET) {
                let addressOffset = bucketOffset + MAX_ZIP_SIZE + (bucketValueIndex * PUBLIC_KEY_SIZE);
                let key = new PublicKey(borshBuffer.slice(addressOffset, addressOffset + PUBLIC_KEY_SIZE))
                if (key.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                    bucket.push(key);
                }
                bucketValueIndex += 1;
            }
            map.set(location.zip, bucket)
            bucketIndex += 1;
        }

        return new ResourceIndex(map);
    } else if (t === Challenge) {
        let deserialized = deserialize(AllBorshSchemas, BorshChallenge, borshBuffer)
        return new Challenge(new PublicKey(deserialized.from), new PublicKey(deserialized.to), deserialized.value ? true : false);
    } else if (t === ResourceInstance) {
        let deserialized = deserialize(AllBorshSchemas, BorshResourceInstance, borshBuffer);
        return new ResourceInstance(new PublicKey(deserialized.from), deserialized.quantity);
    } else if (t === ResourceDatabase) {
        let deserialized = deserialize(AllBorshSchemas, BorshResourceDatabase, borshBuffer);
        let intents = [];
        let intentIndex = 0;
        while (intentIndex < MAX_NUM_RECIPIENTS) {
            let key = new PublicKey(deserialized.intents.slice(intentIndex * PUBLIC_KEY_SIZE, intentIndex * PUBLIC_KEY_SIZE + PUBLIC_KEY_SIZE));
            if (key.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                intents.push(key);
            }
            intentIndex += 1;
        }
        let instances = [];
        let instanceIndex = 0;
        while (instanceIndex < MAX_NUM_RESOURCE_INSTANCES) {
            let typed = toTyped(ResourceInstance, Buffer.from(deserialized.instances).slice(instanceIndex * RESOURCE_INSTANCE_SPACE, instanceIndex * RESOURCE_INSTANCE_SPACE + RESOURCE_INSTANCE_SPACE));
            if (typed.from.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                instances.push(typed);
            }
            instanceIndex += 1;
        }
        let challenges = [];
        let challengeIndex = 0;
        while (challengeIndex < MAX_NUM_CHALLENGES) {
            let typed = toTyped(Challenge, Buffer.from(deserialized.challenges).slice(challengeIndex * CHALLENGE_SPACE, challengeIndex * CHALLENGE_SPACE + CHALLENGE_SPACE));
            if (typed.fromAddress.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                challenges.push(typed);
            }
            challengeIndex += 1;
        }
        let claims = [];
        let claimIndex = 0;
        while (claimIndex < MAX_NUM_RECIPIENTS) {
            let key = new PublicKey(deserialized.claims.slice(claimIndex * PUBLIC_KEY_SIZE, claimIndex * PUBLIC_KEY_SIZE + PUBLIC_KEY_SIZE));
            if (key.toBase58() !== EMPTY_PUBLIC_KEY.toBase58()) {
                claims.push(key);
            }
            claimIndex += 1;
        }
        return new ResourceDatabase(deserialized.isDistributed ? true : false, deserialized.finalQuantity, intents, instances, challenges, claims);
    } else {
        throw new Error("type not supported. add a custom Borsh object in lib-serialization. also make sure server side supports this type");
    }
}

export { toBorsh, toTyped };