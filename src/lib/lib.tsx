import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { Store, WrongInstanceError, KeyNotFoundError } from './util';
import {
  IResourceAPI, ISearchEngine, ChallengeTable, Resource, ResourceInstance,
  Challenge, SearchEngineAccount, Location, SE_INSTRUCTION_UPDATE_ACCOUNT, SE_INSTRUCTION_REGISTER_RESOURCE,
  ResourceIndex, SE_INSTRUCTION_REGISTER_INTENT, RESOURCE_INSTRUCTION_REGISTER_INTENT, ResourceDatabase, RESOURCE_INSTRUCTION_RECORD_RESOURCE_INSTANCE
} from './lib-types';
import { toBorsh, toTyped, SEARCH_ENGINE_ACCOUNT_SPACE } from './lib-serialization';


export class ResourceAPI implements IResourceAPI {
  connection: Connection;
  resource: Resource;
  databaseId: PublicKey;
  payerAccount: Account;

  constructor(connection: Connection, resource: Resource, databaseId: PublicKey, payerAccount: Account) {
    this.connection = connection;
    this.resource = resource;
    this.databaseId = databaseId;
    this.payerAccount = payerAccount;
  }

  async healthCheck(): Promise<void> {
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [],
        programId: this.resource.address,
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

  async getDatabase(): Promise<ResourceDatabase> {
    let accountInfo = await this.connection.getAccountInfo(this.databaseId);
    if (accountInfo == null) {
      throw new Error("NO ACCOUNT INFO FOUND");
    }
    // store in cache
    // this.store.put(searchEngineAccount.account.publicKey.toBase58(), searchEngineAccount)
    return toTyped(ResourceDatabase, accountInfo.data);
  }

  async registerIntent(account: Account): Promise<void> {
    let instruction = new Uint8Array([RESOURCE_INSTRUCTION_REGISTER_INTENT]);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.databaseId, isSigner: false, isWritable: true },
          { pubkey: account.publicKey, isSigner: false, isWritable: false },
        ],
        programId: this.resource.address,
        data: Buffer.from(instruction),
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

  async recordResourceInstance(instance: ResourceInstance): Promise<void> {
    let instruction = new Uint8Array([RESOURCE_INSTRUCTION_RECORD_RESOURCE_INSTANCE]);
    let instruction_data = toBorsh(instance);
    let combined = new Uint8Array(1 + instruction_data.length);
    combined.set(instruction);
    combined.set(instruction_data, 1);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.databaseId, isSigner: false, isWritable: true },
        ],
        programId: this.resource.address,
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
      new Challenge(new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"), new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"), false),
      new Challenge(new PublicKey("2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6"), new PublicKey("4RmyNU1MCKkqLa6sHs8CC75gXrXaBw6mH9Z3ApkEkJvn"), false)
    ])
  }

  async approveChallenge(challenege: Challenge): Promise<void> {
    // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
    // for challenge in challenges:
    //   if req.to == challenge.to && param.to == challenge.to && req.from == challenge.from
    //     challenege.approved = true
  }
  async denyChallenge(challenege: Challenge): Promise<void> {
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


export class SearchEngineAPI implements ISearchEngine {
  connection: Connection;
  programId: PublicKey;
  databaseId: PublicKey;
  payerAccount: Account;
  store: Store;
  readonly ACCOUNT_KEY = "searchengine_this_account"

  constructor(connection: Connection, programId: PublicKey, databaseId: PublicKey, store: Store, payerAccount: Account) {
    this.connection = connection;
    this.programId = programId;
    this.databaseId = databaseId;
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
    let searchEngineAccount = new SearchEngineAccount(friendlyName, [], []);
    // store on chain
    const lamports = await this.connection.getMinimumBalanceForRentExemption(SEARCH_ENGINE_ACCOUNT_SPACE);
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.payerAccount.publicKey,
        newAccountPubkey: account.publicKey,
        lamports: lamports,
        space: SEARCH_ENGINE_ACCOUNT_SPACE,
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
    await this.updateSearchEngineAccount(account, searchEngineAccount);
    this.store.put(this.ACCOUNT_KEY, searchEngineAccount);
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
    let instruction = new Uint8Array([SE_INSTRUCTION_UPDATE_ACCOUNT]);
    let instruction_data = toBorsh(searchEngineAccount);
    let combined = new Uint8Array(1 + instruction_data.length);
    combined.set(instruction);
    combined.set(instruction_data, 1);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [{ pubkey: account.publicKey, isSigner: false, isWritable: true }],
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
        let accountInfo = await this.connection.getAccountInfo(key);
        if (accountInfo == null) {
          throw new Error("NO ACCOUNT INFO FOUND");
        }
        let searchEngineAccount: SearchEngineAccount = toTyped(SearchEngineAccount, accountInfo.data);
        // store in cache
        // this.store.put(searchEngineAccount.account.publicKey.toBase58(), searchEngineAccount)
        return searchEngineAccount;
      }
      throw error;
    }
  }

  async registerResource(resource: Resource): Promise<void> {
    let instruction = new Uint8Array([SE_INSTRUCTION_REGISTER_RESOURCE]);
    let instruction_data = toBorsh(resource);
    let combined = new Uint8Array(1 + instruction_data.length);
    combined.set(instruction);
    combined.set(instruction_data, 1);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [{ pubkey: this.databaseId, isSigner: false, isWritable: true }],
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

  async getResourceIndex(): Promise<ResourceIndex> {
    let databaseInfo = await this.connection.getAccountInfo(this.databaseId);
    if(databaseInfo == null) {
      throw new Error("NO DATABASE DATA FOUND");
    }
    return toTyped(ResourceIndex, databaseInfo.data);
  }

  async listResources(location: Location): Promise<Array<Resource>> {
    let allResources = await this.getResourceIndex();
    let unresolvedResources: Array<Resource> = [];

    // query for all resources
    if(location.zip.trim().length === 0) {
      allResources.resources.forEach((bucket, location_zip, map) => {
        let unresolvedBucketResources = bucket.map(id => new Resource("unknown", new Location(location_zip), id, 0));
        unresolvedResources = unresolvedResources.concat(unresolvedBucketResources);
      });
      return unresolvedResources;
    }

    // query for specific resources
    let locationResources = allResources.resources.get(location.zip);
    for(let id of locationResources || []) {
      unresolvedResources.push(new Resource("unknown", location, id, 0))
    }
    return unresolvedResources;
  }

  async registerIntent(account: Account, resource: PublicKey): Promise<void> {
    let instruction = new Uint8Array([SE_INSTRUCTION_REGISTER_INTENT]);
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.databaseId, isSigner: false, isWritable: false },
          { pubkey: account.publicKey, isSigner: false, isWritable: true},
          { pubkey: resource, isSigner: false, isWritable: false},
        ],
        programId: this.programId,
        data: Buffer.from(instruction),
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

  async listIntents(account: Account): Promise<Array<PublicKey>> {
    let details = await this.getAccountDetails(account.publicKey);
    return details.intents;
  }
}
