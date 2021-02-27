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
import { Store, WrongInstanceError, KeyNotFoundError } from './util';
import { IResourceAPI, ISearchEngine, ChallengeTable, Resource, ResourceInstance, Challenege, SearchEngineAccount, Location } from './lib-types';
import { toBorsh, toTyped } from './lib-serialization';


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


export class SearchEngineAPI implements ISearchEngine {
  connection: Connection;
  programId: PublicKey;
  payerAccount: Account;
  store: Store;
  readonly ACCOUNT_KEY = "searchengine_this_account"
  readonly SEARCH_ENGINE_ACCOUNT_SPACE = 45;
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
    const lamports = await this.connection.getMinimumBalanceForRentExemption(this.SEARCH_ENGINE_ACCOUNT_SPACE);
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.payerAccount.publicKey,
        newAccountPubkey: account.publicKey,
        lamports: lamports,
        space: this.SEARCH_ENGINE_ACCOUNT_SPACE,
        programId: this.programId,
      }),
    );
    let result = await sendAndConfirmTransaction(
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
    let instruction = new Uint8Array([this.INSTRUCTION_UPDATE_ACCOUNT]);
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
          throw "NO ACCOUNT INFO FOUND";
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
