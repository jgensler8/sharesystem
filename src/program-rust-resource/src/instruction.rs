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
                    Ok(resource) => Self::ApproveChallenge(resource),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_CLAIM_CHALLENGE => {
                match Challenge::try_from_slice(_rest) {
                    Ok(resource) => Self::ClaimChallenge(resource),
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

    #[test]
    fn test_empty_input() {
        let data = Vec::new();

        let result = ResourceInstruction::unpack(&data);
        let expected_error = Err(InvalidInstruction.into());
        assert_eq!(expected_error, result);
    }
}
