from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["farmer", "provider"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    village: str = Field(default="", max_length=100)
    password: str = Field(min_length=6, max_length=64)
    role: Role


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: str
    village: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ServiceIn(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    category: str
    description: str = Field(default="", max_length=1000)
    price: float = Field(gt=0)
    unit: str
    location: str = Field(min_length=2, max_length=100)


class AvailabilityIn(BaseModel):
    available: bool


class ServiceOut(BaseModel):
    id: int
    title: str
    category: str
    description: str
    price: float
    unit: str
    location: str
    available: bool
    provider_id: int
    provider_name: str
    provider_phone: str


class BookingIn(BaseModel):
    service_id: int
    work_date: date
    quantity: float = Field(gt=0)
    notes: str = Field(default="", max_length=500)


class StatusIn(BaseModel):
    status: Literal["accepted", "rejected", "completed", "cancelled"]


class BookingOut(BaseModel):
    id: int
    service_id: int
    service_title: str
    price: float
    unit: str
    provider_name: str
    provider_phone: str
    farmer_name: str
    farmer_phone: str
    farmer_village: str
    work_date: date
    quantity: float
    notes: str
    status: str
    estimated_cost: float
    created_at: datetime
