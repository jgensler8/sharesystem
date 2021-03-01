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
use clap::{App, Arg};


fn bootstrap_search_engine_database() {
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

fn bootstrap_resource_database() {

}

fn main() {
    let matches = App::new("bootstrap")
    .version("0.0.1")
    .author("Jeff")
    // payer
    .arg(
        Arg::new("payer-keypair-file")
            .about("the file to read/save the private key to")
            .default_value("./src/lib/keygen.out.json")
    )
    // search engine
    .arg(
        Arg::new("searchengine-pubkey-file")
            .about("the file to read the public key from")
            .default_value("./src/lib/searchengine_deploy_raw.out.json")
    )
    .arg(
        Arg::new("searchengine-database-keypair-file")
            .about("the file to read/save the private key to")
            .default_value("./src/lib/searchengine_database_keygen.out.json")
    )
    // resource
    .arg(
        Arg::new("resource-pubkey-file")
            .about("the file to read the public key from")
            .default_value("./src/lib/resource_deploy_raw.out.json")
    )
    .arg(
        Arg::new("resource-database-keypair-file")
            .about("the file to read/save the private key to")
            .default_value("./src/lib/resource_database_keygen.out.json")
    )
    // commands
    .subcommand(
        App::new("bootstrap-search-engine-database")
            .about("Create a database account for a search engine to use")
    )
    .subcommand(
        App::new("boostrap-resource-database")
            .about("Create a database account for a resource to use")
    )
    .get_matches();

    match matches.subcommand_name() {
        Some("bootstrap-search-engine-database") => bootstrap_search_engine_database(),
        Some("boostrap-resource-database") => bootstrap_resource_database(),
        None => println!("No subcommand was used"),
        _ => println!("Some other subcommand was used"),
    }
}