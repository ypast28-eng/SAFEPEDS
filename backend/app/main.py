"""PED Health AI — FastAPI Application Entry Point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import router as api_router

app = FastAPI(
    title=settings.app_name,
    description="Educational health monitoring API. Not medical advice.",
    version="0.1.0",
)

# CORS — allow frontend origin in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health")
async def root_health():
    """Root-level health check (used by frontend api client)"""
    return {"status": "ok"}
