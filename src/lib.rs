use kleenexp::*;
use pyo3::{create_exception, import_exception, prelude::*};

import_exception!(re, error);

create_exception!(mymodule, KleenexpError, error);
create_exception!(mymodule, CompilerError, KleenexpError);
create_exception!(mymodule, ParseError, KleenexpError);

#[pyfunction]
fn re(pattern: String, syntax: Option<String>) -> PyResult<String> {
    assert!(syntax.is_none() || syntax.unwrap() == "python");
    let result = transpile(&pattern);
    match result {
        Ok(kleenexp) => Ok(kleenexp),
        Err(Error::ParseError(e)) => Err(ParseError::new_err(format!(
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
    // intentionally exporting KleenexpError with the wrong name, like re.errors does, for compatibility with `re`
    m.add("error", py.get_type::<KleenexpError>())?;
    m.add("KleenexpError", py.get_type::<KleenexpError>())?;
    m.add("CompilerError", py.get_type::<CompilerError>())?;
    m.add("ParseError", py.get_type::<ParseError>())?;
    Ok(())
}
