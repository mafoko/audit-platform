from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.config import settings
from app.database import engine, Base
from app.routers import auth, engagements, controls, evidence, findings, reports
import app.models  # ensure all models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Audit Lifecycle Management Platform",
    description="API for managing audit engagements, evidence, findings, and reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(engagements.router)
app.include_router(controls.router)
app.include_router(evidence.router)
app.include_router(findings.router)
app.include_router(reports.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "audit-platform-backend"}
