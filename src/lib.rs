use kleenexp::*;
use pyo3::{create_exception, exceptions::PyException, prelude::*};

create_exception!(mymodule, CompilerError, PyException);

#[pyfunction]
fn re(pattern: String, syntax: Option<String>) -> PyResult<String> {
    assert!(syntax.is_none() || syntax.unwrap() == "python");
    let result = transpile(&pattern);
    match result {
        Ok(kleenexp) => Ok(kleenexp),
        Err(Error::ParseError(e)) => Err(CompilerError::new_err(format!(
            "error parsing kleenexp: {}",
            e
        ))),
        Err(Error::CompileError(e)) => Err(CompilerError::new_err(format!(
            "error compiling kleenexp: {}",
            e
        ))),
    }
}

#[pymodule]
fn _ke(py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(re, m)?)?;
    m.add("CompilerError", py.get_type::<CompilerError>())?;
    Ok(())
}
