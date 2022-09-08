#!/usr/bin/env python
import sys

from setuptools import setup

from setuptools_rust import Binding, RustExtension

setup(
    rust_extensions=[
        RustExtension("_ke", path="_ke/Cargo.toml", binding=Binding.PyO3, optional=True)
    ]
)
