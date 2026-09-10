import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
from app.api.v1.referrals import router as referrals_router
from app.api.v1.matching import router as matching_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.phcs import router as phcs_router
from app.api.v1.patients import router as patients_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.auth import router as auth_router
from seed.import_csv import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ruralcare")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists on startup
    logger.info("Initializing RURALCARE Central Platform Database...")
    Base.metadata.create_all(bind=engine)
    # Check if data is already seeded; if not, seed from CSVs
    from app.database.session import SessionLocal
    from app.models.models import Hospital
    db = SessionLocal()
    try:
        if db.query(Hospital).count() == 0:
            logger.info("No hospitals detected in DB. Auto-seeding from synthetic dataset CSVs...")
            #seed_database(reset=False)
    finally:
        db.close()
    yield
    logger.info("RURALCARE Central Platform shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# RURALCARE – Central Platform (Member 2) API Hub

**Problem Statement SIH26133**: Improving accessibility and quality of public healthcare services in rural/underserved areas.

This module acts as the central intelligence and coordination bridge connecting:
- **Member 1 (PHC Portal)**: Ingests patient referrals (MEDIUM & EMERGENCY), provides hospital availability and matching data.
- **Member 3 (Higher Hospital Portal)**: Exposes referral records, appointment schedules, and ingests clinical treatment updates (`PATIENT_ATTENDED`, `NOT_ATTENDED`, etc.).

### Key Capabilities
- **Hospital Search & Matching**: Haversine distance, department, doctor, test, and emergency resource scoring.
- **MEDIUM Referral Workflow**: Multi-hospital ranking, patient preference recording, atomic slot booking.
- **EMERGENCY Referral Workflow**: Immediate triage matching, ICU/oxygen/ambulance resource allocation, one-click emergency transfer.
- **Integration Webhooks & Notifications**: Automatic PHC alerts on patient no-shows (`NOT_ATTENDED` → `PHC_NOTIFIED`).
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
origins = settings.CORS_ORIGINS
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(referrals_router, prefix=settings.API_V1_STR)
app.include_router(matching_router, prefix=settings.API_V1_STR)
app.include_router(hospitals_router, prefix=settings.API_V1_STR)
app.include_router(appointments_router, prefix=settings.API_V1_STR)
app.include_router(phcs_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "module": "Member 2 - Central Platform",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.post(f"{settings.API_V1_STR}/seed/reset", tags=["Admin & Seed"])
def trigger_seed_reset():
    """
    Utility endpoint to re-seed all 10 synthetic CSV datasets and reset database state for testing/demo.
    """
    seed_database(reset=True)
    return {"status": "success", "message": "Database reset and seeded from CSV datasets"}
