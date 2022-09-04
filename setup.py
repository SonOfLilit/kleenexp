#!/usr/bin/env python
import sys

from setuptools import setup

from setuptools_rust import RustExtension

setup(rust_extensions=[RustExtension("_ke", path="_ke/Cargo.toml", optional=True)])
