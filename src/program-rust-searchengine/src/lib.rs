pub mod types;
pub mod error;
pub mod instruction;

use crate::types::{Resource, ResourceIndex, MAX_ZIP_SIZE, PUBLIC_KEY_SIZE};
use crate::instruction::{SearchEngineInstruction};
use crate::error::SearchEngineError::{DatabaseFull, BucketFull};
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, info, pubkey::Pubkey,
    program_error::ProgramError,
};
use borsh::{BorshSerialize, BorshDeserialize};

/*
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
* get_trust_table(accounts:[owner], data:None)
  auth: none
* register_intent(accounts:[owner, program], data:None)
  auth: searchengine_id == accounts[0].owner and accounts[0].is_signer == true
* list_intents(accounts[search], data:None)
  auth: none
*/

fn _process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = SearchEngineInstruction::unpack(instruction_data)?;
    match instruction {
        SearchEngineInstruction::Default() => {
            info!("OK")
        }
        SearchEngineInstruction::UpdateAccount(account) => {
            info!("trying to update account");
            // TODO check accounts length 1 and first account is signer
            accounts[0].key.log();
            let mut account_data = accounts[0].try_borrow_mut_data().unwrap();
            let account = account.try_to_vec().unwrap();
            info!(&account.len().to_string());
            info!("copying data account");
            account_data[..account.len()].copy_from_slice(&account);
        }
        SearchEngineInstruction::RegisterResource(Resource {
            address,
            name: _ ,
            location,
            trust_threshold: _,
        }) => {
            info!("trying to register resource");
            // TODO check accounts length and first account is owned by this program id
            let mut database = accounts[0].try_borrow_mut_data().unwrap();
            let mut index = ResourceIndex::try_from_slice(&database).unwrap();
            let empty_zip = [0u8; MAX_ZIP_SIZE];
            let empty_address = [0u8; PUBLIC_KEY_SIZE];
            for bucket in index.buckets.iter_mut() {
                if bucket.location.zip == empty_zip {
                    bucket.location = location;
                    bucket.addresses[0].copy_from_slice(&address);
                    // save data
                    database.copy_from_slice(&index.try_to_vec().unwrap());
                    return Ok(())
                }
                if bucket.location.zip == location.zip {
                    for bucekt_address in bucket.addresses.iter_mut() {
                        if *bucekt_address == empty_address {
                            bucekt_address.copy_from_slice(&address);
                            // save data
                            database.copy_from_slice(&index.try_to_vec().unwrap());
                            return Ok(())
                        }
                    }
                    return Err(ProgramError::from(BucketFull))
                }
            }
            return Err(ProgramError::from(DatabaseFull))
        }
        SearchEngineInstruction::RegisterIntent(Resource {
            address: _,
            name: _,
            location: _,
            trust_threshold: _,
        }) => {
            info!("would register intent");
        }
    }
    Ok(())
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    info!("🌐🔎searchengine🔍🌐");

    if let Err(error) = _process_instruction(program_id, accounts, instruction_data) {
        // error.print::<SearchEngineError>();
        info!(&error.to_string());
        return Err(error);
    }
    Ok(())
}

// Test when instruction data is missing vs have at least one integer (which should map to an Instruction)
#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        error::SearchEngineError,
        types::{
            PUBLIC_KEY_SIZE,
            MAX_TRUST_TABLE_SIZE,
            MAX_FRIENDLY_NAME_SIZE,
            MAX_ZIP_SIZE,
            MAX_NUM_RESOURCE_IN_BUCKET,
            INSTRUCTION_UPDATE_ACCOUNT,
            INSTRUCTION_REGISTER_RESOURCE,
            INSTRUCTION_REGISTER_INTENT,
            TrustTableEntry,
            SearchEngineAccount,
            Location,
            ResourceBucket,
        },
    };
    use solana_program::clock::Epoch;
    use solana_program::program_error::ProgramError;
    use borsh::{BorshSerialize, BorshDeserialize};
    use std::str::FromStr;

    #[test]
    fn test_missing_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 368];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let accounts = vec![account];

        let instruction_data: Vec<u8> = Vec::new();
        let result = process_instruction(&program_id, &accounts, &instruction_data);
        let _result = match result {
            Ok(_ok) => assert_eq!(true, false, "process_instruction should have triggered error"),
            Err(err) => assert_eq!(
                ProgramError::from(SearchEngineError::InvalidInstruction),
                err
            ),
        };
    }

    #[test]
    fn test_update_account() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 65];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let accounts = vec![account];

        let mut instruction_data: Vec<u8> = Vec::new();
        instruction_data.push(INSTRUCTION_UPDATE_ACCOUNT);
        let to_pubkey = Pubkey::from_str("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE").unwrap();
        let name_str = String::from("jeff");
        let mut name = [0u8; MAX_FRIENDLY_NAME_SIZE];
        for (place, data) in name.iter_mut().zip(name_str.as_bytes().iter()) {
            *place = *data
        }
        let search_engine_account = SearchEngineAccount {
            friendly_name: name,
            trust_table: [
                TrustTableEntry {
                    to: to_pubkey.to_bytes(),
                    value: 10,
                }; MAX_TRUST_TABLE_SIZE
            ],
        };
        instruction_data.append(&mut search_engine_account.try_to_vec().unwrap());

        println!("{:?}", instruction_data);
        let result = process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!((), result);
        assert_eq!(accounts[0].data.borrow().len(), search_engine_account.try_to_vec().unwrap().len());
    }

    #[test]
    fn test_register_resource() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        // provision database
        let mut database_data = vec![0u8; 384];
        let index = ResourceIndex{
            buckets: [ResourceBucket{
                addresses: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RESOURCE_IN_BUCKET],
                location: Location{
                    zip: [0u8; MAX_ZIP_SIZE],
                },
            }; MAX_NUM_RESOURCE_IN_BUCKET],
        };
        database_data.copy_from_slice(&index.try_to_vec().unwrap());   

        let owner = Pubkey::default();
        let database_account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut database_data,
            &owner,
            false,
            Epoch::default(),
        );
        let accounts = vec![database_account];

        let mut instruction_data: Vec<u8> = Vec::new();
        instruction_data.push(INSTRUCTION_REGISTER_RESOURCE);
        let to_pubkey = Pubkey::from_str("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE").unwrap();
        let name_str = String::from("jeff");
        let mut name = [0u8; MAX_FRIENDLY_NAME_SIZE];
        for (place, data) in name.iter_mut().zip(name_str.as_bytes().iter()) {
            *place = *data
        }
        let zip_str = String::from("12345");
        let mut zip = [0u8; MAX_ZIP_SIZE];
        for (place, data) in zip.iter_mut().zip(zip_str.as_bytes().iter()) {
            *place = *data
        }
        let location = Location{
            zip: zip,
        };
        let resource = Resource{
            address: to_pubkey.to_bytes(),
            name: name,
            location: location,
            trust_threshold: 10,
        };
        instruction_data.append(&mut resource.try_to_vec().unwrap());

        let result = process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!((), result);

        let database = ResourceIndex::try_from_slice(&database_data).unwrap();
        println!("{:?}", database);
        assert_eq!(database.buckets[0].location.zip, zip);
        assert_eq!(database.buckets[0].addresses[0], to_pubkey.to_bytes());
        assert_eq!(database.buckets[0].addresses[1], [0u8; PUBLIC_KEY_SIZE]);

        // write to the second location (not working because of move)
        // let _result2 = process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        // assert_eq!(database.buckets[0].addresses[1], to_pubkey.to_bytes());
    }


    #[test]
    fn test_register_intent() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 1024];
        let owner = Pubkey::default();
        let database_account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let accounts = vec![database_account];

        let mut instruction_data: Vec<u8> = Vec::new();
        let to_pubkey = Pubkey::from_str("FFAAFFAAFFAABBCCAABBCCDDEEFFaabbccAABBCCDDEE").unwrap();
        instruction_data.push(INSTRUCTION_REGISTER_INTENT);
        let name_str = String::from("jeff");
        let mut name = [0u8; MAX_FRIENDLY_NAME_SIZE];
        for (place, data) in name.iter_mut().zip(name_str.as_bytes().iter()) {
            *place = *data
        }
        let zip_str = String::from("12345");
        let mut zip = [0u8; MAX_ZIP_SIZE];
        for (place, data) in zip.iter_mut().zip(zip_str.as_bytes().iter()) {
            *place = *data
        }
        let resource = Resource{
            address: to_pubkey.to_bytes(),
            name: name,
            location: Location{
                zip: zip,
            },
            trust_threshold: 10,
        };
        instruction_data.append(&mut resource.try_to_vec().unwrap());

        let result = process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!((), result);
    }
}
