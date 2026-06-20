from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/audit_platform"
    SECRET_KEY: str = "changeme-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REDIS_URL: str = "redis://localhost:6379"
    UPLOAD_DIR: str = "/tmp/audit_uploads"
    WORKING_HOURS_START: int = 8
    WORKING_HOURS_END: int = 17
    WORKING_DAYS: List[int] = [0, 1, 2, 3, 4]  # Mon-Fri

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
