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
import { sys } from 'typescript';

import {loadProgramAddressFromEnvironment, newAccountWithLamports} from './util';

/*
Memory Structures

Account
* trust_table Map<wallet_id, {float}>
* intents List<Resource ID> (wallet ids)
* resources List<Resource ID> (wallet ids)

Resources
* instances List<{time, quantity, account id}>
* challenges List<{wallet_id, quantity}>

*/

export class ResourceShareSystem {

    connection: Connection;
    programId: string;

    constructor(connection: Connection, programId: string) {
        this.connection = connection;
        this.programId = programId;
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
    async createAccount(name: string, zip: string) {
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
    }

    // ************************************************************************
    // Resource
    // ************************************************************************

    /*
    Create resource to share with others. Should have a way for ResourceInstance to be recorded or verified (like posting photo to chain for someone to validate later)
    Will also need to describe how much memory (based on the number of people * wallet id size * claim pointer size)
    */
    createResource() {

    }

    /*
    Find resources able to the claimed. Likely can use zipcode/lat+long plus radius
    */
    listResources() {

    }

    /*
    Upload of a robot/human that X amount of resource exists, shold prove to other accounts that the resource is available
    */
    recordResourceInstance() {

    }

    /*
    Signal to resource maintainer that you wish to claim resource by a specific time
    */
    recordIntent(){

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

    }

    /*
    Challenge creation is done by the person who wants to receive the resource
    algorithm: self -> intents -> resource -> resource.data
    */
    createChallenge(){

    }

    /*
    Remove a challenge after creation. only done by person who created challenge.
    algorithm: self -> intents -> resource -> resource.data
    */
    deleteChallenge(){

    }

    /*
    list challenges that either:
        * require input
        * request other's input
    algorithm: self -> intents -> resources -> resource.data
    */
    listChallenges(){

    }

    /*
    approve a challenge to increase challenge trust level and (hopefully/eventually) enable the resource to be claimed
    algorithm: self -> intents -> resources -> resource.data
    */
    approveChallenge(){

    }

    /*
    claim the rewards from a challenge:
    algorithm: self -> intents -> resource -> resource.data
    */
    claimChallenge(){

    }

}

export default ResourceShareSystem;