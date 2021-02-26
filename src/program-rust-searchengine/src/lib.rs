pub mod constants;
pub mod error;
pub mod instruction;

use crate::instruction::{SearchEngineAccount, Resource, SearchEngineInstruction};
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, info, pubkey::Pubkey,
};
use borsh::BorshSerialize;

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
            let account = account.try_to_vec().unwrap();
            let mut account_data = accounts[0].data.borrow_mut();
            account_data.copy_from_slice(&account);
            // account_data.copy_within(&account, account.len());
        }
        SearchEngineInstruction::RegisterResource(Resource {
            address: _,
            name: _ ,
            location: _,
            trust_threshold: _,
        }) => {
            info!("would list resource");
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
        instruction::{TrustTable, TrustTableEntry},
        constants::{MAX_TRUST_TABLE_SIZE, INSTRUCTION_UPDATE_ACCOUNT},
    };
    use byteorder::{ByteOrder, LittleEndian};
    use solana_program::clock::Epoch;
    use solana_program::program_error::ProgramError;
    use std::mem;
    use borsh::{BorshSerialize};
    use std::str::FromStr;

    #[test]
    fn test_missing_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 368];
        LittleEndian::write_u64(&mut data, 0);
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
    fn test_one_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 368];
        LittleEndian::write_u64(&mut data, 0);
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
        let mut name = [0u8; 12];
        for (place, data) in name.iter_mut().zip(name_str.as_bytes().iter()) {
            *place = *data
        }
        let search_engine_account = SearchEngineAccount {
            friendly_name: name,
            trust_table: TrustTable {
                entries: [TrustTableEntry {
                    to: to_pubkey.to_bytes(),
                    value: 10,
                }; MAX_TRUST_TABLE_SIZE],
            },
        };
        instruction_data.append(&mut search_engine_account.try_to_vec().unwrap());

        println!("{:?}", instruction_data);
        assert_eq!(instruction_data.len(), 46);
        assert_eq!(true, false);

        let result = process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!((), result);
        assert_eq!(accounts[0].data.borrow().len(), search_engine_account.try_to_vec().unwrap().len());
    }
}
