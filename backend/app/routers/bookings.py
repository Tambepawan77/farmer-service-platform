from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_role
from ..models import Booking, Service, User
from ..schemas import BookingIn, BookingOut, StatusIn

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def to_out(b: Booking) -> BookingOut:
    s = b.service
    return BookingOut(
        id=b.id,
        service_id=s.id,
        service_title=s.title,
        price=s.price,
        unit=s.unit,
        provider_name=s.provider.name,
        provider_phone=s.provider.phone,
        farmer_name=b.farmer.name,
        farmer_phone=b.farmer.phone,
        farmer_village=b.farmer.village,
        work_date=b.work_date,
        quantity=b.quantity,
        notes=b.notes,
        status=b.status,
        estimated_cost=round(s.price * b.quantity, 2),
        created_at=b.created_at,
    )


@router.post("", response_model=BookingOut)
def create_booking(
    data: BookingIn,
    user: User = Depends(require_role("farmer")),
    db: Session = Depends(get_db),
):
    service = db.get(Service, data.service_id)
    if not service or not service.available:
        raise HTTPException(status_code=400, detail="This service is not available")
    if data.work_date < date.today():
        raise HTTPException(status_code=400, detail="Choose today or a future date")
    booking = Booking(
        service_id=service.id,
        farmer_id=user.id,
        work_date=data.work_date,
        quantity=data.quantity,
        notes=data.notes.strip(),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return to_out(booking)


@router.get("/mine", response_model=list[BookingOut])
def my_bookings(user: User = Depends(require_role("farmer")), db: Session = Depends(get_db)):
    stmt = select(Booking).where(Booking.farmer_id == user.id).order_by(Booking.id.desc())
    return [to_out(b) for b in db.scalars(stmt)]


@router.get("/incoming", response_model=list[BookingOut])
def incoming_bookings(user: User = Depends(require_role("provider")), db: Session = Depends(get_db)):
    stmt = (
        select(Booking)
        .join(Service, Booking.service_id == Service.id)
        .where(Service.provider_id == user.id)
        .order_by(Booking.id.desc())
    )
    return [to_out(b) for b in db.scalars(stmt)]


@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_status(
    booking_id: int,
    data: StatusIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new, current = data.status, booking.status
    if user.role == "farmer" and booking.farmer_id == user.id:
        allowed = new == "cancelled" and current in ("pending", "accepted")
    elif user.role == "provider" and booking.service.provider_id == user.id:
        allowed = (current == "pending" and new in ("accepted", "rejected")) or (
            current == "accepted" and new == "completed"
        )
    else:
        raise HTTPException(status_code=404, detail="Booking not found")

    if not allowed:
        raise HTTPException(status_code=400, detail=f"Cannot change from {current} to {new}")
    booking.status = new
    db.commit()
    return to_out(booking)
