"""API route handlers"""

from fastapi import APIRouter

from app.api.routes import health, risk

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(risk.router)
