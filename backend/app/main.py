import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import auth, bookings, services
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates the tables the first time (works for SQLite and PostgreSQL).
    Base.metadata.create_all(bind=engine)
    if os.getenv("SEED_DEMO_DATA", "true").lower() == "true":
        with SessionLocal() as db:
            seed_demo_data(db)
    yield


app = FastAPI(title="Farmer Service Platform", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(services.router)
app.include_router(bookings.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
