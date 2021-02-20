use crate::error::SearchEngineError::{InvalidInstruction};
use crate::constants::{TRUST_TABLE_SIZE};
use solana_program::{program_error::ProgramError};

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

pub struct Empty {

}

pub struct Location {
    pub zip: String
}

pub struct TrustTableEntry {
    pub to: String,
    pub value: f32,
}

pub struct TrustTable {
    pub entries: [TrustTableEntry; TRUST_TABLE_SIZE],
}

#[repr(C)]
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
            0 => {
                Self::RegisterResource(Empty{})
            }
            1 => {
                // let (zip, _) = Self::unpack_string(rest)?;
                let zip = "test";
                Self::ListResource(Location{
                    zip: zip.to_string(),
                })
            }
            _ => return Err(InvalidInstruction.into()),
        })
    }
}