use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the Search Engine program.}
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum SearchEngineError {
    /// Invalid instruction number passed in.
    #[error("Invalid instruction")]
    InvalidInstruction,

    /// Database is full of data an needs to be resized
    #[error("Database full")]
    DatabaseFull,

    /// Database bucket can't hold any more addresses
    #[error("Bucket full")]
    BucketFull,
}
impl From<SearchEngineError> for ProgramError {
    fn from(e: SearchEngineError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for SearchEngineError {
    fn type_of() -> &'static str {
        "SearchEngine Error"
    }
}
