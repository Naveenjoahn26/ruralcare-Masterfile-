from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Hospital, Department, Doctor, TestItem, MedicineItem, EmergencyResource, User
from app.core.security import get_current_user
from app.schemas.schemas import HospitalBase, HospitalDetailResponse, AppointmentSlotBase
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("", response_model=List[HospitalBase])
def list_hospitals(
    district: Optional[str] = Query(None, description="Filter by district"),
    department: Optional[str] = Query(None, description="Filter by available department name"),
    emergency: Optional[str] = Query(None, description="Filter by emergency service (YES/NO)"),
    test: Optional[str] = Query(None, description="Filter by available test name"),
    search: Optional[str] = Query(None, description="Search by hospital name or district"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search and filter higher hospitals in the network.
    """
    query = db.query(Hospital)

    if district:
        query = query.filter(Hospital.district.ilike(f"%{district}%"))
    if emergency:
        query = query.filter(Hospital.emergency_service == emergency.upper())
    if search:
        query = query.filter(
            (Hospital.hospital_name.ilike(f"%{search}%"))
            | (Hospital.district.ilike(f"%{search}%"))
        )

    if department:
        dept_hosp_ids = [
            d.hospital_id
            for d in db.query(Department)
            .filter(
                Department.department_name.ilike(f"%{department}%"),
                Department.available == "YES",
            )
            .all()
        ]
        query = query.filter(Hospital.hospital_id.in_(dept_hosp_ids))

    if test:
        test_hosp_ids = [
            t.hospital_id
            for t in db.query(TestItem)
            .filter(
                TestItem.test_name.ilike(f"%{test}%"),
                TestItem.availability.in_(["AVAILABLE", "LIMITED"]),
            )
            .all()
        ]
        query = query.filter(Hospital.hospital_id.in_(test_hosp_ids))

    return query.all()


@router.get("/{hospital_id}", response_model=HospitalDetailResponse)
def get_hospital(
    hospital_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full details of a specific hospital including departments, doctors, tests, medicines, and emergency resources.
    """
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hospital '{hospital_id}' not found")

    slots = AppointmentService.get_slots(db, hospital_id=hospital_id, status="AVAILABLE")

    return HospitalDetailResponse(
        hospital_id=hospital.hospital_id,
        hospital_name=hospital.hospital_name,
        district=hospital.district,
        state=hospital.state,
        latitude=hospital.latitude,
        longitude=hospital.longitude,
        hospital_type=hospital.hospital_type,
        emergency_service=hospital.emergency_service,
        contact_number=hospital.contact_number,
        ambulance_number=hospital.ambulance_number,
        departments=hospital.departments,
        doctors=hospital.doctors,
        tests=hospital.tests,
        medicines=hospital.medicines,
        emergency_resource=hospital.emergency_resource,
        available_slots=slots,
    )


@router.get("/{hospital_id}/slots", response_model=List[AppointmentSlotBase])
def get_hospital_slots(
    hospital_id: str,
    department_id: Optional[str] = Query(None, description="Filter by department ID"),
    doctor_id: Optional[str] = Query(None, description="Filter by doctor ID"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query("AVAILABLE", alias="status", description="Filter by slot status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get appointment slots for a specific hospital with optional department/doctor/date filters.
    """
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hospital '{hospital_id}' not found")

    return AppointmentService.get_slots(
        db,
        hospital_id=hospital_id,
        department_id=department_id,
        doctor_id=doctor_id,
        date=date,
        status=status_filter,
    )
