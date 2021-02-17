
import { Account, PublicKey } from '@solana/web3.js';
import {
  establishConnection,
  newAccountWithLamports,
  loadProgram,
  Store,
  Config,
} from './util';

let config: Config = {};
let bootstrapAccount: Account;
let programId: PublicKey;

async function main() {
  console.log("ShareSystem");

  // Establish connection to the cluster
  let connection = await establishConnection();

  const store = new Store();
  // Check if the program has already been loaded
  try {
    config = await store.load('config.json');
    if (config.bootstrapAccount) {
      bootstrapAccount = new Account(config.bootstrapAccount);
      console.log(`loaded bootstrap account with public key: ${bootstrapAccount.publicKey.toBase58()}`)
    }
    if (config.programId) {
      programId = new PublicKey(config.programId);
    }
  } catch (err) {
    console.log("failed to load config file")
    console.log(err)
  }

  // Determine who pays for the fees
  if (!bootstrapAccount) {
    console.log("bootstrapping new account...")
    bootstrapAccount = await newAccountWithLamports(connection);
    console.log(`created bootstrap account with public key: ${bootstrapAccount.publicKey.toBase58()}`)
    // Convert type from Uint8Array(64) to number
    config.bootstrapAccount = Array.from(bootstrapAccount.secretKey);
    await store.save('config.json', config)
  } else {
    console.log("account already bootstrapped. skippping...")
  }

  // Load the program if not already loaded
  if (!programId) {
    programId = await loadProgram(connection, bootstrapAccount, "dist/program/solana_bpf_sharesystem.so");
    config.programId = programId.toString();
    await store.save('config.json', config)
  }
  console.log('Success');
  console.log(`bootstrap account public key: ${bootstrapAccount.publicKey}`);
  console.log(`program public key:           ${programId}`)
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
