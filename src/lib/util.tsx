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
    Version,
    clusterApiUrl,
    Cluster,
} from '@solana/web3.js';

import dotenv from 'dotenv';
import path from 'path';
import fs from 'mz/fs';
import mkdirp from 'mkdirp';
// TODO(jeffg) would be nice to make this conditional, maybe need some JSON file with all variables
import deployment from './deploy.out.json';

/**
 * environment-specific function to choose Solana cluster
 */
function chooseCluster(): Cluster | undefined {
    dotenv.config();
    if (!process.env.LIVE) return;
    switch (process.env.CLUSTER) {
        case 'devnet':
        case 'testnet':
        case 'mainnet-beta': {
            return process.env.CLUSTER;
        }
    }
    if (process.env.CLUSTER) {
        throw `Unknown cluster "${process.env.CLUSTER}", check the .env file`;
    } else {
        throw new Error('CLUSTER is not specified, check the .env file');
    }
}

export const cluster = chooseCluster();

export const url =
    process.env.RPC_URL ||
    (process.env.LIVE ? clusterApiUrl(cluster, false) : 'http://localhost:8899');

// export const urlTls =
//     process.env.RPC_URL ||
//     (process.env.LIVE ? clusterApiUrl(cluster, true) : 'http://localhost:8899');

// export const walletUrl =
//     process.env.WALLET_URL || 'https://solana-example-webwallet.herokuapp.com/';

export async function establishConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
        let conn = new Connection(url, 'singleGossip');
        conn.getVersion()
            .then((value: Version) => resolve(conn))
            .catch(reject);
    });
}

/**
 * 
 * Storage Library for local development
 * 
 */
export type Config = {
  // private key encoded?
  bootstrapAccount?: Array<number>,
  // public key encoded?
  programId?: string,
};

export class Store {
  static getDir(): string {
    return path.join(__dirname, 'store');
  }

  async load(uri: string): Promise<Config> {
    const filename = path.join(Store.getDir(), uri);
    const data = await fs.readFile(filename, 'utf8');
    return JSON.parse(data) as Config;
  }

  async save(uri: string, config: Config): Promise<void> {
    await mkdirp(Store.getDir());
    const filename = path.join(Store.getDir(), uri);
    await fs.writeFile(filename, JSON.stringify(config), 'utf8');
  }
}


/**
 * 
 * await-able function similar to time.sleep()
 * 
 * @param ms 
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 * create account boostrapped by airdrop
 * 
 * @param connection 
 * @param lamports 
 */
export async function newAccountWithLamports(
  connection: Connection,
  lamports = 1000000,
): Promise<Account> {
  const account = new Account();

  let retries = 10;
  await connection.requestAirdrop(account.publicKey, lamports);
  for (;;) {
    await sleep(500);
    if (lamports == (await connection.getBalance(account.publicKey))) {
      return account;
    }
    if (--retries <= 0) {
      break;
    }
    console.log(`Airdrop retry ${retries}`);
  }
  throw new Error(`Airdrop of ${lamports} failed`);
}


/**
 * 
 * load the program on chain
 * 
 * @param connection
 * @param payerAccount loading the program costs $, payer's responsibility
 * @param pathToProgram compiled Rust executable
 */
export async function loadProgram(connection: Connection, payerAccount: Account, pathToProgram: string): Promise<PublicKey> {  
    // Load the program
    console.log('Reading program...');
    const data = await fs.readFile(pathToProgram);
    const programAccount = new Account();
    console.log('Loading program...');
    await BpfLoader.load(
      connection,
      payerAccount,
      programAccount,
      data,
      BPF_LOADER_PROGRAM_ID,
    );
    return programAccount.publicKey;
}


/**
 * Program address will have different values for local development and production
 * Example: 2X2sFvM3G8GGzDq2whqTbxFPGyv7U4PRomL8G8LJm3Y6
 */
export async function loadProgramAddressFromEnvironment(): Promise<string> {
  // TODO(jeffg): support production environment
  return deployment.programId;
}