pub mod types;
pub mod error;
pub mod instruction;

use solana_program::{
    account_info::{AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    info,
    pubkey::Pubkey,
};
use crate::{instruction::ResourceInstruction};

fn _process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ResourceInstruction::unpack(instruction_data)?;
    match instruction {
        ResourceInstruction::Default() => {
            info!("OK")
        }
        ResourceInstruction::RecordResourceInstance(_account) => {
            info!("would record resource instance");
        }
        ResourceInstruction::InitiateDistribution(_resource) => {
            info!("would initiate distribution");
        }
        ResourceInstruction::ApproveChallenge(_challenge) => {
            info!("would approce challenge");
        }
        ResourceInstruction::ClaimChallenge(_challenge) => {
            info!("would claim challenge");
        }
    }
    Ok(())
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    info!("🚜resource🚜");

    if let Err(error) = _process_instruction(program_id, accounts, instruction_data) {
        // error.print::<ResourceError>();
        info!(&error.to_string());
        return Err(error);
    }
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;
    use solana_program::{
        clock::Epoch,
        program_error::ProgramError,
    };
    use crate::{error::ResourceError};

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
                ProgramError::from(ResourceError::InvalidInstruction),
                err
            ),
        };
    }
}
