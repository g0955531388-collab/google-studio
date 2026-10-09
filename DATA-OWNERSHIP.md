# Lifex-AI Data Ownership & Boundaries

> **Axiom:** Source $\neq$ Canonical Owner $\neq$ Consumer $\neq$ Projection

---

## 1. Canonical Domain Boundaries

### Hospital Domain
- **Owns:** Inpatient records, surgical operation logs, bed assignments, hospital admission and discharge summaries.
- **Rule:** A hospital cannot claim ownership of a patient's historical records created outside its facility.

### Laboratory Domain
- **Owns:** Biological specimens, analyzer calibration logs, raw measurements, clinical reports (ISO 15189).
- **Format:** Exported via FHIR Observation and HL7 bundles.

### Pharmacy Domain
- **Owns:** Dispense transactions, lot numbers, manufacturer batch serials, drug recall tracking.
- **Strict Distinction:** $\text{Prescription} \neq \text{Dispense} \neq \text{Medication Taken}$.

### Medical Devices (IoMT)
- **Owns:** Telemetry packet streams, device firmware, battery health.
- **Strict Distinction:** $\text{Device Reading} \neq \text{Clinical Diagnosis}$.

### Patient Domain
- **Owns:** Sovereign consent decisions, privacy preferences, personal lifestyle observations.
- **Receives:** Authorized clinical projections compiled from verified source domains.

---

## 2. Research & AI Scoped Sandboxes
- **Research Cohorts:** Consented, de-identified datasets with zero re-identification risk.
- **AI Context:** Ephemeral, read-only temporary projections; AI never writes directly to canonical records.
