import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RURALCARE Central Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ruralcare.db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:8000",
    ]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ruralcare-central-platform-sih26133-secret-key")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "480"))  # 8 hours
    DATA_DIR: str = os.getenv(
        "DATA_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data")),
    )

    # Notification & SMTP settings (configured via environment variables)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", os.getenv("FROM_EMAIL", "notifications@ruralcare.gov.in"))
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ["1", "true", "yes"]
    SMTP_TIMEOUT: int = int(os.getenv("SMTP_TIMEOUT", "10"))

    # Test Email recipient (optional, used only for explicit tests)
    TEST_EMAIL_RECIPIENT: str = os.getenv("TEST_EMAIL_RECIPIENT", "")

    # SMS Adapter settings
    SMS_GATEWAY_URL: str = os.getenv("SMS_GATEWAY_URL", "")
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "RURLCR")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)


settings = Settings()
