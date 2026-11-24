from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal, IS_SQLITE
from .models import Organization, User, Product, StockAdjustmentLog
from .routers import auth, products, dashboard, settings, demo

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default demo account on startup
    db = SessionLocal()
    try:
        demo.ensure_default_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="StockFlow Inventory API",
    description="Multi-tenant SaaS Inventory Management System (MVP)",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(demo.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "StockFlow API",
        "version": "0.1.0",
        "engine": "FastAPI + SQLite" if IS_SQLITE else "FastAPI + PostgreSQL (Neon)",
    }
