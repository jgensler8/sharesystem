// use num_derive::FromPrimitive;
use num_derive::FromPrimitive;
use thiserror::Error;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};

/// Errors that may be returned by the Search Engine program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum SearchEngineError {
    /// Invalid instruction number passed in.
    #[error("Invalid instruction")]
    InvalidInstruction,
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