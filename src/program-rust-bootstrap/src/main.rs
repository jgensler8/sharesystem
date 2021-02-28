use solana_sdk::{
    system_instruction::create_account,
    account::Account,
    transaction::Transaction,
    commitment_config::{CommitmentConfig,CommitmentLevel},
    signature::{Keypair, Signer, read_keypair_file, write_keypair_file},
    pubkey::{read_pubkey_file},
};
use solana_client::{
    rpc_client::RpcClient,
    rpc_config::RpcSendTransactionConfig,
};
use std::convert::TryInto;

fn main() {
    // payer (read from file)
    let payer = read_keypair_file("./src/lib/keygen.out.json").unwrap();
    let payer_pubkey = payer.pubkey();
    println!("{:?}", payer_pubkey.to_string());
    // let _unuser = write_pubkey_file("/tmp/pubkey.out.json", payer_pubkey);

    // search engine (read from file)
    let search_engine_pubkey = read_pubkey_file("./src/lib/searchengine_deploy_raw.out.json").unwrap();
    println!("{:?}", search_engine_pubkey.to_string());

    // database
    let database = Keypair::new();
    let database_pubkey = database.pubkey();
    println!("{:?}", database_pubkey.to_string());
    let _unused = write_keypair_file(&database, "./src/lib/searchengine_database_keygen.out.json");

    let lamports: u64 = 64000;
    let space: usize = 384;
    let database_account = Account::new(lamports, space, &search_engine_pubkey);
    let create_account_instruction = create_account(
        &payer_pubkey, 
        &database_pubkey,
        database_account.lamports,
        database_account.data.len().try_into().unwrap(),
        &search_engine_pubkey
    );
    let mut instructions = Vec::new();
    instructions.push(create_account_instruction);
    let mut transaction = Transaction::new_with_payer(&instructions, Some(&payer_pubkey));

    let rpc_client = RpcClient::new("http://localhost:8899".to_string());
    let (blockhash, _) = rpc_client.get_recent_blockhash().unwrap();
    let signers: Vec<&dyn Signer> = vec!(&payer, &database);
    transaction.sign(&signers, blockhash);
    println!("{:?}", transaction);

    let commitment_config = CommitmentConfig{
        commitment: CommitmentLevel::Confirmed,
    };

    let _result = rpc_client
    .send_and_confirm_transaction_with_spinner_and_config(
        &transaction,
        commitment_config,
        RpcSendTransactionConfig {
            skip_preflight: true,
            preflight_commitment: Some(commitment_config.commitment),
            ..RpcSendTransactionConfig::default()
        },
    );
}