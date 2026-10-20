"""Adds demo data the first time the app starts on an empty database."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Service, User
from .security import hash_password

DEMO_SERVICES = [
    ("Tractor with rotavator", "Tractor & Ploughing", "45 HP tractor with driver. Good for ploughing and soil preparation.", 900, "per hour", "Vaijapur"),
    ("Mini harvester for wheat and jowar", "Harvesting", "Fast harvesting with a small team. Bring your own diesel.", 1800, "per acre", "Kopargaon"),
    ("Pesticide spraying (drone)", "Spraying", "Drone spraying for cotton, soybean and sugarcane. Covers 1 acre in 10 minutes.", 500, "per acre", "Ahilyanagar"),
    ("Drip irrigation setup", "Irrigation", "Pipe laying, drip lines and fitting. Material charged separately.", 2500, "per day", "Shirdi"),
    ("Farm labour group (6 people)", "Labour", "Experienced group for sowing, weeding and picking.", 3000, "per day", "Vaijapur"),
    ("Pickup truck for market transport", "Transport", "Carries up to 1.5 tonnes to the nearest mandi.", 1200, "per trip", "Sangamner"),
]


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return
    provider = User(
        name="Ramesh Patil", email="provider@demo.com", phone="9876500001",
        village="Vaijapur", password_hash=hash_password("demo1234"), role="provider",
    )
    farmer = User(
        name="Sunil Jadhav", email="farmer@demo.com", phone="9876500002",
        village="Kopargaon", password_hash=hash_password("demo1234"), role="farmer",
    )
    db.add_all([provider, farmer])
    db.flush()
    for title, category, description, price, unit, location in DEMO_SERVICES:
        db.add(Service(
            provider_id=provider.id, title=title, category=category,
            description=description, price=price, unit=unit, location=location,
        ))
    db.commit()
