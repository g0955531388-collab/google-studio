import { ConsentRecord, UserRole } from '../types';
import { auditService } from './auditService';

class ConsentService {
  private consents: ConsentRecord[] = [
    {
      id: 'cst-01',
      patientId: 'pat-main',
      granteeId: 'doc-dr-sarah',
      granteeName: 'د. سارة المنصور (استشاري قلب وأوعية)',
      granteeRole: 'doctor',
      scope: 'FULL_PROJECTION',
      purpose: 'TREATMENT',
      status: 'ACTIVE',
      grantedAt: '2026-09-01T10:00:00Z',
      expiresAt: '2026-12-01T10:00:00Z',
    },
    {
      id: 'cst-02',
      patientId: 'pat-main',
      granteeId: 'hosp-al-hayat',
      granteeName: 'مستشفى الحياة التخصصي العام',
      granteeRole: 'hospital',
      scope: 'EMERGENCY_ONLY',
      purpose: 'EMERGENCY',
      status: 'ACTIVE',
      grantedAt: '2026-08-15T08:30:00Z',
      expiresAt: '2027-08-15T08:30:00Z',
    },
    {
      id: 'cst-03',
      patientId: 'pat-main',
      granteeId: 'res-oncology-lab',
      granteeName: 'معهد أبحاث الجينوم والسرطان',
      granteeRole: 'researcher',
      scope: 'LABS_ONLY',
      purpose: 'RESEARCH_ANONYMIZED',
      status: 'REVOKED',
      grantedAt: '2026-05-10T11:00:00Z',
      expiresAt: '2026-11-10T11:00:00Z',
      revokedAt: '2026-09-20T14:15:00Z',
    },
  ];

  public getConsentsForPatient(patientId: string): ConsentRecord[] {
    return this.consents.filter((c) => c.patientId === patientId);
  }

  public grantConsent(
    patientId: string,
    granteeId: string,
    granteeName: string,
    granteeRole: UserRole,
    scope: ConsentRecord['scope'],
    purpose: ConsentRecord['purpose'],
    durationMonths: number = 6
  ): ConsentRecord {
    const grantedAt = new Date().toISOString();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + durationMonths);

    const record: ConsentRecord = {
      id: `cst-${Date.now()}`,
      patientId,
      granteeId,
      granteeName,
      granteeRole,
      scope,
      purpose,
      status: 'ACTIVE',
      grantedAt,
      expiresAt: expires.toISOString(),
    };

    this.consents.unshift(record);

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مالك الحساب المصرح',
      action: 'WRITE',
      resourceType: 'CONSENT',
      resourceId: record.id,
      purpose: 'CONSENT_GRANT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SOVEREIGN-CONSENT',
      provenance: 'Patient Sovereign Consent Engine (Signed in UI)',
    });

    return record;
  }

  public revokeConsent(consentId: string, patientId: string): boolean {
    const consent = this.consents.find((c) => c.id === consentId && c.patientId === patientId);
    if (!consent) return false;

    consent.status = 'REVOKED';
    consent.revokedAt = new Date().toISOString();

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مالك الحساب المصرح',
      action: 'REVOKE_CONSENT',
      resourceType: 'CONSENT',
      resourceId: consentId,
      purpose: 'CONSENT_REVOCATION',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-RIGHT-TO-REVOKE',
      provenance: 'Zero-Trust Consent Enforcement - Immediate Access Termination',
    });

    return true;
  }

  public verifyAccess(patientId: string, requesterId: string, requiredScope: ConsentRecord['scope']): boolean {
    const active = this.consents.find(
      (c) =>
        c.patientId === patientId &&
        c.granteeId === requesterId &&
        c.status === 'ACTIVE' &&
        new Date(c.expiresAt) > new Date()
    );

    if (!active) return false;
    if (active.scope === 'FULL_PROJECTION') return true;
    return active.scope === requiredScope;
  }
}

export const consentService = new ConsentService();
