"""Application configuration"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "PEDSAFE API"
    debug: bool = True
    api_prefix: str = "/api/v1"

    # Database — wired in Phase 2
    database_url: str = ""

    # Supabase — wired in Phase 2
    supabase_url: str = ""
    supabase_key: str = ""

    # OpenAI — wired in Phase 3
    openai_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
