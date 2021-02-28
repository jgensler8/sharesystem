pub mod types;
pub mod error;
pub mod instruction;

use solana_program::{
    account_info::{AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    info,
    pubkey::Pubkey,
    program_error::ProgramError,
};
use borsh::{BorshSerialize, BorshDeserialize};
use crate::{
    instruction::ResourceInstruction,
    error::ResourceError::{
        NoResourceInstanceSpace,
        ResourceInDistribution,
    },
    types::{
        PUBLIC_KEY_SIZE,
        ResourceDatabase,
    },
};

fn _process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ResourceInstruction::unpack(instruction_data)?;
    match instruction {
        ResourceInstruction::Default() => {
            info!("OK")
        }
        ResourceInstruction::RecordResourceInstance(resource_instance) => {
            info!("recording resource instance");
            let mut database_account_data = accounts[0].try_borrow_mut_data().unwrap();
            let mut resource_database =  ResourceDatabase::try_from_slice(&database_account_data).unwrap();

            if resource_database.is_distributed {
                return Err(ProgramError::from(ResourceInDistribution))
            }

            let empty_address = [0u8; PUBLIC_KEY_SIZE];
            for instance in resource_database.instances.iter_mut() {
                if instance.from == empty_address {
                    *instance = resource_instance;
                    database_account_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
                    return Ok(())
                }
            }
            return Err(ProgramError::from(NoResourceInstanceSpace));
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
    use crate::{
        error::ResourceError,
        types::{
            INSTRUCTION_RECORD_RESOURCE_INSTANCE,
            MAX_NUM_RESOURCE_INSTANCES,
            MAX_NUM_RECIPIENTS,
            MAX_NUM_CHALLENGES,
            ResourceInstance,
            Challenge,
        }
    };

    #[test]
    fn test_missing_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 1302];
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

    #[test]
    fn test_record_resource_instance() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; 1302];

        let resource_database = ResourceDatabase {
            is_distributed: false,
            final_quantity: 0,
            instances: [ResourceInstance{
                from: [0u8; PUBLIC_KEY_SIZE],
                quantity: 0,
            }; MAX_NUM_RESOURCE_INSTANCES],
            challenges: [Challenge{
                from: [0u8; PUBLIC_KEY_SIZE],
                to: [0u8; PUBLIC_KEY_SIZE],
                value: false,
            }; MAX_NUM_CHALLENGES],
            claims: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
        };
        data.copy_from_slice(&resource_database.try_to_vec().unwrap());

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
        instruction_data.push(INSTRUCTION_RECORD_RESOURCE_INSTANCE);
        let resource_instance = ResourceInstance {
            from:  Pubkey::new_unique().to_bytes(),
            quantity: 5,
        };
        instruction_data.append(&mut resource_instance.try_to_vec().unwrap());

        let result = process_instruction(&program_id, &accounts, &instruction_data);
        assert_eq!(result.unwrap(), ());
        let resource_database = ResourceDatabase::try_from_slice(&data).unwrap();
        assert_eq!(resource_database.instances[0].from, resource_instance.from);
    }
}
