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

export class Resource {
  name: string;
  zip: string;

  constructor(name: string, zip: string) {
    this.name = name;
    this.zip = zip;
  }
}

export class SearchEngineAPI {
    connection: Connection;
    programId: PublicKey;
    account: Account;

    constructor(connection: Connection, programId: PublicKey, account: Account) {
        this.connection = connection;
        this.programId = programId;
        this.account = account;
    }

    /*
        TODO(jeffg): replace with output from bootstrap.tsx
    */
    // readonly programId = new PublicKey("123");

    // ************************************************************************
    // Account
    // ************************************************************************

    /*
    Bootstrap account for someone to use. Shoul be airdropped SOL for rent. Maybe will need some "local" airdrop account?
    */
    async createAccount(name: string) {
        // AccountInfo::New()
        // let account = await newAccountWithLamports(connection);

        // let programId = this.programId;

        // const instruction = new TransactionInstruction({
        //     keys: [{pubkey: account.publicKey, isSigner: false, isWritable: true}],
        //     programId,
        //     data: Buffer.alloc(0), // All instructions are hellos
        // });
        // await sendAndConfirmTransaction(
        //     connection,
        //     new Transaction().add(instruction),
        //     [account],
        //     {
        //     commitment: 'singleGossip',
        //     preflightCommitment: 'singleGossip',
        //     },
        // );
    }

    /*
    Update Account information
    */
    updateAccount() {
        // AccountInfo->data.(trust_table) = TrustTable
        // for resource in resources
        //   rescource.contract.trust_table = param.trust_table

        // account.resources = 
    }

    // ************************************************************************
    // Resource
    // ************************************************************************

    /*
    Create resource to share with others. Should have a way for ResourceInstance to be recorded or verified (like posting photo to chain for someone to validate later)
    Will also need to describe how much memory (based on the number of people * wallet id size * claim pointer size)
    */
    createResource() {
        // the resource is a contract owned by the person above? I think contracts also have data regions
        // deploys a new contract and creates the database account for the contract
        // register resource contract with search engine (factory)
    }

    /*
    Find resources able to the claimed. Likely can use zipcode/lat+long plus radius
    */
    async listResources(): Promise<Resource[]> {
      // return new Promise((resolve) => { resolve([])});

      console.log(this.account);

      const instruction = new TransactionInstruction({
          keys: [],
          programId: this.programId,
          data: Buffer.alloc(0),
      })
      await sendAndConfirmTransaction(
          this.connection,
          new Transaction().add(instruction),
          [this.account],
          {
          commitment: 'singleGossip',
          preflightCommitment: 'singleGossip',
          },
      );
      return [];
    }

    /*
    Upload of a robot/human that X amount of resource exists, shold prove to other accounts that the resource is available
    */
    recordResourceInstance() {
        // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
        // if is_being_distributed
        //   return

        // let mut resource_record_instances: []ResourceRecordInstance = some_borsh_call::read_array(&data)
        // resource_record_instances.append(instance)
        // could maybe do a mint/burn for incentive structue to record resource
    }

    /*
    Signal to resource maintainer that you wish to claim resource by a specific time
    */
    recordIntent(){
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

    // ************************************************************************
    // Challenge
    // ************************************************************************

    /*
    Timelocks the resources and (ideally) notifies individuals that they can challenge for their claims
    Can only be done by resource maintainer
    Should verify that trust exists between all accounts with intent, remove non-trustworthy accounts, calcuate distribution
    algorithm: self -> owned_resources -> resource -> resource.data
    */
    initiateDistribution() {
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
    Challenge creation is done by the person who wants to receive the resource
    algorithm: self -> intents -> resource -> resource.data
    */
    createChallenge(){
        // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
        // if is_being_distributed == false
        //    return

        // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
        // for challengee in params.challengees
        //   challenges.append(new Challenge(req.account, challengeee))
    }

    /*
    Remove a challenge after creation. only done by person who created challenge.
    algorithm: self -> intents -> resource -> resource.data
    */
    deleteChallenge(){
        // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
        // if is_being_distributed == false
        //    return

        // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
        // challenges.find(from=req.account, to=req.challengeee)?.pop_or_delete()
    }

    /*
    list challenges that either:
        * require input
        * request other's input
    algorithm: self -> intents -> resources -> resource.data
    */
    listChallenges(){
        // let mut is_being_distributed: boolean = some_borsh_call::read_bool(&data)
        // if is_being_distributed == false
        //    return

        // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
        // return challenges
    }

    /*
    approve a challenge to increase challenge trust level and (hopefully/eventually) enable the resource to be claimed
    algorithm: self -> intents -> resources -> resource.data
    */
    approveChallenge(){
        // let mut challenges: []Challenge = some_borsh_call::read_array(&data)
        // for challenge in challenges:
        //   if req.to == challenge.to && param.to == challenge.to && req.from == challenge.from
        //     challenege.approved = true
    }

    /*
    claim the rewards from a challenge:
    algorithm: self -> intents -> resource -> resource.data
    */
    claimChallenge(){
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

export class ResourceAPI {

  connection: Connection;
  programId: string;

  constructor(connection: Connection, programId: string) {
      this.connection = connection;
      this.programId = programId;
  }
}