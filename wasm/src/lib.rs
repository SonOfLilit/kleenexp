use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn transpile(pattern: &str) -> Result<String, JsValue> {
    kleenexp::transpile(pattern, kleenexp::RegexFlavor::Javascript)
        .map_err(|e| JsValue::from(format!("{:?}", e)))
}
