use clap::Parser;
use kleenexp::transpile;

#[derive(Parser)]
struct Cli {
    pattern: String,
}

fn main() {
    let args = Cli::parse();
    let result = transpile(&args.pattern, kleenexp::RegexFlavor::Python);
    match result {
        Ok(s) => print!("{}", s),
        Err(s) => print!("Error: {:?}", s),
    }
}
