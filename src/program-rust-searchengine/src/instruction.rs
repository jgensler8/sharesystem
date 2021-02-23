use crate::constants::TRUST_TABLE_SIZE;
use crate::error::SearchEngineError::InvalidInstruction;
use solana_program::program_error::ProgramError;
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
#[derive(Clone, Debug, PartialEq)]
pub struct Empty {}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct Location {
    pub zip: String,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct TrustTableEntry {
    pub to: String,
    pub value: f32,
}

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct TrustTable {
    pub entries: [TrustTableEntry; TRUST_TABLE_SIZE],
}

#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum SearchEngineInstruction {
    RegisterResource(Empty),
    ListResource(Location),
    UpdateTrustTable(TrustTable),
    GetTrustTable(Empty),
    RegisterIntent(Empty),
    ListIntent(Empty),
}

impl SearchEngineInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => Self::RegisterResource(Empty {}),
            1 => {
                // let (zip, _) = Self::unpack_string(rest)?;
                let zip = "test";
                Self::ListResource(Location {
                    zip: zip.to_string(),
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
    fn test_register_resource() {
        let mut data = Vec::new();
        data.push(0);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::RegisterResource(Empty {});
        assert_eq!(expected, result);
    }

    #[test]
    fn test_list_resource() {
        let mut data = Vec::new();
        data.push(1);

        let result = SearchEngineInstruction::unpack(&data).unwrap();
        let expected = SearchEngineInstruction::ListResource(Location {
            zip: String::from("test"),
        });
        assert_eq!(expected, result);
    }
}
