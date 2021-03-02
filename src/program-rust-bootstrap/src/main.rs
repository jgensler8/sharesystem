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


fn bootstrap_database(url: String, payer_keypair_file: String, contract_pubkey_file: String, database_keypair_out_file: String, space: usize) {
    // payer (read from file)
    let payer = read_keypair_file(&payer_keypair_file).unwrap();
    let payer_pubkey = payer.pubkey();
    println!("{:?}", payer_pubkey.to_string());
    // let _unuser = write_pubkey_file("/tmp/pubkey.out.json", payer_pubkey);

    // search engine (read from file)
    let contract_pubkey = read_pubkey_file(&contract_pubkey_file).unwrap();
    println!("{:?}", contract_pubkey.to_string());

    // database
    let database = Keypair::new();
    let database_pubkey = database.pubkey();
    println!("{:?}", database_pubkey.to_string());
    let _unused = write_keypair_file(&database, database_keypair_out_file);

    // TODO move this to a param
    let lamports: u64 = 64000;
    let database_account = Account::new(lamports, space, &contract_pubkey);
    let create_account_instruction = create_account(
        &payer_pubkey, 
        &database_pubkey,
        database_account.lamports,
        database_account.data.len().try_into().unwrap(),
        &contract_pubkey
    );
    let mut instructions = Vec::new();
    instructions.push(create_account_instruction);
    let mut transaction = Transaction::new_with_payer(&instructions, Some(&payer_pubkey));

    let rpc_client = RpcClient::new(url);
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

fn main() {
    let matches = App::new("bootstrap")
    .version("0.0.1")
    .author("Jeff")
    .arg(
        Arg::new("url")
            .about("url to connect to")
            .default_value("http://localhost:8899")
    )
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
        App::new("bootstrap-resource-database")
            .about("Create a database account for a resource to use")
    )
    .get_matches();

    let url = matches.value_of("url").unwrap();

    // payer
    let payer_keypair_file = matches.value_of("payer-keypair-file").unwrap();
    // search engine
    let searchengine_pubkey_file = matches.value_of("searchengine-pubkey-file").unwrap();
    let searchengine_databaes_keypair_file = matches.value_of("searchengine-database-keypair-file").unwrap();
    // resource
    let resource_pubkey_file = matches.value_of("resource-pubkey-file").unwrap();
    let resource_database_keypair_file = matches.value_of("resource-database-keypair-file").unwrap();

    match matches.subcommand_name() {
        Some("bootstrap-search-engine-database") => bootstrap_database(
            url.to_string(),
            payer_keypair_file.to_string(),
            searchengine_pubkey_file.to_string(),
            searchengine_databaes_keypair_file.to_string(),
            384),
        Some("bootstrap-resource-database") => bootstrap_database(
            url.to_string(),
            payer_keypair_file.to_string(),
            resource_pubkey_file.to_string(),
            resource_database_keypair_file.to_string(),
            456),
        None => println!("No subcommand was used"),
        _ => println!("Some other subcommand was used"),
    }
}