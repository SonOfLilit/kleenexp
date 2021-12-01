import os
import sys
from setuptools import setup
from setuptools.command.test import test as TestCommand


class PyTest(TestCommand):
    user_options = [("pytest-args=", "a", "Arguments to pass to py.test")]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.pytest_args = []

    def finalize_options(self):
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True

    def run_tests(self):
        # import here, cause outside the eggs aren't loaded
        import pytest

        errno = pytest.main(self.pytest_args)
        sys.exit(errno)


setup(
    name="kleenexp",
    version="0.0.1",
    author="Aur Saraf",
    author_email="sonoflilit@gmail.com",
    description=("Modern regex syntax with a painless upgrade path"),
    url="https://github.com/sonoflilit/kleenexp",
    packages=["ke", "tests"],
    entry_points={"console_scripts": ["ke = ke:main"]},
    install_requires=["parsimonious==0.8.1"],
    tests_require=["pytest"],
    cmdclass={"test": PyTest},
)
