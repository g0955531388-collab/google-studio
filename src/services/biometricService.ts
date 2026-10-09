import { BiometricAuthMethod, BiometricAuthState } from '../types';
import { auditService } from './auditService';

class BiometricService {
  private state: BiometricAuthState = {
    isVerified: false,
    verifiedAt: null,
    method: null,
    expiresAt: null,
    deviceId: 'Secure-Enclave-FIDO2-Mobile-HW-01',
  };

  private listeners: Array<(state: BiometricAuthState) => void> = [];
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  public getState(): BiometricAuthState {
    // Check if session has expired
    if (this.state.isVerified && this.state.expiresAt) {
      if (new Date().getTime() > new Date(this.state.expiresAt).getTime()) {
        this.lock(false);
      }
    }
    return { ...this.state };
  }

  public isVerified(): boolean {
    return this.getState().isVerified;
  }

  public subscribe(cb: (state: BiometricAuthState) => void): () => void {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(s);
      } catch (err) {
        console.error('Error in biometric listener:', err);
      }
    });
  }

  public async authenticate(
    patientId: string = 'pat-main',
    method: BiometricAuthMethod,
    options?: { pin?: string; simulateFailure?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate biometric hardware scanner verification latency
    await new Promise((resolve) => setTimeout(resolve, 1100));

    if (options?.simulateFailure) {
      auditService.record({
        actorId: patientId,
        actorRole: 'patient',
        actorName: 'المريض المصرح',
        action: 'FAILED_ACCESS',
        resourceType: 'PATIENT_RECORD',
        resourceId: `bio-${patientId}`,
        purpose: 'BIOMETRIC_HARDWARE_ENCLAVE_STEP_UP',
        outcome: 'DENIED',
        policyApplied: 'POL-FIDO2-BIOMETRIC-STEP-UP',
        provenance: `Hardware Enclave biometric match failed via ${method}`,
      });
      return { success: false, error: 'لم يتم التعرف على البصمة بدقة. يرجى إعادة المحاولة أو إدخال رمز المرور.' };
    }

    if (method === 'PIN') {
      const pin = options?.pin?.trim();
      if (!pin || (pin !== '1234' && pin !== '0000' && pin.length < 4)) {
        auditService.record({
          actorId: patientId,
          actorRole: 'patient',
          actorName: 'المريض المصرح',
          action: 'FAILED_ACCESS',
          resourceType: 'PATIENT_RECORD',
          resourceId: `bio-pin-${patientId}`,
          purpose: 'BIOMETRIC_FALLBACK_PIN_STEP_UP',
          outcome: 'DENIED',
          policyApplied: 'POL-FIDO2-PIN-STEP-UP',
          provenance: 'Invalid clinical passcode entry attempt',
        });
        return { success: false, error: 'رمز المرور غير صحيح. الرمز التجريبي الافتراضي هو 1234.' };
      }
    }

    // Successful step-up authentication
    const now = new Date();
    // Valid for 15 minutes of uninterrupted sensitive record access
    const expires = new Date(now.getTime() + 15 * 60 * 1000);

    this.state = {
      isVerified: true,
      verifiedAt: now.toISOString(),
      method,
      expiresAt: expires.toISOString(),
      deviceId: 'Secure-Enclave-FIDO2-Mobile-HW-01',
    };

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    this.sessionTimer = setTimeout(() => {
      this.lock(true);
    }, 15 * 60 * 1000);

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'LOGIN',
      resourceType: 'PATIENT_RECORD',
      resourceId: `bio-auth-${patientId}`,
      purpose: 'BIOMETRIC_HARDWARE_ENCLAVE_STEP_UP',
      outcome: 'SUCCESS',
      policyApplied: 'POL-FIDO2-BIOMETRIC-STEP-UP',
      provenance: `Hardware Secure Enclave FIDO2 / WebAuthn (${method}) -> Cryptographic Nonce Verified`,
    });

    this.notify();
    return { success: true };
  }

  public lock(notifyAudit: boolean = true): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    const wasVerified = this.state.isVerified;
    this.state = {
      isVerified: false,
      verifiedAt: null,
      method: null,
      expiresAt: null,
      deviceId: 'Secure-Enclave-FIDO2-Mobile-HW-01',
    };

    if (wasVerified && notifyAudit) {
      auditService.record({
        actorId: 'pat-main',
        actorRole: 'patient',
        actorName: 'المريض المصرح',
        action: 'WRITE',
        resourceType: 'PATIENT_RECORD',
        resourceId: 'bio-session-lock',
        purpose: 'BIOMETRIC_SESSION_LOCK',
        outcome: 'SUCCESS',
        policyApplied: 'POL-FIDO2-ZERO-TRUST-RE-LOCK',
        provenance: 'Patient initiated or timeout lock of sensitive clinical projection enclave',
      });
    }

    this.notify();
  }
}

export const biometricService = new BiometricService();
