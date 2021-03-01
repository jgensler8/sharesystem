use crate::types::{
    INSTRUCTION_DEFAULT,
    INSTRUCTION_RECORD_INTENT,
    INSTRUCTION_RECORD_RESOURCE_INSTANCE,
    INSTRUCTION_INITIATE_DISTRIBUTION,
    INSTRUCTION_RECORD_CHALLENGE,
    INSTRUCTION_CLAIM_CHALLENGE,
    ResourceInstance,
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
    RecordIntent(),
    RecordResourceInstance(ResourceInstance),
    InitiateDistribution(),
    RecordChallenge(Challenge),
    ClaimChallenge(Challenge)
}

impl ResourceInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            INSTRUCTION_DEFAULT => {
                Self::Default()
            }
            INSTRUCTION_RECORD_INTENT => {
                Self::RecordIntent()
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
                Self::InitiateDistribution()
            }
            INSTRUCTION_RECORD_CHALLENGE => {
                match Challenge::try_from_slice(_rest) {
                    Ok(challenge) => Self::RecordChallenge(challenge),
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

    #[test]
    fn test_empty_input() {
        let data = Vec::new();

        let result = ResourceInstruction::unpack(&data);
        let expected_error = Err(InvalidInstruction.into());
        assert_eq!(expected_error, result);
    }

    #[test]
    fn test_record_intent() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_RECORD_INTENT);

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::RecordIntent();
        assert_eq!(expected, result);
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

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::InitiateDistribution();
        assert_eq!(expected, result);
    }

    #[test]
    fn test_approve_challenge() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_RECORD_CHALLENGE);
        let challenge = Challenge {
            from: Pubkey::new_unique().to_bytes(),
            to: Pubkey::new_unique().to_bytes(),
            value: false,
        };
        data.append(&mut challenge.try_to_vec().unwrap());

        let result = ResourceInstruction::unpack(&data).unwrap();
        let expected = ResourceInstruction::RecordChallenge(challenge);
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
