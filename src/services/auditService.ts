import { AuditLogEntry, UserRole } from '../types';

class AuditService {
  private logs: AuditLogEntry[] = [
    {
      id: 'aud-101',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actorId: 'doc-dr-sarah',
      actorRole: 'doctor',
      actorName: 'د. سارة المنصور (استشاري قلب)',
      action: 'READ',
      resourceType: 'PATIENT_RECORD',
      resourceId: 'pat-9941',
      purpose: 'TREATMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-CONSENT-CLINICAL-ACTIVE',
      provenance: 'Encrypted HL7 Connector -> Secure TLS 1.3',
    },
    {
      id: 'aud-102',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      actorId: 'lab-central-specimen',
      actorRole: 'laboratory',
      actorName: 'مختبرات الأمل التشخيصية المركزية',
      action: 'WRITE',
      resourceType: 'LAB_RESULT',
      resourceId: 'res-lipid-882',
      purpose: 'TREATMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-LAB-CANONICAL-OWNERSHIP',
      provenance: 'Cobas 8000 Analyzer -> FHIR R4 Bundle',
    },
    {
      id: 'aud-103',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      actorId: 'guest-unauthorized',
      actorRole: 'patient',
      actorName: 'محاولة وصول خارجية مجهولة',
      action: 'FAILED_ACCESS',
      resourceType: 'PATIENT_RECORD',
      resourceId: 'pat-8812',
      purpose: 'UNKNOWN',
      outcome: 'DENIED',
      policyApplied: 'POL-RBAC-ZERO-TRUST-ENFORCED',
      provenance: 'API Gateway Blocked (Invalid Bearer Token)',
    },
  ];

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(newLog);
    return newLog;
  }
}

export const auditService = new AuditService();
