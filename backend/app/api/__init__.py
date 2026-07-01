"""API route handlers"""

from fastapi import APIRouter

from app.api.routes import ai, health, knowledge, knowledge_admin, risk

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(risk.router)
router.include_router(ai.router)
router.include_router(knowledge.router)
router.include_router(knowledge_admin.router)
