mod utils;

use utils::set_panic_hook;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn transpile(pattern: &str) -> Result<String, JsValue> {
    set_panic_hook();
    kleenexp::transpile(pattern, kleenexp::RegexFlavor::Javascript)
        .map_err(|e| JsValue::from(format!("{:?}", e)))
}
