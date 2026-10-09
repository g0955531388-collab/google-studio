# Lifex-AI Architecture Specification

> **Version:** v0.1.0  
> **Classification:** Production Sovereign Clinical Infrastructure  
> **Owner:** Ghazi Salim Bakflawi  
> **Supervision:** Rabab Al-Hayek

---

## 1. Architectural Layers

$$\text{Presentation} \longrightarrow \text{Application} \longrightarrow \text{Domain} \longrightarrow \text{Infrastructure} \longrightarrow \text{External Data / HL7 FHIR}$$

### Strict Communication Boundaries
- **UI $\neq$ Database:** No direct database calls from UI components.
- **UI $\neq$ SQL:** Zero inline queries.
- **AI $\neq$ Database:** AI assistant queries are sandboxed with zero mutation access.
- **Module A $\neq$ Module B Database:** Cross-boundary communication occurs strictly via defined service interfaces, DTOs, and event contracts.

---

## 2. Core Separation Axiom

$$\text{Source} \neq \text{Canonical Owner} \neq \text{Consumer} \neq \text{Projection}$$

| Entity | Domain | Canonical Role | Export Policy |
|---|---|---|---|
| Hospital Record | Hospital | Original Canonical Record | Scoped via patient consent |
| Lab Result | Laboratory | Original Diagnostic Evidence (ISO 15189) | FHIR Observation payload |
| Medication Dispense | Pharmacy | Batch Ledger & Dispense Trace | Prescription $\neq$ Dispense $\neq$ Taken |
| Device Telemetry | IoMT | Raw Measurement Stream | Reading $\neq$ Clinical Diagnosis |
| Patient Timeline | Patient Portal | Derived Authorized Projection | Read-only projection |

---

## 3. Authorization Flow for Clinicians

Clinician access to patient records is never automatic or default. It requires passing through the zero-trust gate:
$$\text{Identity} \longrightarrow \text{Authentication} \longrightarrow \text{Authorization (RBAC)} \longrightarrow \text{Consent} \longrightarrow \text{Purpose} \longrightarrow \text{Data Scope} \longrightarrow \text{Policy} \longrightarrow \text{Audit}$$

---

## 4. Internationalization & Accessibility
- **Primary Direction:** RTL (Arabic First)
- **Secondary Direction:** LTR (English)
- **Extensible Registry:** Ready for Turkish, French, German, Spanish.
- **Themes:** Dark Mode, Light Mode, High Contrast Mode.
