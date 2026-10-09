import { UserRole, UserSession } from '../types';
import { auditService } from './auditService';

class AuthService {
  private currentSession: UserSession | null = {
    id: 'usr-default-demo',
    name: 'أحمد فهد المنصوري',
    email: 'ahmed.mansoori@lifex-health.org',
    role: 'patient',
    token: 'jwt-lifex-secured-token-2026',
    is2FAVerified: true,
    activeDeviceId: 'dev-client-web-01',
    createdAt: '2026-01-15T08:00:00Z',
  };

  private listeners: Array<(session: UserSession | null) => void> = [];

  public getSession(): UserSession | null {
    return this.currentSession;
  }

  public subscribe(cb: (session: UserSession | null) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentSession));
  }

  public login(email: string, role: UserRole, name?: string): UserSession {
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: name || (role === 'doctor' ? 'د. سارة المنصور' : role === 'hospital' ? 'مستشفى الشفاء المركزي' : email.split('@')[0]),
      email,
      role,
      token: `jwt-bearer-${Date.now()}-scope-${role}`,
      is2FAVerified: true,
      activeDeviceId: `browser-${navigator.userAgent.slice(0, 15)}`,
      createdAt: new Date().toISOString(),
    };

    this.currentSession = session;
    this.notify();

    auditService.record({
      actorId: session.id,
      actorRole: session.role,
      actorName: session.name,
      action: 'LOGIN',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: session.id,
      purpose: 'AUTHENTICATION_SESSION_START',
      outcome: 'SUCCESS',
      policyApplied: 'POL-MFA-VERIFIED-SESSION',
      provenance: 'Web Portal Client via TLS 1.3 Strict',
    });

    return session;
  }

  public switchRole(role: UserRole): UserSession {
    if (!this.currentSession) {
      return this.login('user@lifex-health.org', role);
    }

    const updated: UserSession = {
      ...this.currentSession,
      role,
      name:
        role === 'doctor'
          ? 'د. سارة المنصور (استشاري)'
          : role === 'hospital'
          ? 'مستشفى الشفاء الدولي'
          : role === 'laboratory'
          ? 'مختبرات الأمل التشخيصية'
          : role === 'pharmacy'
          ? 'صيدلية الرعاية المركزية'
          : role === 'administrator'
          ? 'مدير المنظومة والامتثال'
          : this.currentSession.name,
    };

    this.currentSession = updated;
    this.notify();

    auditService.record({
      actorId: updated.id,
      actorRole: updated.role,
      actorName: updated.name,
      action: 'LOGIN',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: updated.id,
      purpose: `ROLE_SWITCH_TO_${role.toUpperCase()}`,
      outcome: 'SUCCESS',
      policyApplied: 'POL-RBAC-CONTEXT-SWITCH',
      provenance: 'Internal Identity & Access Control Engine',
    });

    return updated;
  }

  public logout() {
    if (this.currentSession) {
      auditService.record({
        actorId: this.currentSession.id,
        actorRole: this.currentSession.role,
        actorName: this.currentSession.name,
        action: 'LOGIN',
        resourceType: 'SYSTEM_CONFIG',
        resourceId: this.currentSession.id,
        purpose: 'SESSION_TERMINATION',
        outcome: 'SUCCESS',
        policyApplied: 'POL-VOLUNTARY-LOGOUT',
        provenance: 'Web Portal Session Invalidation',
      });
    }

    this.currentSession = null;
    this.notify();
  }
}

export const authService = new AuthService();
