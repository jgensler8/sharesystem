use crate::types::{
    INSTRUCTION_DEFAULT,
    INSTRUCTION_RECORD_RESOURCE_INSTANCE,
    INSTRUCTION_INITIATE_DISTRIBUTION,
    INSTRUCTION_APPROVE_CHALLENGE,
    INSTRUCTION_CLAIM_CHALLENGE,
    ResourceInstance,
    Resource,
    Challenge,
};
use crate::error::ResourceError::InvalidInstruction;
use borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};
use std::mem::size_of;

#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum ResourceInstruction {
    Default(),
    RecordResourceInstance(ResourceInstance),
    InitiateDistribution(Resource),
    ApproveChallenge(Challenge),
    ClaimChallenge(Challenge)
}

impl ResourceInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            INSTRUCTION_DEFAULT => {
                Self::Default()
            }
            INSTRUCTION_RECORD_RESOURCE_INSTANCE => {
                match ResourceInstance::try_from_slice(_rest) {
                    Ok(account) => Self::RecordResourceInstance(account),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_INITIATE_DISTRIBUTION => {
                match Resource::try_from_slice(_rest) {
                    Ok(resource) => Self::InitiateDistribution(resource),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_APPROVE_CHALLENGE => {
                match Challenge::try_from_slice(_rest) {
                    Ok(challenge) => Self::ApproveChallenge(challenge),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_CLAIM_CHALLENGE => {
                match Challenge::try_from_slice(_rest) {
                    Ok(challenge) => Self::ClaimChallenge(challenge),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            _ => return Err(InvalidInstruction.into()),
        })
    }
}

pub fn unpack<T>(input: &[u8]) -> Result<&T, ProgramError> {
    if input.len() < size_of::<u8>() + size_of::<T>() {
        return Err(ProgramError::InvalidAccountData);
    }
    #[allow(clippy::cast_ptr_alignment)]
    let val: &T = unsafe { &*(&input[1] as *const u8 as *const T) };
    Ok(val)
}

#[cfg(test)]
mod test {
    use super::*;
    use borsh::BorshSerialize;
    use solana_program::{pubkey::Pubkey};
    use crate::types::{
        Location,
        MAX_FRIENDLY_NAME_SIZE,
        MAX_ZIP_SIZE,
    };

    #[test]
    fn test_empty_input() {
        let data = Vec::new();

        let result = ResourceInstruction::unpack(&data);
        let expected_error = Err(InvalidInstruction.into());
        assert_eq!(expected_error, result);
    }

    #[test]
    fn test_record_resource_instance() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_RECORD_RESOURCE_INSTANCE);
        let resource_instance = ResourceInstance {
            from:  Pubkey::new_unique().to_bytes(),
            quantity: 5,
        };
        data.append(&mut resource_instance.try_to_vec().unwrap());

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::RecordResourceInstance(resource_instance);
        assert_eq!(expected, result);
    }


    #[test]
    fn test_initiate_distribution() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_INITIATE_DISTRIBUTION);
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
        let resource = Resource {
            address: Pubkey::new_unique().to_bytes(),
            location: Location {
                zip,
            },
            name: name,
            trust_threshold: 4,
        };
        data.append(&mut resource.try_to_vec().unwrap());

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::InitiateDistribution(resource);
        assert_eq!(expected, result);
    }

    #[test]
    fn test_approve_challenge() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_APPROVE_CHALLENGE);
        let challenge = Challenge {
            from: Pubkey::new_unique().to_bytes(),
            to: Pubkey::new_unique().to_bytes(),
            value: false,
        };
        data.append(&mut challenge.try_to_vec().unwrap());

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::ApproveChallenge(challenge);
        assert_eq!(expected, result);
    }


    #[test]
    fn test_claim_challenge() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_CLAIM_CHALLENGE);
        let challenge = Challenge {
            from: Pubkey::new_unique().to_bytes(),
            to: Pubkey::new_unique().to_bytes(),
            value: false,
        };
        data.append(&mut challenge.try_to_vec().unwrap());

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::ClaimChallenge(challenge);
        assert_eq!(expected, result);
    }
}
