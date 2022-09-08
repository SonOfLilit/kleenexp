import os
import subprocess
import sys

env = dict(os.environ)
this_dir = os.path.dirname(__file__)

env["KLEENEXP_RUST"] = "1"
result_rust = subprocess.call(["pytest", this_dir], env=env)
env["KLEENEXP_RUST"] = "0"
result_python = subprocess.call(["pytest", this_dir], env=env)
sys.exit(
    2 * bool(result_rust) + bool(result_python)
)  # 0 for neither failed, 3 for both, 2 for rust, 1 for python
