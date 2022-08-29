use kleenexp::*;
use pyo3::{create_exception, exceptions::PyException, import_exception, prelude::*};

import_exception!(re, error);

create_exception!(mymodule, KleenexpError, error);
create_exception!(mymodule, CompileError, KleenexpError);
create_exception!(mymodule, ParseError, KleenexpError);

struct PyRegexFlavor {
    flavor: RegexFlavor,
}

impl FromPyObject<'_> for PyRegexFlavor {
    fn extract(ob: &'_ PyAny) -> PyResult<Self> {
        let flavor = match ob.getattr("name")?.extract()? {
            "PYTHON" => RegexFlavor::Python,
            "JAVASCRIPT" => RegexFlavor::Javascript,
            "RUST" => RegexFlavor::Rust,
            "RUST_FANCY" => RegexFlavor::RustFancy,
            other => Err(PyException::new_err(format!("Unknown flavor {}", other)))?,
        };
        Ok(PyRegexFlavor { flavor })
    }
}

#[pyfunction]
fn re(py: Python<'_>, pattern: String, flavor: Option<PyRegexFlavor>) -> PyResult<String> {
    let result = py.allow_threads(|| {
        transpile(
            &pattern,
            flavor.map(|f| f.flavor).unwrap_or(RegexFlavor::Python),
        )
    });
    match result {
        Ok(kleenexp) => Ok(kleenexp),
        Err(Error::ParseError(e)) => Err(ParseError::new_err(e)),
        Err(Error::CompileError(e)) => Err(CompileError::new_err(e)),
    }
}

#[pymodule]
fn _ke(py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(re, m)?)?;
    // intentionally exporting KleenexpError with the wrong name, like re.errors does, for compatibility with `re`
    m.add("error", py.get_type::<KleenexpError>())?;
    m.add("KleenexpError", py.get_type::<KleenexpError>())?;
    m.add("CompileError", py.get_type::<CompileError>())?;
    m.add("ParseError", py.get_type::<ParseError>())?;
    Ok(())
}
