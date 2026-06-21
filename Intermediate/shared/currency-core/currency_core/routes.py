"""Route layer — HTTP only.

Maps the request to the service and the service's typed errors to the exact
status codes / bodies required by the API contract. No conversion logic here.
Both the I4 polyglot service and the I5 dockerized service mount this router.

Health/readiness probes are intentionally NOT here: each service owns its own
probe surface (I4 a simple liveness check; I5 richer K8s liveness + readiness).
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from currency_core import services
from currency_core.schemas import ConvertRequest

router = APIRouter()


@router.post("/convert")
def convert(req: ConvertRequest):
    """POST /convert — convert an amount between supported currencies."""
    try:
        result = services.convert(req.amount, req.from_currency, req.to_currency)
    except services.InvalidAmountError:
        return JSONResponse(status_code=422, content={"error": "Amount must be positive"})
    except services.UnsupportedCurrencyError:
        return JSONResponse(status_code=400, content={"error": "Unsupported currency"})

    return {
        "converted_amount": result,
        "from": req.from_currency.upper(),
        "to": req.to_currency.upper(),
    }
