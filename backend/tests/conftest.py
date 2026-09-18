"""Test suite fixtures.

BUGFIX: the test suite is written against the deterministic synthetic
ward (e.g. test_api_integration.py asserts exactly 3 critical-infra
sites, which is a synthetic-ward-only fact) and must not depend on
whatever PILOT_MODE a developer's local backend/.env happens to be set
to -- e.g. real mode, set for interactive demo use against Bellandur.
Tests need to be deterministic and independent of local dev environment
configuration. This must run before app.core.config's module-level
`settings = Settings()` reads the environment, so it's set here at
conftest.py's own import time, which pytest guarantees happens before
any test module (or the app code it imports) is collected.
"""
import os

os.environ["PILOT_MODE"] = "synthetic"
os.environ.pop("REAL_WARD_BBOX", None)
