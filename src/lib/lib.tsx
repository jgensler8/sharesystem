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
} from '@solana/web3.js';
import { randomInt } from 'mz/crypto';
import {Store, WrongInstanceError, KeyNotFoundError} from './util';

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
  name: string;
  id: string;
  value: number;

  constructor(name: string, id: string, value: number) {
    this.name = name;
    this.id = id;
    this.value = value;
  }
}

export class TrustTable {
  entries: Array<TrustTableEntry>;

  constructor(entries: Array<TrustTableEntry>) {
    this.entries = entries;
  }
}

export class SearchEngineAccount {
  account: Account;
  friendlyName: string;
  trustTable: TrustTable;

  constructor(account: Account, friendlyName: string, trustTable: TrustTable) {
    this.account = account;
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

export class Resource {
  name: string;
  zip: string;
  programId: PublicKey;

  constructor(name: string, zip: string, programId: PublicKey) {
    this.name = name;
    this.zip = zip;
    this.programId = programId;
  }

  /*
  Upload of a robot/human that X amount of resource exists, shold prove to other accounts that the resource is available
  */
  async recordResourceInstance(instance: ResourceInstance): Promise<void> {
    // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
    // if is_being_distributed
    //   return

    // let mut resource_record_instances: []ResourceRecordInstance = some_borsh_call::read_array(&data)
    // resource_record_instances.append(instance)
    // could maybe do a mint/burn for incentive structue to record resource
  }

  // ************************************************************************
  // Challenge
  // ************************************************************************

  /*
  Timelocks the resources and (ideally) notifies individuals that they can challenge for their claims
  Can only be done by resource maintainer
  Should verify that trust exists between all accounts with intent, remove non-trustworthy accounts, calcuate distribution
  algorithm: self -> owned_resources -> resource -> resource.data
  */
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

  /*
  list challenges that either:
      * require input
      * request other's input
  algorithm: self -> intents -> resources -> resource.data
  */
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

  /*
  approve a challenge to increase challenge trust level and (hopefully/eventually) enable the resource to be claimed
  algorithm: self -> intents -> resources -> resource.data
  */
  async approveChallenge(challenege: Challenege): Promise<void> {
    // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
    // for challenge in challenges:
    //   if req.to == challenge.to && param.to == challenge.to && req.from == challenge.from
    //     challenege.approved = true
  }
  async denyChallenge(challenege: Challenege): Promise<void> {
  }

  /*
  claim the rewards from a challenge:
  algorithm: self -> intents -> resource -> resource.data
  */
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

export class SearchEngineAPI {
  connection: Connection;
  programId: PublicKey;
  payerAccount: Account;
  store: Store;
  readonly ACCOUNT_KEY = "searchengine_this_account"

  constructor(connection: Connection, programId: PublicKey, store: Store, payerAccount: Account) {
    this.connection = connection;
    this.programId = programId;
    this.store = store;
    this.payerAccount = payerAccount;
  }

  // ************************************************************************
  // Account
  // ************************************************************************

  async createDefaultSearchEngineAccount(friendlyName: string): Promise<SearchEngineAccount> {
    let account = new SearchEngineAccount(new Account(), friendlyName, new TrustTable([]));
    // store on chain
    // const transaction = new Transaction().add(
    //   SystemProgram.createAccount({
    //     fromPubkey: payerAccount.publicKey,
    //     newAccountPubkey: greetedPubkey,
    //     lamports,
    //     space,
    //     programId, <------------- this is the search engine program id
    //   }),
    // );
    // await sendAndConfirmTransaction(
    //   connection,
    //   transaction,
    //   [payerAccount, greetedAccount],
    //   {
    //     commitment: 'singleGossip',
    //     preflightCommitment: 'singleGossip',
    //   },
    // );
    this.store.put(this.ACCOUNT_KEY, account)
    return account;
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

  async updateSearchEngineAccount(account: SearchEngineAccount): Promise<void> {
    // update internal store
    // update blockchain with transaction
  }

  async getAccountDetails(address: PublicKey): Promise<SearchEngineAccount> {
    // check cache
    try {
      return this._getSearchEngineAccount(address.toBase58());
    } catch(error){
      if(error instanceof KeyNotFoundError) {
        // read from chain
        let searchEngineAccount = new SearchEngineAccount(new Account(), "test_" + randomInt(10000), new TrustTable([]));
        // store in cache
        this.store.put(searchEngineAccount.account.publicKey.toBase58(), searchEngineAccount)
        return searchEngineAccount;
      }
      throw error;
    }
  }

  // ************************************************************************
  // Resource
  // ************************************************************************

  /*
  Create resource to share with others. Should have a way for ResourceInstance to be recorded or verified (like posting photo to chain for someone to validate later)
  Will also need to describe how much memory (based on the number of people * wallet id size * claim pointer size)
  */
  async registerResource(resource: Resource): Promise<void> {
    // the resource is a contract owned by the person above? I think contracts also have data regions
    // deploys a new contract and creates the database account for the contract
    // register resource contract with search engine (factory)
  }

  /*
  Find resources able to the claimed. Likely can use zipcode/lat+long plus radius
  */
  async listResources(): Promise<Resource[]> {
    return [
      new Resource(
        "palo alto potatoes",
        "9420",
        new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"),
      ),
      new Resource(
        "mountain view tomatoes",
        "94040",
        new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"),
      )
    ];
  }


  // ************************************************************************
  // Intent
  // ************************************************************************

  /*
  Signal to resource maintainer that you wish to claim resource by a specific time
  */
  async recordIntent(resource: Resource): Promise<void> {
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
}

export class ResourceAPI {

  connection: Connection;
  programId: string;

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    this.programId = programId;
  }
}