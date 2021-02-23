use crate::constants::TRUST_TABLE_SIZE;
use crate::error::SearchEngineError::InvalidInstruction;
use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
};
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
#[derive(Copy, Clone, Debug, PartialEq)]
pub struct TrustTableEntry {
    pub to: Pubkey,
    pub value: f32,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct TrustTable {
    pub entries: Vec<TrustTableEntry>,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct SearchEngineAccount {
    pub friendly_name: String,
    pub trust_table: TrustTable,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct Location {
    pub zip: String,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct Resource {
    pub address: Pubkey,
    pub name: String,
    pub location: Location,
    pub trust_threshold: f32,
}

#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum SearchEngineInstruction {
    UpdateAccount(SearchEngineAccount),
    RegisterResource(Resource),
    RegisterIntent(Resource),
}

impl SearchEngineInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => {
                let friendly_name = String::from("jeff");
                let entries = [TrustTableEntry{
                    to: Pubkey::new_unique(),
                    value: 0.0,
                }; TRUST_TABLE_SIZE];
                let trust_table = TrustTable{
                    entries: entries.to_vec(),
                };
                Self::UpdateAccount(SearchEngineAccount {
                    friendly_name,
                    trust_table,
                })
            },
            1 => {
                // let (zip, _) = Self::unpack_string(rest)?;
                let address = Pubkey::new_unique();
                let location = Location{
                    zip: String::from("12345")
                };
                let name = String::from("test");
                let trust_threshold = f32::from(0.0);
                Self::RegisterResource(Resource{
                    address,
                    location,
                    name,
                    trust_threshold,
                })
            }
            2 => {
                let address = Pubkey::new_unique();
                let location = Location{
                    zip: String::from("12345")
                };
                let name = String::from("test");
                let trust_threshold = f32::from(0.0);
                Self::RegisterIntent(Resource{
                    address,
                    location,
                    name,
                    trust_threshold,
                })
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

        let result = SearchEngineInstruction::unpack(&data);
        let expected_error = Err(InvalidInstruction.into());
        assert_eq!(expected_error, result);
    }

    #[test]
    fn test_update_account() {
        let mut data = Vec::new();
        data.push(0);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        
        let entries = [TrustTableEntry{
            to: Pubkey::new_unique(),
            value: 0.0,
        }; TRUST_TABLE_SIZE];
        let expected = SearchEngineInstruction::UpdateAccount(SearchEngineAccount {
            friendly_name: String::from("jeff"),
            trust_table: TrustTable{
                entries: entries.to_vec(),
            }
        });
        assert_eq!(expected, result);

    }

    #[test]
    fn test_register_resource() {
        let mut data = Vec::new();
        data.push(1);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterResource(Resource {
            address: Pubkey::new_unique(),
            location: Location{
                zip: String::from("12345")
            },
            name: String::from("test"),
            trust_threshold: 0.0,
        });
        assert_eq!(expected, result);
    }


    #[test]
    fn test_register_intent() {
        let mut data = Vec::new();
        data.push(2);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterIntent(Resource {
            address: Pubkey::new_unique(),
            location: Location{
                zip: String::from("12345")
            },
            name: String::from("test"),
            trust_threshold: 0.0,
        });
        assert_eq!(expected, result);
    }
}
