use crate::types::{
    INSTRUCTION_DEFAULT,
    INSTRUCTION_UPDATE_ACCOUNT,
    INSTRUCTION_REGISTER_RESOURCE,
    INSTRUCTION_REGISTER_INTENT,
    SearchEngineAccount,
    Resource,
};
use crate::error::SearchEngineError::InvalidInstruction;
use borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};
use std::mem::size_of;

#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum SearchEngineInstruction {
    Default(),
    UpdateAccount(SearchEngineAccount),
    RegisterResource(Resource),
    RegisterIntent(),
}

impl SearchEngineInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            INSTRUCTION_DEFAULT => {
                Self::Default()
            }
            INSTRUCTION_UPDATE_ACCOUNT => {
                match SearchEngineAccount::try_from_slice(_rest) {
                    Ok(account) => Self::UpdateAccount(account),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_REGISTER_RESOURCE => {
                match Resource::try_from_slice(_rest) {
                    Ok(resource) => Self::RegisterResource(resource),
                    Err(_err) => {
                        return Err(ProgramError::InvalidInstructionData)
                    }
                }
            }
            INSTRUCTION_REGISTER_INTENT => {
                Self::RegisterIntent()
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
    use solana_program::pubkey::Pubkey;
    use borsh::BorshSerialize;
    use crate::types::{
        TrustTableEntry,
        Location,
        MAX_TRUST_TABLE_SIZE,
        MAX_FRIENDLY_NAME_SIZE,
        MAX_ZIP_SIZE,
        PUBLIC_KEY_SIZE,
        MAX_NUM_INTENTS,
    };

    #[test]
    fn test_empty_input() {
        let data = Vec::new();

        let result = SearchEngineInstruction::unpack(&data);
        let expected_error = Err(InvalidInstruction.into());
        assert_eq!(expected_error, result);
    }

    #[test]
    fn test_pack_trusttableentry() {
        // pack
        let trust_table_entry = TrustTableEntry {
            to: Pubkey::new_unique().to_bytes(),
            value: 10,
        };
        let packed = trust_table_entry.try_to_vec().unwrap();
        // unpack
        let decoded = TrustTableEntry::try_from_slice(&packed).unwrap();
        assert_eq!(trust_table_entry, decoded);
    }

    #[test]
    fn test_upack_update_account() {
        let mut data = Vec::<u8>::new();
        data.push(INSTRUCTION_UPDATE_ACCOUNT);
        let name_str = String::from("jeff");
        let mut name = [0u8; MAX_FRIENDLY_NAME_SIZE];
        for (place, data) in name.iter_mut().zip(name_str.as_bytes().iter()) {
            *place = *data
        }
        let search_engine_account = SearchEngineAccount {
            friendly_name: name,
            trust_table: [TrustTableEntry {
                to: Pubkey::new_unique().to_bytes(),
                value: 10,
            }; MAX_TRUST_TABLE_SIZE],
            intents: [[0u8; PUBLIC_KEY_SIZE]; MAX_NUM_INTENTS],
        };
        data.append(&mut search_engine_account.try_to_vec().unwrap());

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::UpdateAccount(search_engine_account);
        assert_eq!(expected, result);
    }

    #[test]
    fn test_unpack_register_resource() {
        let mut data = Vec::new();
        data.push(INSTRUCTION_REGISTER_RESOURCE);
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
                zip: zip,
            },
            name: name,
            trust_threshold: 10,
        };
        data.append(&mut resource.try_to_vec().unwrap());

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterResource(resource);
        assert_eq!(expected, result);
    }

    #[test]
    fn test_unpack_register_intent() {
        let mut data = Vec::new();
        data.push(INSTRUCTION_REGISTER_INTENT);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterIntent();
        assert_eq!(expected, result);
    }
}
