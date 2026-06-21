"""currency_core — shared currency-conversion core.

Single canonical implementation of the conversion logic, request/response
schemas, and the FastAPI router, imported by both:
  - I4  polyglot-currency-pair/fastapi-service
  - I5  dockerize-service

Each service supplies only a thin ``app/main.py`` that creates the FastAPI
application (its own title/description) and mounts ``currency_core.routes.router``.
"""

from currency_core.routes import router
from currency_core.schemas import ConvertRequest, ConvertResponse
from currency_core.services import (
    RATES,
    SUPPORTED_CURRENCIES,
    InvalidAmountError,
    UnsupportedCurrencyError,
    convert,
)

__version__ = "0.1.0"

__all__ = [
    "router",
    "ConvertRequest",
    "ConvertResponse",
    "convert",
    "InvalidAmountError",
    "UnsupportedCurrencyError",
    "RATES",
    "SUPPORTED_CURRENCIES",
    "__version__",
]
