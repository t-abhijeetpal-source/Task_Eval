"""FastAPI application entry point (I4).

Thin entry: the conversion logic, schemas, and routes (POST /convert, GET /health)
all live in the shared ``currency_core`` package. This module only assembles the app.

Run with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from currency_core.routes import router

app = FastAPI(
    title="Currency Conversion Service",
    description="FastAPI service exposing POST /convert with hardcoded rates (I4).",
    version="1.0.0",
)

app.include_router(router)


@app.get("/health")
def health() -> dict:
    """Liveness probe."""
    return {"status": "ok"}
