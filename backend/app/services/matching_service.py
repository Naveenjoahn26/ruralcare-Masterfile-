from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import (
    Hospital,
    PHC,
    Department,
    Doctor,
    AppointmentSlot,
    TestItem,
    MedicineItem,
    EmergencyResource,
    Referral,
)
from app.schemas.schemas import MatchingHospitalResult, MatchingResponse
from app.utils.geo import haversine_distance


class HospitalMatchingService:
    @staticmethod
    def match_medium(
        db: Session,
        phc_id: str,
        required_department: str,
        required_test: Optional[str] = None,
        referral_id: Optional[str] = None,
    ) -> MatchingResponse:
        """
        MEDIUM Severity Matching:
        Finds and ranks all suitable higher hospitals for a given PHC and requirements.
        Considers:
        - Department availability
        - Doctor availability
        - Required test availability
        - Appointment slot availability
        - Distance (Haversine formula)
        Returns ranked list. Does NOT auto-select (decision left to PHC worker/patient).
        """
        phc = db.query(PHC).filter(PHC.phc_id == phc_id).first()
        if not phc:
            raise ValueError(f"PHC with id '{phc_id}' not found")

        # If referral_id is provided and department/test are omitted, fetch from referral
        if referral_id:
            ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
            if ref:
                if not required_department:
                    required_department = ref.required_department
                if not required_test:
                    required_test = ref.required_test

        hospitals = db.query(Hospital).all()
        results: List[MatchingHospitalResult] = []

        for h in hospitals:
            # 1. Distance
            dist = haversine_distance(phc.latitude, phc.longitude, h.latitude, h.longitude)

            # 2. Department check
            dept = (
                db.query(Department)
                .filter(
                    Department.hospital_id == h.hospital_id,
                    Department.department_name.ilike(f"%{required_department}%"),
                    Department.available == "YES",
                )
                .first()
            )
            dept_available = dept is not None

            # 3. Doctor availability
            available_doctors = []
            if dept_available and dept is not None:
                docs = (
                    db.query(Doctor)
                    .filter(
                        Doctor.hospital_id == h.hospital_id,
                        Doctor.department_id == dept.department_id,
                        Doctor.status == "AVAILABLE",
                    )
                    .all()
                )
                available_doctors = [d.doctor_name for d in docs]
            doc_available = len(available_doctors) > 0

            # 4. Test availability
            test_available = True
            test_status = "NOT_REQUIRED"
            if required_test and required_test.strip():
                test_item = (
                    db.query(TestItem)
                    .filter(
                        TestItem.hospital_id == h.hospital_id,
                        TestItem.test_name.ilike(f"%{required_test.strip()}%"),
                    )
                    .first()
                )
                if test_item:
                    test_status = test_item.availability
                    test_available = test_item.availability in ["AVAILABLE", "LIMITED"]
                else:
                    test_status = "NOT_AVAILABLE"
                    test_available = False

            # 5. Appointment slots availability
            available_slots_count = (
                db.query(AppointmentSlot)
                .filter(
                    AppointmentSlot.hospital_id == h.hospital_id,
                    AppointmentSlot.status == "AVAILABLE",
                )
                .count()
            )
            slot_available = available_slots_count > 0

            # 6. Emergency resources check (for general reference)
            em_res = (
                db.query(EmergencyResource)
                .filter(EmergencyResource.hospital_id == h.hospital_id)
                .first()
            )

            # Calculate score for Medium cases (0 - 100)
            score = 0.0
            match_reasons = []

            if dept_available:
                score += 30.0
                match_reasons.append(f"Department '{required_department}' available")
            else:
                match_reasons.append(f"Department '{required_department}' unavailable")

            if doc_available:
                score += 20.0
                match_reasons.append(f"{len(available_doctors)} specialist(s) on duty")
            elif dept_available:
                match_reasons.append("Department active, but no doctors on immediate duty")

            if required_test and required_test.strip():
                if test_status == "AVAILABLE":
                    score += 20.0
                    match_reasons.append(f"Test '{required_test}' fully available")
                elif test_status == "LIMITED":
                    score += 10.0
                    match_reasons.append(f"Test '{required_test}' has limited availability")
                else:
                    match_reasons.append(f"Test '{required_test}' not available")
            else:
                score += 20.0  # Full test score if no specific test required

            if slot_available:
                slot_score = min(15.0, available_slots_count * 3.0)
                score += slot_score
                match_reasons.append(f"{available_slots_count} appointment slot(s) available")
            else:
                match_reasons.append("No open appointment slots currently")

            # Distance score: Max 15 points (15 points for <= 5km, scales down to 0 at 60km)
            dist_score = max(0.0, 15.0 - (dist / 4.0))
            score += dist_score
            match_reasons.append(f"Distance: {dist} km from {phc.phc_name}")

            score = min(100.0, max(0.0, score))
            result_item = MatchingHospitalResult(
                hospital_id=h.hospital_id,
                hospital_name=h.hospital_name,
                hospital_type=h.hospital_type,
                district=h.district,
                state=h.state,
                distance_km=dist,
                latitude=h.latitude,
                longitude=h.longitude,
                department_available=dept_available,
                doctor_available=doc_available,
                available_doctors=available_doctors,
                test_available=test_available,
                test_status=test_status,
                appointment_available=slot_available,
                available_slots_count=available_slots_count,
                emergency_available=(h.emergency_service == "YES"),
                emergency_beds=em_res.emergency_beds if em_res else 0,
                icu_beds_available=em_res.icu_beds_available if em_res else 0,
                oxygen_available=(em_res.oxygen_available == "YES") if em_res else False,
                ambulance_available=(em_res.ambulance_available == "YES") if em_res else False,
                estimated_wait_minutes=em_res.estimated_wait_minutes if em_res else 0,
                contact_number=h.contact_number,
                ambulance_number=h.ambulance_number,
                score=round(score, 1),
                match_reasons=match_reasons,
                is_recommended=False,
            )
            results.append(result_item)

        # Sort by score descending, then by distance ascending
        results.sort(key=lambda x: (-x.score, x.distance_km))

        # Mark top result as recommended reference for comparison
        if results and results[0].department_available:
            results[0].is_recommended = True

        return MatchingResponse(
            severity="MEDIUM",
            phc_id=phc.phc_id,
            phc_name=phc.phc_name,
            required_department=required_department,
            required_test=required_test,
            referral_id=referral_id,
            recommended_hospital=results[0] if results else None,
            hospitals=results,
            total_candidates=len(results),
        )

    @staticmethod
    def match_emergency(
        db: Session,
        phc_id: str,
        required_department: Optional[str] = None,
        required_test: Optional[str] = None,
        referral_id: Optional[str] = None,
    ) -> MatchingResponse:
        """
        EMERGENCY Severity Matching:
        Rapidly finds the single most optimal receiving hospital with emergency capability.
        Considers:
        - Emergency service availability
        - ICU beds & ICU availability
        - Oxygen availability
        - Ambulance availability
        - Emergency beds count
        - Estimated waiting time
        - Distance (Haversine formula)
        - Department availability if specified
        Auto-selects highest scoring facility for immediate transfer.
        """
        phc = db.query(PHC).filter(PHC.phc_id == phc_id).first()
        if not phc:
            raise ValueError(f"PHC with id '{phc_id}' not found")

        if referral_id:
            ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
            if ref:
                if not required_department:
                    required_department = ref.required_department
                if not required_test:
                    required_test = ref.required_test

        hospitals = db.query(Hospital).all()
        results: List[MatchingHospitalResult] = []

        for h in hospitals:
            dist = haversine_distance(phc.latitude, phc.longitude, h.latitude, h.longitude)
            em_res = (
                db.query(EmergencyResource)
                .filter(EmergencyResource.hospital_id == h.hospital_id)
                .first()
            )

            # Department check (bonus for emergency)
            dept_available = True
            available_doctors = []
            if required_department:
                dept = (
                    db.query(Department)
                    .filter(
                        Department.hospital_id == h.hospital_id,
                        Department.department_name.ilike(f"%{required_department}%"),
                        Department.available == "YES",
                    )
                    .first()
                )
                dept_available = dept is not None
                if dept_available and dept is not None:
                    docs = (
                        db.query(Doctor)
                        .filter(
                            Doctor.hospital_id == h.hospital_id,
                            Doctor.department_id == dept.department_id,
                            Doctor.status == "AVAILABLE",
                        )
                        .all()
                    )
                    available_doctors = [d.doctor_name for d in docs]

            # Test check
            test_available = True
            test_status = "NOT_REQUIRED"
            if required_test and required_test.strip():
                test_item = (
                    db.query(TestItem)
                    .filter(
                        TestItem.hospital_id == h.hospital_id,
                        TestItem.test_name.ilike(f"%{required_test.strip()}%"),
                    )
                    .first()
                )
                if test_item:
                    test_status = test_item.availability
                    test_available = test_item.availability in ["AVAILABLE", "LIMITED"]
                else:
                    test_status = "NOT_AVAILABLE"
                    test_available = False

            # Emergency score calculation (0 - 100)
            score = 0.0
            match_reasons = []

            # 1. Emergency service: 25 pts
            if h.emergency_service == "YES" and (em_res and em_res.emergency_available == "YES"):
                score += 25.0
                match_reasons.append("24x7 Emergency Trauma Unit Active")
            else:
                match_reasons.append("No active 24x7 Emergency Unit")

            # 2. ICU availability & beds: 20 pts
            if em_res and em_res.icu_available == "YES":
                icu_pts = 10.0 + min(10.0, em_res.icu_beds_available * 2.0)
                score += icu_pts
                match_reasons.append(f"ICU operational ({em_res.icu_beds_available} beds free)")
            else:
                match_reasons.append("ICU unavailable")

            # 3. Oxygen availability: 15 pts
            if em_res and em_res.oxygen_available == "YES":
                score += 15.0
                match_reasons.append("Dedicated central oxygen supply active")
            else:
                match_reasons.append("Oxygen supply not guaranteed")

            # 4. Ambulance availability: 15 pts
            if em_res and em_res.ambulance_available == "YES":
                score += 15.0
                match_reasons.append("Emergency ambulance on standby")
            else:
                match_reasons.append("No local ambulance on standby")

            # 5. Emergency beds: 10 pts
            if em_res:
                bed_pts = min(10.0, em_res.emergency_beds * 1.0)
                score += bed_pts
                match_reasons.append(f"{em_res.emergency_beds} emergency triage beds")

            # 6. Wait time factor: 10 pts (lower wait time = higher score)
            if em_res:
                wait_pts = max(0.0, 10.0 - (em_res.estimated_wait_minutes / 3.0))
                score += wait_pts
                match_reasons.append(f"Est. triage wait: {em_res.estimated_wait_minutes} mins")

            # 7. Distance factor: 15 pts (max at <=5km, scaling down to 60km)
            dist_score = max(0.0, 15.0 - (dist / 4.0))
            score += dist_score
            match_reasons.append(f"Distance: {dist} km")

            # Bonus for department match if specified
            if required_department and dept_available:
                score += 5.0
                match_reasons.append(f"Specialized department '{required_department}' available")

            available_slots_count = (
                db.query(AppointmentSlot)
                .filter(
                    AppointmentSlot.hospital_id == h.hospital_id,
                    AppointmentSlot.status == "AVAILABLE",
                )
                .count()
            )

            score = min(100.0, max(0.0, score))
            result_item = MatchingHospitalResult(
                hospital_id=h.hospital_id,
                hospital_name=h.hospital_name,
                hospital_type=h.hospital_type,
                district=h.district,
                state=h.state,
                distance_km=dist,
                latitude=h.latitude,
                longitude=h.longitude,
                department_available=dept_available,
                doctor_available=len(available_doctors) > 0,
                available_doctors=available_doctors,
                test_available=test_available,
                test_status=test_status,
                appointment_available=available_slots_count > 0,
                available_slots_count=available_slots_count,
                emergency_available=(h.emergency_service == "YES"),
                emergency_beds=em_res.emergency_beds if em_res else 0,
                icu_beds_available=em_res.icu_beds_available if em_res else 0,
                oxygen_available=(em_res.oxygen_available == "YES") if em_res else False,
                ambulance_available=(em_res.ambulance_available == "YES") if em_res else False,
                estimated_wait_minutes=em_res.estimated_wait_minutes if em_res else 0,
                contact_number=h.contact_number,
                ambulance_number=h.ambulance_number,
                score=round(score, 1),
                match_reasons=match_reasons,
                is_recommended=False,
            )
            results.append(result_item)

        # Sort emergency candidates by score descending, then wait time ascending, then distance ascending
        results.sort(key=lambda x: (-x.score, x.estimated_wait_minutes, x.distance_km))

        recommended = None
        if results:
            results[0].is_recommended = True
            recommended = results[0]

        return MatchingResponse(
            severity="EMERGENCY",
            phc_id=phc.phc_id,
            phc_name=phc.phc_name,
            required_department=required_department,
            required_test=required_test,
            referral_id=referral_id,
            recommended_hospital=recommended,
            hospitals=results,
            total_candidates=len(results),
        )
