use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the Search Engine program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum ResourceError {
    /// Invalid instruction number passed in.
    #[error("Invalid instruction")]
    InvalidInstruction,
}
impl From<ResourceError> for ProgramError {
    fn from(e: ResourceError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for ResourceError {
    fn type_of() -> &'static str {
        "SearchEngine Error"
    }
}
