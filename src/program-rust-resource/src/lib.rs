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
        ResourceNotInDistribution,
    },
    types::{
        PUBLIC_KEY_SIZE,
        MAX_NUM_RECIPIENTS,
        MAX_NUM_RESOURCE_INSTANCES,
        MAX_NUM_CHALLENGES,
        ResourceDatabase,
        ResourceInstance,
        Challenge,
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
        ResourceInstruction::RegisterIntent() => {
            info!("recording intent");
            let mut database_account_data = accounts[0].try_borrow_mut_data().unwrap();
            let mut resource_database = ResourceDatabase::try_from_slice(&database_account_data).unwrap();

            let empty_address = [0u8; PUBLIC_KEY_SIZE];
            if accounts.len() != 2 || empty_address == accounts[1].key.to_bytes() {
                return Err(ProgramError::InvalidInstructionData)
            }

            for key in resource_database.intents.iter_mut() {
                if *key == accounts[1].key.to_bytes() {
                    info!("intent already exists");
                    return Ok(())
                }
                if key == &empty_address {
                    key.copy_from_slice(&accounts[1].key.to_bytes());
                    database_account_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
                    return Ok(())
                }
            }
            return Err(ProgramError::InvalidInstructionData)
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
        ResourceInstruction::InitiateDistribution() => {
            info!("initiating distribution");
            let mut database_account_data = accounts[0].try_borrow_mut_data().unwrap();
            let mut resource_database =  ResourceDatabase::try_from_slice(&database_account_data).unwrap();

            // nothing to do, already in distribution
            if resource_database.is_distributed {
                return Err(ProgramError::from(ResourceInDistribution))
            }

            // flip state so that challenges can be accepted
            resource_database.is_distributed = true;

            // calculate distribution
            let mut quantity_sum = 0;
            let mut quantity_count = 0;
            let empty_address = [0u8; PUBLIC_KEY_SIZE];
            for instance in resource_database.instances.iter() {
                if instance.from == empty_address {
                    break;
                }
                quantity_sum += instance.quantity;
                quantity_count += 1;
            }
            let mut final_quantity = 0;
            if quantity_sum > 0 {
                final_quantity = quantity_sum / quantity_count;
            }
            resource_database.final_quantity = final_quantity;

            // initialize challenges
            let mut challenge_index = 0;
            for from_index in 0..resource_database.intents.len() {
                for to_index in 0..resource_database.intents.len() {
                    if from_index == to_index {
                        continue
                    }
                    resource_database.challenges[challenge_index] = Challenge{
                        from: resource_database.intents[from_index],
                        to: resource_database.intents[to_index],
                        value: false,
                    };
                    challenge_index += 1;
                }
            }

            // save data
            database_account_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
            return Ok(())
        }
        ResourceInstruction::RecordChallenge(challenge) => {
            info!("approving challenge");
            let mut database_account_data = accounts[0].try_borrow_mut_data().unwrap();
            let mut resource_database =  ResourceDatabase::try_from_slice(&database_account_data).unwrap();

            // nothing to do, already in distribution
            if !resource_database.is_distributed {
                return Err(ProgramError::from(ResourceNotInDistribution))
            }

            // TODO data validation
            let empty_address = [0u8; PUBLIC_KEY_SIZE];
            if challenge.from == empty_address || challenge.to == empty_address {
                return Err(ProgramError::InvalidInstructionData)
            }

            let mut found = false;
            for existing_challenge in resource_database.challenges.iter_mut() {
                if existing_challenge.from == challenge.from && existing_challenge.to == challenge.to {
                    *existing_challenge = challenge;
                    found = true;
                    break;
                }
                if existing_challenge.from == empty_address {
                    *existing_challenge = challenge;
                    found = true;
                    break
                }
            }
            // TODO (I think we can filter out errors based on allowed addresses in the intents)
            if !found {
                return Err(ProgramError::InvalidInstructionData)
            }

            // save data
            database_account_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
            return Ok(())
        }
        ResourceInstruction::ClaimChallenge(_challenge) => {
            info!("would claim challenge");
        }
        ResourceInstruction::ResetDatabase() => {
            let mut database_account_data = accounts[0].try_borrow_mut_data().unwrap();
            let resource_database = ResourceDatabase {
                is_distributed: false,
                final_quantity: 0,
                intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
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
            database_account_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
            return Ok(())
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
            INSTRUCTION_REGISTER_INTENT,
            INSTRUCTION_RECORD_RESOURCE_INSTANCE,
            INSTRUCTION_INITIATE_DISTRIBUTION,
            INSTRUCTION_RECORD_CHALLENGE,
            MAX_NUM_RESOURCE_INSTANCES,
            MAX_NUM_RECIPIENTS,
            MAX_NUM_CHALLENGES,
            RESOURCE_DATABASE_SIZE,
            ResourceInstance,
            Challenge,
        }
    };

    #[test]
    fn test_missing_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; RESOURCE_DATABASE_SIZE];
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
    fn test_record_intent() {
        let program_id = Pubkey::default();
        let key = Pubkey::new_unique();
        let owner = Pubkey::default();

        let mut database_data = vec![0u8; RESOURCE_DATABASE_SIZE];
        let resource_database = ResourceDatabase {
            is_distributed: false,
            final_quantity: 0,
            intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
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
        database_data.copy_from_slice(&resource_database.try_to_vec().unwrap());
        let mut database_lamports = 0;
        let database_account = AccountInfo::new(
            &key,
            false,
            true,
            &mut database_lamports,
            &mut database_data,
            &owner,
            false,
            Epoch::default(),
        );

        let mut recipient_data = vec![0u8; 0];
        let mut recipient_lamports = 0;
        let recipient_account = AccountInfo::new(
            &key,
            false,
            true,
            &mut recipient_lamports,
            &mut recipient_data,
            &owner,
            false,
            Epoch::default(),
        );
        let accounts = vec![database_account, recipient_account];

        let mut instruction_data: Vec<u8> = Vec::new();
        instruction_data.push(INSTRUCTION_REGISTER_INTENT);

        let result = process_instruction(&program_id, &accounts, &instruction_data);
        assert_eq!(result.unwrap(), ());
        let resource_database = ResourceDatabase::try_from_slice(&database_data).unwrap();
        assert_eq!(resource_database.intents[0], key.to_bytes());
    }

    #[test]
    fn test_record_resource_instance() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; RESOURCE_DATABASE_SIZE];

        let resource_database = ResourceDatabase {
            is_distributed: false,
            final_quantity: 0,
            intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
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

    #[test]
    fn test_initiate_resource_distribution() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; RESOURCE_DATABASE_SIZE];

        let resource_database = ResourceDatabase {
            is_distributed: false,
            final_quantity: 0,
            intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
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

        // add a resource ...
        let mut record_resource_instance_instruction_data: Vec<u8> = Vec::new();
        record_resource_instance_instruction_data.push(INSTRUCTION_RECORD_RESOURCE_INSTANCE);
        let resource_instance = ResourceInstance {
            from:  Pubkey::new_unique().to_bytes(),
            quantity: 5,
        };
        record_resource_instance_instruction_data.append(&mut resource_instance.try_to_vec().unwrap());
        let _result = process_instruction(&program_id, &accounts, &record_resource_instance_instruction_data);

        // ... then initiate distribution
        let mut instruction_data: Vec<u8> = Vec::new();
        instruction_data.push(INSTRUCTION_INITIATE_DISTRIBUTION);

        let result = process_instruction(&program_id, &accounts, &instruction_data);
        assert_eq!(result.unwrap(), ());
        let resource_database = ResourceDatabase::try_from_slice(&data).unwrap();
        assert_eq!(resource_database.is_distributed, true);
        assert_eq!(resource_database.final_quantity, resource_instance.quantity);
    }

    #[test]
    fn test_approve_challenge() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0u8; RESOURCE_DATABASE_SIZE];

        let resource_database = ResourceDatabase {
            // set to true so we don't need a bunch of other setup
            is_distributed: true,
            final_quantity: 0,
            intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_RECIPIENTS],
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
        instruction_data.push(INSTRUCTION_RECORD_CHALLENGE);
        let challenge = Challenge {
            from: Pubkey::new_unique().to_bytes(),
            to: Pubkey::new_unique().to_bytes(),
            value: true,
        };
        instruction_data.append(&mut challenge.try_to_vec().unwrap());
        let result = process_instruction(&program_id, &accounts, &instruction_data);
        assert_eq!(result.unwrap(), ());
        let resource_database = ResourceDatabase::try_from_slice(&data).unwrap();
        assert_eq!(resource_database.challenges[0].from, challenge.from);
        assert_eq!(resource_database.challenges[0].to, challenge.to);
        assert_eq!(resource_database.challenges[0].value, true);
    }
}
