# Lifex-AI API Specification

> **Base Route:** `/api/v1`  
> **Protocols:** REST/JSON, FHIR R4, WebSocket/MQTT for IoMT Telemetry

---

## 1. Authentication & Identity
- `POST /api/auth/register` - Create new clinical or patient account.
- `POST /api/auth/login` - Initiate session and challenge 2FA.
- `POST /api/auth/2fa/verify` - Verify OTP token.
- `POST /api/auth/logout` - Invalidate bearer token and log termination.

---

## 2. Patient Domain
- `GET /api/patients/:id/projection` - Retrieve authorized patient health projection.
- `POST /api/patients/:id/export` - Export GDPR/HIPAA compliant data bundle.

---

## 3. Clinical Portals
- `GET /api/doctors/:id/encounters` - Scoped clinical encounters list.
- `POST /api/doctors/:id/encounters` - Create new consultation encounter.
- `GET /api/hospitals/:id/beds` - Inpatient bed occupancy and department capacity.
- `GET /api/laboratories/:id/results` - Certified FHIR laboratory observations.
- `POST /api/pharmacies/dispense` - Record dispense transaction with batch lot verification.

---

## 4. Privacy, Consent & Audit
- `GET /api/consent/:patientId` - List active and historical consent grants.
- `POST /api/consent/grant` - Grant scoped access to clinician or hospital.
- `POST /api/consent/revoke` - Instant revocation of consent grant.
- `GET /api/audit/logs` - Query immutable audit ledger (admin/compliance access).

---

## 5. Supportive AI Engine
- `POST /api/ai/query` - Request non-diagnostic assistance (returns answer, sources, uncertainty, provenance, disclaimer).
