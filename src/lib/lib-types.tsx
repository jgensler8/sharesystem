import { PublicKey, Account } from "@solana/web3.js";
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

export class TrustTableEntry {
  id: PublicKey;
  value: number;

  constructor(id: PublicKey, value: number) {
    this.id = id;
    this.value = value;
  }
}
export let DEFAULT_TRUST_TABLE_ENTRY = new TrustTableEntry(new PublicKey("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), 0)

export let MAX_TRUST_TABLE_SIZE = 1;

export class SearchEngineAccount {
  friendlyName: string;
  trustTable: Array<TrustTableEntry>;

  constructor(friendlyName: string, trustTable: List<TrustTableEntry>) {
    this.friendlyName = friendlyName;
    this.trustTable = trustTable
  }
}

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