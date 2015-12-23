import os
import sys
from setuptools import setup
from setuptools.command.test import test as TestCommand

class PyTest(TestCommand):
    user_options = [('pytest-args=', 'a', "Arguments to pass to py.test")]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.pytest_args = []

    def finalize_options(self):
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True

    def run_tests(self):
        #import here, cause outside the eggs aren't loaded
        import pytest
        errno = pytest.main(self.pytest_args)
        sys.exit(errno)

setup(
    name = "re2",
    version = "0.0.1",
    author = "Aur Saraf",
    author_email = "aur@loris.co.il",
    description = ("Modern regex syntax with a painless upgrade path"),
	url = 'https://github.com/sonoflilit/re2',
    packages=['re2', 'tests'],
    install_requires=['parsimonious==0.6.2'],
    tests_require=['pytest'],
    cmdclass = {'test': PyTest},
)
