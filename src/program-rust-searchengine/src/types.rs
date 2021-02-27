use borsh::{BorshDeserialize, BorshSerialize};
use std::collections::{HashMap};

pub const PUBLIC_KEY_SIZE: usize = 32;

pub const INSTRUCTION_DEFAULT: u8 = 0;
pub const INSTRUCTION_UPDATE_ACCOUNT: u8 = 1;
pub const INSTRUCTION_REGISTER_RESOURCE: u8 = 2;
pub const INSTRUCTION_REGISTER_INTENT: u8 = 3;

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, PartialEq, Debug, Default)]
pub struct TrustTableEntry {
    pub to: [u8; PUBLIC_KEY_SIZE],
    pub value: u8,
}

pub const MAX_TRUST_TABLE_SIZE: usize = 1;
pub const MAX_FRIENDLY_NAME_SIZE: usize = 32;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct SearchEngineAccount {
    pub friendly_name: [u8; MAX_FRIENDLY_NAME_SIZE],
    pub trust_table: [TrustTableEntry; MAX_TRUST_TABLE_SIZE],
}

pub const MAX_ZIP_SIZE: usize = 32;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Copy, Ord)]
pub struct Location {
    pub zip: [u8; MAX_ZIP_SIZE],
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct Resource {
    pub address: [u8; PUBLIC_KEY_SIZE],
    pub name: [u8; MAX_FRIENDLY_NAME_SIZE],
    pub location: Location,
    pub trust_threshold: u8,
}

pub const MAX_NUM_RESOURCE_IN_BUCKET: usize = 10;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct ResourceIndex {
    pub map: HashMap<Location, [[u8; PUBLIC_KEY_SIZE]; MAX_NUM_RESOURCE_IN_BUCKET]>,
}