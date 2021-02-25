use crate::constants::{
    MAX_TRUST_TABLE_SIZE,
    INSTRUCTION_DEFAULT,
    INSTRUCTION_UPDATE_ACCOUNT,
    INSTRUCTION_REGISTER_RESOURCE,
    INSTRUCTION_REGISTER_INTENT,
};
use crate::error::SearchEngineError::InvalidInstruction;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{program_error::ProgramError};
use std::mem::size_of;

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

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, PartialEq, Debug, Default)]
pub struct TrustTableEntry {
    pub to: [u8; 32],
    pub value: f32,
}

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct TrustTable {
    pub entries: [TrustTableEntry; MAX_TRUST_TABLE_SIZE],
}

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct SearchEngineAccount {
    pub friendly_name: String,
    pub trust_table: TrustTable,
}

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct Location {
    pub zip: String,
}

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct Resource {
    pub address: [u8; 32],
    pub name: String,
    pub location: Location,
    pub trust_threshold: f32,
}

#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum SearchEngineInstruction {
    Default(),
    UpdateAccount(SearchEngineAccount),
    RegisterResource(Resource),
    RegisterIntent(Resource),
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
                match Resource::try_from_slice(_rest) {
                    Ok(resource) => Self::RegisterIntent(resource),
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
    use solana_program::pubkey::Pubkey;
    use borsh::BorshSerialize;

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
            value: 0.1,
        };
        let packed = trust_table_entry.try_to_vec().unwrap();
        // unpack
        let decoded = TrustTableEntry::try_from_slice(&packed).unwrap();
        assert_eq!(trust_table_entry, decoded);
    }

    #[test]
    fn test_pack_trusttable() {
        // pack
        let entries = [TrustTableEntry {
            to: Pubkey::new_unique().to_bytes(),
            value: 0.1,
        }; MAX_TRUST_TABLE_SIZE];
        let trust_table = TrustTable { entries: entries };
        let packed = trust_table.try_to_vec().unwrap();
        // unpack
        let decoded = TrustTable::try_from_slice(&packed).unwrap();
        assert_eq!(trust_table, decoded);
    }

    #[test]
    fn test_upack_update_account() {
        let mut data = Vec::<u8>::new();
        data.push(1);
        let search_engine_account = SearchEngineAccount {
            friendly_name: String::from("jeff"),
            trust_table: TrustTable {
                entries: [TrustTableEntry {
                    to: Pubkey::new_unique().to_bytes(),
                    value: 1.1,
                }; MAX_TRUST_TABLE_SIZE],
            },
        };
        data.append(&mut search_engine_account.try_to_vec().unwrap());

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::UpdateAccount(search_engine_account);
        assert_eq!(expected, result);
    }

    #[test]
    fn test_unpack_register_resource() {
        let mut data = Vec::new();
        data.push(2);
        let resource = Resource {
            address: Pubkey::new_unique().to_bytes(),
            location: Location {
                zip: String::from("12345"),
            },
            name: String::from("test"),
            trust_threshold: 0.0,
        };
        data.append(&mut resource.try_to_vec().unwrap());

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterResource(resource);
        assert_eq!(expected, result);
    }

    #[test]
    fn test_unpack_register_intent() {
        let mut data = Vec::new();
        data.push(3);
        let resource = Resource {
            address: Pubkey::new_unique().to_bytes(),
            location: Location {
                zip: String::from("12345"),
            },
            name: String::from("test"),
            trust_threshold: 0.0,
        };
        data.append(&mut resource.try_to_vec().unwrap());

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterIntent(resource);
        assert_eq!(expected, result);
    }
}
