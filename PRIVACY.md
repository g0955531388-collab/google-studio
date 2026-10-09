# Lifex-AI Privacy & Sovereign Consent

> **Version:** v0.1.0  
> **Compliance:** GDPR Art. 6/9, HIPAA Security Rule, ISO 27701

---

## 1. Sovereign Consent Principles
1. **Explicit Granular Consent:** Patients explicitly choose the scope (e.g., `FULL_PROJECTION`, `VITALS_ONLY`, `LABS_ONLY`, `EMERGENCY_ONLY`).
2. **Purpose-of-Use Scoping:** Consents are bounded by purpose (`TREATMENT`, `SECOND_OPINION`, `EMERGENCY`, `RESEARCH_ANONYMIZED`).
3. **Right to Immediate Revocation:** Any consent grant can be revoked in real-time, instantly cutting off subsequent projection views.

---

## 2. Right to Data Portability
- Patients can export their authorized projection in cryptographic JSON / PDF bundles.
- Export requests from unauthorized or secondary actors are denied and logged.

---

## 3. Immutable Audit Trails
Every access event registers:
- **Who:** Actor ID, Role, Certified Name.
- **What:** Action (`READ`, `WRITE`, `EXPORT`, `REVOKE_CONSENT`).
- **When:** UTC ISO 8601 Timestamp.
- **Where:** TLS IP / Device fingerprint.
- **Why:** Declared purpose of use.
- **Outcome:** `SUCCESS`, `DENIED`, or `FLAGGED`.
- **Policy:** Explicit security policy reference applied.
- **Provenance:** Cryptographic connector and payload verification trace.
