use clap::Parser;
use kleenexp::transpile;

#[derive(Parser)]
struct Cli {
    pattern: String,
}

fn main() {
    let args = Cli::parse();
    print!("{}", transpile(&args.pattern));
}
