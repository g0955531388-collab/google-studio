import { ScheduledMedicationPushAlert, PushNotificationSchedulerConfig, MedicationScheduleEntry } from '../types';
import { dataService } from './dataService';
import { auditService } from './auditService';

type PushAlertSubscriber = (alerts: ScheduledMedicationPushAlert[]) => void;

class PushNotificationService {
  private configMap: Record<string, PushNotificationSchedulerConfig> = {};
  private activeAlerts: Map<string, ScheduledMedicationPushAlert> = new Map();
  private subscribers: Set<PushAlertSubscriber> = new Set();
  private schedulerIntervalId: any = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initDefaultConfig('pat-main');
    this.syncScheduledAlerts('pat-main');
  }

  private initDefaultConfig(patientId: string): PushNotificationSchedulerConfig {
    const permStatus = this.detectPermissionStatus();
    const config: PushNotificationSchedulerConfig = {
      patientId,
      browserPushEnabled: true,
      soundChimeEnabled: true,
      vibrationEnabled: true,
      snoozeDurationMinutes: 10,
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00',
      permissionStatus: permStatus,
    };
    this.configMap[patientId] = config;
    return config;
  }

  public detectPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return Notification.permission as 'granted' | 'denied' | 'default';
      } catch {
        return 'unsupported';
      }
    }
    return 'unsupported';
  }

  public async requestPushPermission(patientId: string = 'pat-main'): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        const config = this.getConfig(patientId);
        config.permissionStatus = permission as any;
        config.browserPushEnabled = permission === 'granted';

        auditService.record({
          actorId: patientId,
          actorRole: 'patient',
          actorName: 'المريض المصرح',
          action: 'WRITE',
          resourceType: 'SYSTEM_CONFIG',
          resourceId: `notif-perm-${patientId}`,
          purpose: 'PUSH_NOTIFICATION_PERMISSION_REQUEST',
          outcome: 'SUCCESS',
          policyApplied: 'POL-PUSH-NOTIFICATION-GOVERNANCE',
          provenance: 'Web Push Notification Permission Manager',
        });

        this.notifySubscribers();
        return permission as any;
      } catch (err) {
        console.warn('Notification.requestPermission failed (likely iframe sandbox):', err);
        const config = this.getConfig(patientId);
        config.permissionStatus = 'unsupported';
        this.notifySubscribers();
        return 'unsupported';
      }
    }
    return 'unsupported';
  }

  public getConfig(patientId: string = 'pat-main'): PushNotificationSchedulerConfig {
    if (!this.configMap[patientId]) {
      return this.initDefaultConfig(patientId);
    }
    return this.configMap[patientId];
  }

  public updateConfig(patientId: string, updates: Partial<PushNotificationSchedulerConfig>): PushNotificationSchedulerConfig {
    const current = this.getConfig(patientId);
    const updated: PushNotificationSchedulerConfig = {
      ...current,
      ...updates,
    };
    this.configMap[patientId] = updated;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: `notif-cfg-${patientId}`,
      purpose: 'PUSH_NOTIFICATION_CONFIG_UPDATE',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PUSH-NOTIFICATION-GOVERNANCE',
      provenance: 'Patient Push Scheduler Preferences Enclave',
    });

    this.notifySubscribers();
    return updated;
  }

  /**
   * Play a pleasant medical synthesized audio chime using Web Audio API (zero external sound file dependencies)
   */
  public playChimeSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtxClass();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      // Note 1: C5 (523.25 Hz)
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: E5 (659.25 Hz)
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      // Note 3: G5 (783.99 Hz)
      const osc3 = this.audioContext.createOscillator();
      const gain3 = this.audioContext.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.25);
      gain3.gain.setValueAtTime(0.001, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.28, now + 0.32);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(this.audioContext.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.8);
    } catch (e) {
      console.warn('AudioContext playback error (muted or user interaction required):', e);
    }
  }

  /**
   * Synchronize patient's saved medical schedules into active push notification queue
   */
  public syncScheduledAlerts(patientId: string = 'pat-main'): ScheduledMedicationPushAlert[] {
    const schedules = dataService.getMedicationSchedules(patientId);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const generated: ScheduledMedicationPushAlert[] = schedules
      .filter((s) => s.reminderEnabled)
      .map((sched) => {
        const alertId = `push-${sched.id}-${todayStr}`;
        const existing = this.activeAlerts.get(alertId);

        if (existing) {
          return existing;
        }

        const [hours, minutes] = (sched.timeSlot || '08:00').split(':').map(Number);
        const targetDate = new Date(today);
        targetDate.setHours(hours || 8, minutes || 0, 0, 0);

        const alert: ScheduledMedicationPushAlert = {
          id: alertId,
          patientId,
          scheduleId: sched.id,
          medicationName: sched.name,
          dosage: sched.dosage,
          scheduledTime: sched.timeSlot,
          targetTimestamp: targetDate.toISOString(),
          advanceMinutes: sched.reminderAdvanceMinutes || 0,
          period: sched.period as any,
          instructions: sched.instructions || 'تناول الجرعة المقررة مع كوب ماء',
          mealContext: sched.mealContext || 'ANY',
          status: 'PENDING',
          channel: 'PUSH_NOTIFICATION',
          adherenceImpact: 'UNRECORDED',
          rxNumber: sched.rxNumber,
        };

        this.activeAlerts.set(alertId, alert);
        return alert;
      });

    this.notifySubscribers();
    return generated;
  }

  public getActiveAlerts(patientId: string = 'pat-main'): ScheduledMedicationPushAlert[] {
    return Array.from(this.activeAlerts.values()).filter((a) => a.patientId === patientId);
  }

  public getPendingAlerts(patientId: string = 'pat-main'): ScheduledMedicationPushAlert[] {
    return this.getActiveAlerts(patientId).filter((a) => a.status === 'PENDING' || a.status === 'TRIGGERED');
  }

  /**
   * Trigger an alert when scheduled time arrives or simulated by patient
   */
  public triggerAlert(alertId: string): ScheduledMedicationPushAlert | null {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return null;

    alert.status = 'TRIGGERED';
    alert.triggeredAt = new Date().toISOString();

    const config = this.getConfig(alert.patientId);

    // 1. Play synthesized chime sound if enabled
    if (config.soundChimeEnabled) {
      this.playChimeSound();
    }

    // 2. Browser Web Notification API dispatch
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `تذكير بموعد الدواء: ${alert.medicationName} (${alert.dosage})`;
        const options: NotificationOptions = {
          body: `حان الآن موعد تناول جرعتك المقررة (${alert.scheduledTime}).\nالتعليمات: ${alert.instructions}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: alert.id,
          lang: 'ar',
          dir: 'rtl',
        };
        new Notification(title, options);
      } catch (e) {
        console.warn('Native push notification error (fallback to in-app banner):', e);
      }
    }

    // 3. Record sovereign immutable audit trail
    auditService.record({
      actorId: alert.patientId,
      actorRole: 'patient',
      actorName: 'نظام جدولة الإشعارات الفورية',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: alert.id,
      purpose: 'MEDICATION_ALERT_DISPATCHED',
      outcome: 'SUCCESS',
      policyApplied: 'POL-MEDICATION-PUSH-NOTIFICATION',
      provenance: 'Lifex-AI Autonomous Medication Push Scheduler',
    });

    this.notifySubscribers();
    return alert;
  }

  /**
   * Patient acknowledges alert and logs taken dose
   */
  public acknowledgeAlert(alertId: string, notes?: string): { success: boolean; alert?: ScheduledMedicationPushAlert; doseLogged?: boolean } {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return { success: false };

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date().toISOString();
    alert.adherenceImpact = 'ON_TIME';

    // Automatically record medication dose in patient medical records
    let doseLogged = false;
    try {
      dataService.logMedicationDose({
        patientId: alert.patientId,
        scheduleEntryId: alert.scheduleId,
        medicationName: alert.medicationName,
        dosage: alert.dosage,
        scheduledTime: alert.scheduledTime,
        status: 'TAKEN',
        notes: notes || 'تم تأكيد تناول الجرعة عبر إشعار الجدولة الفوري (Push Alert)',
        mealContext: alert.mealContext,
      });
      doseLogged = true;
    } catch (e) {
      console.warn('Auto log dose error:', e);
    }

    auditService.record({
      actorId: alert.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: alert.id,
      purpose: 'MEDICATION_DOSE_CONFIRMED',
      outcome: 'SUCCESS',
      policyApplied: 'POL-MEDICATION-PUSH-NOTIFICATION',
      provenance: 'Push Notification Confirmation Handler',
    });

    this.notifySubscribers();
    return { success: true, alert, doseLogged };
  }

  /**
   * Patient snoozes alert for specified duration
   */
  public snoozeAlert(alertId: string, minutes: number = 10): ScheduledMedicationPushAlert | null {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return null;

    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    alert.status = 'SNOOZED';
    alert.snoozedUntil = snoozeDate.toISOString();

    auditService.record({
      actorId: alert.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: alert.id,
      purpose: 'MEDICATION_ALERT_SNOOZED',
      outcome: 'SUCCESS',
      policyApplied: 'POL-MEDICATION-PUSH-NOTIFICATION',
      provenance: 'Push Notification Snooze Controller',
    });

    this.notifySubscribers();
    return alert;
  }

  /**
   * Test/simulate an immediate push notification for a medication in the patient's record
   */
  public simulateImmediatePushAlert(patientId: string = 'pat-main', scheduleId?: string): ScheduledMedicationPushAlert {
    const schedules = dataService.getMedicationSchedules(patientId);
    const targetSched: MedicationScheduleEntry =
      (scheduleId ? schedules.find((s) => s.id === scheduleId) : null) ||
      schedules[0] || {
        id: 'sched-live-sim',
        patientId,
        name: 'Metformin XR (ميتفورمين)',
        dosage: '500mg',
        timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        period: 'MORNING',
        instructions: 'تناول القرص مباشرة مع الوجبة',
        reminderEnabled: true,
        reminderAdvanceMinutes: 0,
      };

    const simAlertId = `sim-push-${targetSched.id}-${Date.now()}`;
    const simAlert: ScheduledMedicationPushAlert = {
      id: simAlertId,
      patientId,
      scheduleId: targetSched.id,
      medicationName: targetSched.name,
      dosage: targetSched.dosage,
      scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetTimestamp: new Date().toISOString(),
      advanceMinutes: 0,
      period: targetSched.period as any,
      instructions: targetSched.instructions || 'تناول الجرعة المقررة مع كوب ماء',
      mealContext: targetSched.mealContext || 'WITH_MEAL',
      status: 'PENDING',
      channel: 'PUSH_NOTIFICATION',
      adherenceImpact: 'UNRECORDED',
      rxNumber: targetSched.rxNumber,
    };

    this.activeAlerts.set(simAlertId, simAlert);
    this.triggerAlert(simAlertId);
    return simAlert;
  }

  public subscribe(listener: PushAlertSubscriber): () => void {
    this.subscribers.add(listener);
    listener(this.getActiveAlerts());
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notifySubscribers(): void {
    const all = this.getActiveAlerts();
    this.subscribers.forEach((fn) => {
      try {
        fn(all);
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    });
  }

  public startScheduler(intervalMs: number = 30000): () => void {
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
    }

    this.schedulerIntervalId = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowTimestamp = now.getTime();

      this.activeAlerts.forEach((alert) => {
        if (alert.status === 'PENDING') {
          const [h, m] = (alert.scheduledTime || '').split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            const alertTime = new Date(now);
            alertTime.setHours(h, m, 0, 0);

            // Subtract advance minutes
            const triggerTime = alertTime.getTime() - alert.advanceMinutes * 60 * 1000;
            if (nowTimestamp >= triggerTime && nowTimestamp <= triggerTime + 120000) {
              this.triggerAlert(alert.id);
            }
          }
        } else if (alert.status === 'SNOOZED' && alert.snoozedUntil) {
          const snoozeTimestamp = new Date(alert.snoozedUntil).getTime();
          if (nowTimestamp >= snoozeTimestamp) {
            this.triggerAlert(alert.id);
          }
        }
      });
    }, intervalMs);

    return () => {
      if (this.schedulerIntervalId) {
        clearInterval(this.schedulerIntervalId);
        this.schedulerIntervalId = null;
      }
    };
  }
}

export const pushNotificationService = new PushNotificationService();
