import {
  Account,
  Connection,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  get_account_info,
} from '@solana/web3.js';
import { serialize } from 'borsh';
import { enter } from 'ionicons/icons';
import { randomInt } from 'mz/crypto';
import { Store, WrongInstanceError, KeyNotFoundError } from './util';
import { TextEncoder } from "web-encoding";

/*
Memory Structures

TrustTableEntry
* to: wallet id (string?)
* value: float

TrustTable
* List<TrustTableEntry

Location
* zip: string

ResourceInstance
* quantity: float
* yield_expected: Date

Search Engine
fields
* resources Map<Location, Resource>
operations
* register_resource(accounts:[owner, program], data:None)
  auth: accounts[0].is_signer == true and accounts[1].owner ==  accounts[0]
* list_resources(accounts:[], data:Location)
  auth: none
* update_trust_table(accounts:[owner], data:TrustTable)
  auth: searchengine_id == accounts[0].owner and accounts[0].is_signer == true
* register_intent(accounts:[owner, program], data:None)
  auth: searchengine_id == accounts[0].owner and accounts[0].is_signer == true
* list_intents(accounts[search])
  auth: none

Resources
* describe(accounts:[]. data:None) (this might be able to be read directly)
  auth: none
* register_intent(accounts:[search_engine, on_behalf_of], data:None)
  auth: searchengine_id == accounts[0] and accounts[0].is_signer == true
* record_instance(accounts:[data_account], data:ResourceInstance)
  auth: program_id == accounts[0].owner and accounts[0].is_signer == true
* initiate_distribution(accounts:[program_owner])
  auth: contract.owner == accounts[0] and accounts[0].is_signer == true
* approve_challenge(accounts:[owner, challenger], data:None)
  auth: searchengine_id == accounts[0].owner and searchengine_id == accounts[1].owner and accounts[0].is_signer == true
* deny_challenge(accounts:[owner, challenger], data:None)
  auth: searchengine_id == accounts[0].owner and searchengine_id == accounts[1].owner and accounts[0].is_signer == true
* claim(accounts[owner], data:None)
  auth: searchengine_id == accounts[0].owner and accounts[0].is_signer == true
*/

class BorshConstructable {
  constructor(properties: object) {
    Object.keys(properties).map((key) => {
      this[key] = properties[key];
    });
  }
}
export let AllBorshSchemas = new Map();

export class TrustTableEntry {
  id: PublicKey;
  value: number;

  constructor(id: PublicKey, value: number) {
    this.id = id;
    this.value = value;
  }

  to_borsh(): BorshTrustTableEntry {
    return new BorshTrustTableEntry({
      id: Uint8Array.from(this.id.toBuffer()),
      value: this.value
    })
  }
}
export class BorshTrustTableEntry extends BorshConstructable {
  to_typed(): TrustTableEntry {
    return new TrustTableEntry(new PublicKey(this.id), this.value);
  }
}
AllBorshSchemas.set(BorshTrustTableEntry, {
  kind: 'struct',
  fields: [
    ['id', [32]],
    ['value', 'u8']
  ]
});


// export let MAX_TRUST_TABLE_SIZE = 1;
// export class TrustTable {
//   entries: Array<TrustTableEntry>;

//   constructor(entries: Array<TrustTableEntry>) {
//     this.entries = entries;
//   }

//   to_borsh(): BorshTrustTable {
//     return new BorshTrustTable({
//       entries: this.entries.map(entry => entry.to_borsh()),
//     })
//   }
// }
// export class BorshTrustTable extends BorshConstructable {
//   to_typed(): TrustTable {
//     return new TrustTable(
//       this.entries.map(entry => entry.to_typed()),
//     )
//   }
// }
// AllBorshSchemas.set(BorshTrustTable, {
//   kind: 'struct',
//   fields: [
//     ['entries', [BorshTrustTableEntry]]
//   ]
// })

export class SearchEngineAccount {
  friendlyName: string;
  trustTable: Array<TrustTableEntry>;

  constructor(friendlyName: string, trustTable: List<TrustTableEntry>) {
    this.friendlyName = friendlyName;
    this.trustTable = trustTable
  }

  to_borsh(): BorshSearchEngineAccount {
    let name = new Uint8Array(12);
    let encoder = new TextEncoder("utf-8");
    let nameSlice = encoder.encode(this.friendlyName).slice(0, 12);
    name.set(nameSlice);

    let trustTable = serialize(AllBorshSchemas, this.trustTable[0].to_borsh());
    return new BorshSearchEngineAccount({
      friendlyName: name,
      trustTable: trustTable, 
    })
  }
}
export class BorshSearchEngineAccount extends BorshConstructable {
  to_typed(): SearchEngineAccount {
    return new SearchEngineAccount(this.friendlyName,  this.trustTable.map(entry => entry.to_typed()));
  }
}
AllBorshSchemas.set(BorshSearchEngineAccount, {
  kind: 'struct',
  fields: [
    ['friendlyName', [12]],
    ['trustTable', [33]]
  ]
})

export class ResourceInstance {
  quantity: number;

  constructor(quantity: number) {
    this.quantity = quantity;
  }
}

export class Challenege {
  fromAddress: PublicKey;
  toAddress: PublicKey;
  accepted: boolean;

  constructor(fromAddress: PublicKey, toAddress: PublicKey, accepted: boolean) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.accepted = accepted;
  }
}

export class ChallengeTable {
  entries: Array<Challenege>

  constructor(entries: Array<Challenege>) {
    this.entries = entries;
  }
}

export class Location {
  zip: string;

  constructor(zip: string) {
    this.zip = zip;
  }
}

export class Resource {
  name: string;
  location: Location;
  programId: PublicKey;
  trustThreshold: number;

  constructor(name: string, location: Location, programId: PublicKey, trustThreshold: number) {
    this.name = name;
    this.location = location;
    this.programId = programId;
    this.trustThreshold = trustThreshold;
  }
}

export interface IResourceAPI {
  /*
  Upload of a robot/human that X amount of resource exists, shold prove to other accounts that the resource is available
  */
  recordResourceInstance(instance: ResourceInstance): Promise<void>;

  /*
  Timelocks the resources and (ideally) notifies individuals that they can challenge for their claims
  Can only be done by resource maintainer
  Should verify that trust exists between all accounts with intent, remove non-trustworthy accounts, calcuate distribution
  */
  initiateDistribution(): Promise<void>;

  /*
  list challenges that either:
      * require input
      * request other's input
  */
  listChallenges(): Promise<ChallengeTable>;

  /*
  approve a challenge to increase challenge trust level and (hopefully/eventually) enable the resource to be claimed
  */
  approveChallenge(challenege: Challenege): Promise<void>;

  /*
  claim the rewards from a challenge
  */
  claimChallenge(from: PublicKey): Promise<void>;
}

export class ResourceAPI implements IResourceAPI {
  resource: Resource;

  constructor(resource: Resource) {
    this.resource = resource;
  }

  async recordResourceInstance(instance: ResourceInstance): Promise<void> {
    // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
    // if is_being_distributed
    //   return

    // let mut resource_record_instances: []ResourceRecordInstance = some_borsh_call::read_array(&data)
    // resource_record_instances.append(instance)
    // could maybe do a mint/burn for incentive structue to record resource
  }

  async initiateDistribution(): Promise<void> {
    // should create challenges matrix for everyone

    // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
    // is_being_distributed = true

    // kick out accounts with intent that don't satisfy trust from resource owner -> intent
    // owners_table = contrant.trust_table[contract.owner]
    // for address in contract.trust_table
    //   if address not in owners_table
    //     contract.trust_table[address] = null

    // Note: can use some more sophisticated algorithm to decide how many there are
    // let expected_resources = average(resource_record_instances)
    // let mut resources_per_intent: uint = expected_resources / len(contract.intent_array)
  }

  async listChallenges(): Promise<ChallengeTable> {
    // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
    // if is_being_distributed == false
    //    return

    // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
    // return challenges
    return new ChallengeTable([
      new Challenege(new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"), new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"), false),
      new Challenege(new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"), new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"), false)
    ])
  }

  async approveChallenge(challenege: Challenege): Promise<void> {
    // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
    // for challenge in challenges:
    //   if req.to == challenge.to && param.to == challenge.to && req.from == challenge.from
    //     challenege.approved = true
  }
  async denyChallenge(challenege: Challenege): Promise<void> {
  }

  async claimChallenge() {
    // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
    // trust_score = 0
    // for challenge in challenges:
    //   if req.from == challenge.from && challenge.approved = true
    //     trust_from_owner_to_challenger = contract.trust_table[req.from]
    //     trust_from_challengee_to_owner = contract.trust_table[challenge.to]
    //     trust_score += (trust_from_owner_to_challenger * trust_from_challengee_to_owner)

    // if trust_score > contract.min_trust_score
    //   contract.claim_table[req.from] = true
    //   contract.inventory_available -= 
  }
}

export interface ISearchEngine {

  healthCheck(): Promise<void>;

  // ************************************************************************
  // Account
  // ************************************************************************

  createDefaultSearchEngineAccount(account: Account, friendlyName: string): Promise<SearchEngineAccount>;

  getDefaultSearchEngineAccount(): Promise<SearchEngineAccount>;

  updateSearchEngineAccount(account: Account, searchEngineAccount: SearchEngineAccount): Promise<void>;

  getAccountDetails(key: PublicKey): Promise<SearchEngineAccount>;

  // ************************************************************************
  // Resource
  // ************************************************************************

  /*
  Create resource to share with others. Should have a way for ResourceInstance to be recorded or verified (like posting photo to chain for someone to validate later)
  Will also need to describe how much memory (based on the number of people * wallet id size * claim pointer size)
  */
  registerResource(resource: Resource): Promise<void>;

  /*
  Find resources able to the claimed. Likely can use zipcode/lat+long plus radius
  */
  listResources(location: Location): Promise<Resource[]>;


  // ************************************************************************
  // Intent
  // ************************************************************************

  /*
  Signal to resource maintainer that you wish to claim resource by a specific time
  */
  recordIntent(account: SearchEngineAccount, resource: PublicKey): Promise<void>;

  listIntents(account: SearchEngineAccount): Promise<Array<PublicKey>>;
}

export class SearchEngineAPI implements ISearchEngine {
  connection: Connection;
  programId: PublicKey;
  payerAccount: Account;
  store: Store;
  readonly ACCOUNT_KEY = "searchengine_this_account"
  readonly SEARCH_ENGINE_ACCOUNT_SPACE = 368;
  readonly SEARCH_ENGINE_ACCOUNT_LAMPORTS = 100;
  readonly INSTRUCTION_DEFAULT = 0;
  readonly INSTRUCTION_UPDATE_ACCOUNT = 1;
  readonly INSTRUCTION_REGISTER_RESOURCE = 2;
  readonly INSTRUCTION_REGISTER_INTENT = 3;

  constructor(connection: Connection, programId: PublicKey, store: Store, payerAccount: Account) {
    this.connection = connection;
    this.programId = programId;
    this.store = store;
    this.payerAccount = payerAccount;
  }

  async healthCheck(): Promise<void> {
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [],
        programId: this.programId,
        data: Buffer.alloc(1),
      })
    );
    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.payerAccount],
      {
        commitment: 'singleGossip',
        preflightCommitment: 'singleGossip',
      },
    );
  }

  async createDefaultSearchEngineAccount(account: Account, friendlyName: string): Promise<SearchEngineAccount> {
    let searchEngineAccount = new SearchEngineAccount(friendlyName, []);
    // store on chain
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.payerAccount.publicKey,
        newAccountPubkey: account.publicKey,
        lamports: this.SEARCH_ENGINE_ACCOUNT_LAMPORTS,
        space: this.SEARCH_ENGINE_ACCOUNT_SPACE,
        programId: this.programId,
      }),
    );
    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.payerAccount, account],
      {
        commitment: 'singleGossip',
        preflightCommitment: 'singleGossip',
      },
    );
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
    // update internal store
    this.store.put(this.ACCOUNT_KEY, searchEngineAccount);
    // update blockchain with transaction
    let instruction = new Uint8Array([this.INSTRUCTION_UPDATE_ACCOUNT]);
    let instruction_data = serialize(AllBorshSchemas, searchEngineAccount.to_borsh());
    console.log(instruction_data.length)
    let combined = new Uint8Array(1 + instruction_data.length);
    combined.set(instruction);
    combined.set(instruction_data, 1);
    console.log(combined);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [{pubkey: account.publicKey, isSigner: false, isWritable: true}],
        programId: this.programId,
        data: Buffer.from(combined),
      }),
    );
    await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.payerAccount],
      {
        commitment: 'singleGossip',
        preflightCommitment: 'singleGossip',
      },
    );
  }

  async getAccountDetails(key: PublicKey): Promise<SearchEngineAccount> {
    // check cache
    try {
      return await this._getSearchEngineAccount(key.toBase58());
    } catch (error) {
      if (error instanceof KeyNotFoundError) {
        // TODO: change to get_account_info
        let info = await this.connection.getAccountInfo(key);
        console.log(info);
        // store in cache
        // this.store.put(searchEngineAccount.account.publicKey.toBase58(), searchEngineAccount)
        return new SearchEngineAccount("test", new TrustTable([]));
      }
      throw error;
    }
  }

  async registerResource(resource: Resource): Promise<void> {
    // the resource is a contract owned by the person above? I think contracts also have data regions
    // deploys a new contract and creates the database account for the contract
    // register resource contract with search engine (factory)
  }

  async listResources(location: Location): Promise<Resource[]> {
    return [
      new Resource(
        "palo alto potatoes",
        new Location("9420"),
        new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"),
        1.5,
      ),
      new Resource(
        "mountain view tomatoes",
        new Location("94040"),
        new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"),
        0.9,
      ),
    ];
  }

  async recordIntent(account: SearchEngineAccount, resource: PublicKey): Promise<void> {
    // instead, the "intent" might just be submitting a trust table

    // Example: instead of incrementing a counter, we need to append the some account ID (passed as some parameter) to a list stored in data
    // let mut data = account.try_borrow_mut_data()?;
    // let mut num_greets = LittleEndian::read_u32(&data);
    // num_greets += 1;
    // ... would turn into ...
    // let mut data = account.try_borrow_mut_data()?
    // let mut account_list: []AccountInfo = some_borsh_call::read_array(&data)
    // account_list.append(account_intent)
  }

  async listIntents(account: SearchEngineAccount): Promise<Array<PublicKey>> {
    return [];
  }
}

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
    let searchEngineAccount = new SearchEngineAccount(new Account(), friendlyName, new TrustTable([]));
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
        let searchEngineAccount = new SearchEngineAccount(new Account(), "test_" + randomInt(10000), new TrustTable([]));
        // store in cache
        this.store.put(searchEngineAccount.account.publicKey.toBase58(), searchEngineAccount)
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