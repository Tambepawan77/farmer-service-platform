from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from ..models import Booking, Service, User
from ..schemas import AvailabilityIn, ServiceIn, ServiceOut

router = APIRouter(prefix="/api/services", tags=["services"])


def to_out(s: Service) -> ServiceOut:
    return ServiceOut(
        id=s.id,
        title=s.title,
        category=s.category,
        description=s.description,
        price=s.price,
        unit=s.unit,
        location=s.location,
        available=s.available,
        provider_id=s.provider_id,
        provider_name=s.provider.name,
        provider_phone=s.provider.phone,
    )


@router.get("", response_model=list[ServiceOut])
def list_services(q: str = "", category: str = "", db: Session = Depends(get_db)):
    """Public list. Optional search text (q) and category filter."""
    stmt = select(Service).where(Service.available.is_(True)).order_by(Service.id.desc())
    if category:
        stmt = stmt.where(Service.category == category)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(func.lower(Service.title).like(like), func.lower(Service.location).like(like))
        )
    return [to_out(s) for s in db.scalars(stmt)]


# NOTE: "/mine" must be declared before "/{service_id}"
@router.get("/mine", response_model=list[ServiceOut])
def my_services(user: User = Depends(require_role("provider")), db: Session = Depends(get_db)):
    stmt = select(Service).where(Service.provider_id == user.id).order_by(Service.id.desc())
    return [to_out(s) for s in db.scalars(stmt)]


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return to_out(service)


@router.post("", response_model=ServiceOut)
def create_service(
    data: ServiceIn,
    user: User = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    service = Service(provider_id=user.id, **data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return to_out(service)


def _own_service(service_id: int, user: User, db: Session) -> Service:
    service = db.get(Service, service_id)
    if not service or service.provider_id != user.id:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.patch("/{service_id}", response_model=ServiceOut)
def set_availability(
    service_id: int,
    data: AvailabilityIn,
    user: User = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    service = _own_service(service_id, user, db)
    service.available = data.available
    db.commit()
    return to_out(service)


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    user: User = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    service = _own_service(service_id, user, db)
    if db.scalar(select(Booking.id).where(Booking.service_id == service.id).limit(1)):
        raise HTTPException(
            status_code=400,
            detail="This service has bookings. Mark it unavailable instead of deleting.",
        )
    db.delete(service)
    db.commit()
    return {"ok": True}
