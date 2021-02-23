pub mod constants;
pub mod error;
pub mod instruction;

use crate::instruction::{Empty, Location, SearchEngineInstruction};
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, info, pubkey::Pubkey,
};

fn _process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = SearchEngineInstruction::unpack(instruction_data)?;
    match instruction {
        SearchEngineInstruction::RegisterResource(Empty {}) => {
            info!("would register resource");
        }
        SearchEngineInstruction::ListResource(Location { zip }) => {
            info!("would list resource");
            info!(&zip);
        }
        _ => {
            info!("some other command");
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
    use crate::error::SearchEngineError;
    use byteorder::{ByteOrder, LittleEndian};
    use solana_program::clock::Epoch;
    use solana_program::program_error::ProgramError;
    use std::mem;

    #[test]
    fn test_missing_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u64>()];
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
            Ok(_ok) => assert_eq!(true, false),
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
        let mut data = vec![0; mem::size_of::<u64>()];
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
        instruction_data.push(0);
        let result = process_instruction(&program_id, &accounts, &instruction_data);
        let _result = match result {
            Ok(ok) => assert_eq!((), ok),
            Err(_err) => assert_eq!(true, false),
        };
    }
}
