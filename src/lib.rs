use pyo3::prelude::*;
use kleenexp::*;

/// Formats the sum of two numbers as string.
#[pyfunction]
fn re(pattern: String, syntax: Option<String>) -> PyResult<String> {
    assert!(syntax.is_none() || syntax.unwrap() == "python");
    Ok(transpile(&pattern))
}

/// A Python module implemented in Rust.
#[pymodule]
fn _ke(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(re, m)?)?;
    Ok(())
}
