import {
  BiometricAnomalyAlert,
  BiometricAnomalySeverity,
  BiometricAnomalyStatus,
  BiometricAnomalyType,
  BiometricAnomalySummaryStats,
  PhysiologicalTelemetryPoint,
} from '../types';
import { auditService } from './auditService';

class BiometricAnomalyService {
  private alerts: BiometricAnomalyAlert[] = [];
  private listeners: ((alerts: BiometricAnomalyAlert[]) => void)[] = [];
  private simulationTimer: ReturnType<typeof setInterval> | null = null;
  private soundEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.alerts = this.getInitialAnomalies();
  }

  private getInitialAnomalies(): BiometricAnomalyAlert[] {
    const now = new Date();
    const isoMinsAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

    return [
      {
        id: 'anom-ecg-101',
        patientId: 'pat-main',
        patientName: 'أحمد مصطفى السيد',
        patientAge: 58,
        consentToken: 'TOK-CONSENT-CAR-8821',
        deviceSource: {
          deviceId: 'dev-ecg-991',
          model: 'CardioSense Ultra 12-Lead Continuous ECG',
          category: 'ECG_MONITOR',
          batteryPercentage: 92,
          signalQuality: 'EXCELLENT',
        },
        anomalyType: 'ARRHYTHMIA_TACHYCARDIA',
        title: 'تسرع جيبي حاد مع انقباضات بطينية مبكرة (Paroxysmal Tachycardia)',
        titleEn: 'Paroxysmal Supraventricular Tachycardia with PVCs',
        severity: 'CRITICAL',
        status: 'UNACKNOWLEDGED',
        detectedAt: isoMinsAgo(3),
        parameter: 'معدل نبضات القلب (Heart Rate)',
        unit: 'bpm',
        observedValue: 142,
        baselineRange: {
          min: 60,
          max: 100,
          targetText: '60 - 100 bpm (طبيعي مستقر)',
        },
        deviationPercentage: 42,
        physiologicalTrace: [
          { timestamp: '12:40', value: 74 },
          { timestamp: '12:45', value: 78 },
          { timestamp: '12:50', value: 85 },
          { timestamp: '12:55', value: 112 },
          { timestamp: '12:57', value: 135 },
          { timestamp: '12:58', value: 142 },
        ],
        clinicalMechanism: 'تسارع مفاجئ في ضربات القلب مع رصد شحنات كهربائية بطينية غير منتظمة أثناء الراحة.',
        urgencyProtocol: 'مراجعة فورية لتخطيط القلب المستمر والتواصل مع المريض لتقييم الأعراض الحادة (خفقان/دوخة).',
        recommendedAction: 'إجراء اتصال هاتفي عاجل أو بدء جلسة استشارة عن بعد لتقييم الحاجة لجرعة إسعافية أو إحالة للطوارئ.',
        provenance: 'CardioSense Real-Time Biosensor AI Engine (v3.2.1-sec)',
      },
      {
        id: 'anom-spo2-102',
        patientId: 'pat-fatima',
        patientName: 'فاطمة الزهراء الشامي',
        patientAge: 64,
        consentToken: 'TOK-CONSENT-RES-9410',
        deviceSource: {
          deviceId: 'dev-ox-303',
          model: 'PulseOx Cloud Wireless Oximeter',
          category: 'PULSE_OXIMETER',
          batteryPercentage: 78,
          signalQuality: 'GOOD',
        },
        anomalyType: 'HYPOXEMIA_DESATURATION',
        title: 'هبوط حاد في تشبع الأكسجين المحيطي (Severe Nocturnal Hypoxemia)',
        titleEn: 'Acute SpO2 Desaturation Below Safety Threshold',
        severity: 'CRITICAL',
        status: 'UNACKNOWLEDGED',
        detectedAt: isoMinsAgo(8),
        parameter: 'تشبع الأكسجين الشرياني (SpO2)',
        unit: '%',
        observedValue: 86,
        baselineRange: {
          min: 95,
          max: 100,
          targetText: '95% - 100% (تشبع كافٍ)',
        },
        deviationPercentage: -9.5,
        physiologicalTrace: [
          { timestamp: '12:35', value: 97 },
          { timestamp: '12:40', value: 96 },
          { timestamp: '12:45', value: 93 },
          { timestamp: '12:50', value: 89 },
          { timestamp: '12:53', value: 86 },
        ],
        clinicalMechanism: 'انخفاض سريع لنسبة الأكسجين دون عتبة 90%، يرجح حدوث انقطاع تنفس أو تفاقم رئوي احتقاني.',
        urgencyProtocol: 'بروتوكول الأكسجين الإسعافي: التحقق من وضعية المريض ومطالبته بارتداء قناع الأكسجين المنزلي.',
        recommendedAction: 'تنبيه وحدة الرعاية التنفسية المنزلية وإخطار المرافقين للتحقق من سلامة المريضة فوراً.',
        provenance: 'PulseOx Telemetry Broker v2.4 (HL7 Ingest Stream)',
      },
      {
        id: 'anom-cgm-103',
        patientId: 'pat-zainab',
        patientName: 'زينب السعيد',
        patientAge: 45,
        consentToken: 'TOK-CONSENT-DIA-7744',
        deviceSource: {
          deviceId: 'dev-cgm-404',
          model: 'Dexcom Continuous Glucose Biosensor G7',
          category: 'CONTINUOUS_GLUCOSE',
          batteryPercentage: 95,
          signalQuality: 'EXCELLENT',
        },
        anomalyType: 'SEVERE_HYPOGLYCEMIA',
        title: 'هبوط سكر حاد ومتسارع (Severe Hypoglycemia with Rapid Fall)',
        titleEn: 'Acute Hypoglycemia Alert (< 60 mg/dL with Double Down Arrow)',
        severity: 'CRITICAL',
        status: 'UNACKNOWLEDGED',
        detectedAt: isoMinsAgo(14),
        parameter: 'مستوى الغلوكوز المستمر (Interstitial Glucose)',
        unit: 'mg/dL',
        observedValue: 52,
        baselineRange: {
          min: 70,
          max: 140,
          targetText: '70 - 140 mg/dL (النطاق السليم)',
        },
        deviationPercentage: -25.7,
        physiologicalTrace: [
          { timestamp: '12:30', value: 110 },
          { timestamp: '12:35', value: 88 },
          { timestamp: '12:40', value: 72 },
          { timestamp: '12:45', value: 59 },
          { timestamp: '12:47', value: 52 },
        ],
        clinicalMechanism: 'انخفاض غلوكوز الدم الحاد بمعدل هبوط > 2 mg/dL في الدقيقة مع خطورة حدوث غيبوبة نقص السكر.',
        urgencyProtocol: 'قاعدة 15-15: تناول 15 جرام كربوهيدرات سريعة الامتصاص وإعادة القياس بعد 15 دقيقة.',
        recommendedAction: 'إرسال إشعار فوري لهاتف المريض والمرافق وطلب تناول سكريات سريعة والراحة التامة.',
        provenance: 'Dexcom IoMT Biosensor Gateway Realtime Feed',
      },
      {
        id: 'anom-bp-104',
        patientId: 'pat-tareq',
        patientName: 'طارق العلي',
        patientAge: 52,
        consentToken: 'TOK-CONSENT-HTN-6619',
        deviceSource: {
          deviceId: 'dev-bp-202',
          model: 'Omron TeleHealth Bluetooth Cuff Platinum',
          category: 'BLOOD_PRESSURE_CUFF',
          batteryPercentage: 88,
          signalQuality: 'GOOD',
        },
        anomalyType: 'HYPERTENSIVE_CRISIS',
        title: 'ارتفاع ضغط دم انقباضي متقدم (Stage 2 Severe Hypertension)',
        titleEn: 'Hypertensive Urgency Reading (178/112 mmHg)',
        severity: 'WARNING',
        status: 'ACKNOWLEDGED',
        detectedAt: isoMinsAgo(28),
        parameter: 'ضغط الدم الشرياني (Blood Pressure)',
        unit: 'mmHg',
        observedValue: '178/112',
        baselineRange: {
          min: '110/70',
          max: '130/80',
          targetText: 'أقل من 130/80 mmHg (المستوى المستهدف)',
        },
        deviationPercentage: 36.9,
        physiologicalTrace: [
          { timestamp: '08:00', value: 135 },
          { timestamp: '10:00', value: 142 },
          { timestamp: '12:00', value: 165 },
          { timestamp: '12:30', value: 178 },
        ],
        clinicalMechanism: 'ارتفاع حاد في الضغط الانقباضي والانبساطي يفوق 170/110 mmHg دون أعراض عصبية صريحة.',
        urgencyProtocol: 'إعادة القياس بعد 10 دقائق من الاسترخاء، وتأكيد تناول جرعة خافض الضغط الصباحية.',
        recommendedAction: 'تم الإقرار من د. سارة المنصور — جاري مراقبة القراءة التالية قبل تعديل جرعة ليسينوبريل.',
        acknowledgedAt: isoMinsAgo(12),
        acknowledgedBy: 'د. سارة المنصور (استشاري قلب)',
        provenance: 'Omron Bluetooth Gateway Telehealth Engine',
      },
    ];
  }

  // -------------------------------------------------------------
  // SUBSCRIPTION & STATE ACCESS
  // -------------------------------------------------------------
  public subscribe(listener: (alerts: BiometricAnomalyAlert[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.alerts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const copy = [...this.alerts];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('BiometricAnomalyService subscriber error:', err);
      }
    });
  }

  public getAlerts(): BiometricAnomalyAlert[] {
    return [...this.alerts];
  }

  public getAlertById(id: string): BiometricAnomalyAlert | undefined {
    return this.alerts.find((a) => a.id === id);
  }

  public getSummaryStats(): BiometricAnomalySummaryStats {
    const total = this.alerts.length;
    const critical = this.alerts.filter((a) => a.severity === 'CRITICAL').length;
    const warning = this.alerts.filter((a) => a.severity === 'WARNING').length;
    const attention = this.alerts.filter((a) => a.severity === 'ATTENTION').length;
    const unacknowledged = this.alerts.filter((a) => a.status === 'UNACKNOWLEDGED').length;
    const triaged = this.alerts.filter((a) => a.status === 'TRIAGED').length;

    // Unique active monitored patients
    const patientIds = new Set(this.alerts.map((a) => a.patientId));

    return {
      totalAlerts: total,
      criticalCount: critical,
      warningCount: warning,
      attentionCount: attention,
      unacknowledgedCount: unacknowledged,
      triagedCount: triaged,
      activeMonitoredPatients: patientIds.size,
      telemetryIngestRateMsgSec: 48.2, // Simulated active biosensor message rate
    };
  }

  // -------------------------------------------------------------
  // MUTATIONS WITH AUDIT LOGGING
  // -------------------------------------------------------------
  public acknowledgeAlert(id: string, doctorId: string = 'doc-dr-sarah', doctorName: string = 'د. سارة المنصور'): BiometricAnomalyAlert | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = doctorName;

    auditService.record({
      actorId: doctorId,
      actorRole: 'doctor',
      actorName: doctorName,
      action: 'WRITE',
      resourceType: 'DEVICE_TELEMETRY',
      resourceId: alert.id,
      purpose: 'CLINICAL_ANOMALY_ACKNOWLEDGEMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-DOCTOR-BIOMETRIC-TRIAGE',
      provenance: 'Doctor Biometric Notification Dispatcher',
    });

    this.notify();
    return alert;
  }

  public triageAlert(
    id: string,
    actionTaken: string,
    clinicalNotes: string,
    doctorId: string = 'doc-dr-sarah',
    doctorName: string = 'د. سارة المنصور'
  ): BiometricAnomalyAlert | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;

    alert.status = 'TRIAGED';
    alert.triagedActionTaken = actionTaken;
    alert.clinicalNotes = clinicalNotes;
    if (!alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = doctorName;
    }

    auditService.record({
      actorId: doctorId,
      actorRole: 'doctor',
      actorName: doctorName,
      action: 'WRITE',
      resourceType: 'DEVICE_TELEMETRY',
      resourceId: alert.id,
      purpose: 'CLINICAL_ANOMALY_TRIAGED_INTERVENTION',
      outcome: 'SUCCESS',
      policyApplied: 'POL-DOCTOR-BIOMETRIC-TRIAGE',
      provenance: 'Doctor Biometric Notification Dispatcher',
    });

    this.notify();
    return alert;
  }

  public dismissAlert(id: string, reason: string, doctorId: string = 'doc-dr-sarah'): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return false;

    alert.status = 'DISMISSED';
    alert.clinicalNotes = `تم الإغلاق: ${reason}`;

    auditService.record({
      actorId: doctorId,
      actorRole: 'doctor',
      actorName: 'الطبيب المعالج',
      action: 'WRITE',
      resourceType: 'DEVICE_TELEMETRY',
      resourceId: alert.id,
      purpose: 'CLINICAL_ALERT_DISMISSAL',
      outcome: 'SUCCESS',
      policyApplied: 'POL-DOCTOR-BIOMETRIC-TRIAGE',
      provenance: 'Doctor Biometric Notification Dispatcher',
    });

    this.notify();
    return true;
  }

  // -------------------------------------------------------------
  // REAL-TIME PUSH DISPATCH & INGESTION
  // -------------------------------------------------------------
  public pushAnomaly(
    raw: Omit<BiometricAnomalyAlert, 'id' | 'detectedAt' | 'provenance'> & { id?: string; detectedAt?: string }
  ): BiometricAnomalyAlert {
    const alert: BiometricAnomalyAlert = {
      ...raw,
      id: raw.id || `anom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      detectedAt: raw.detectedAt || new Date().toISOString(),
      provenance: 'Lifex-AI Real-Time Biometric Stream Processor',
    };

    // Prepend to alerts array so latest is at the top
    this.alerts = [alert, ...this.alerts];

    // Trigger subtle clinical alert tone if critical
    if (this.soundEnabled && alert.severity === 'CRITICAL') {
      this.playAlertSound();
    }

    auditService.record({
      actorId: alert.deviceSource.deviceId,
      actorRole: 'hospital',
      actorName: alert.deviceSource.model,
      action: 'WRITE',
      resourceType: 'DEVICE_TELEMETRY',
      resourceId: alert.id,
      purpose: 'REAL_TIME_ANOMALY_INGEST',
      outcome: 'SUCCESS',
      policyApplied: 'POL-BIOMETRIC-ANOMALY-STREAM',
      provenance: 'Biosensor Telemetry Stream Engine',
    });

    this.notify();
    return alert;
  }

  // -------------------------------------------------------------
  // SIMULATION GENERATOR (For instant interactive testing)
  // -------------------------------------------------------------
  public simulateIncomingAnomaly(
    scenario: 'TACHYCARDIA' | 'HYPOXEMIA' | 'HYPERTENSION' | 'HYPOGLYCEMIA' | 'FEVER' = 'TACHYCARDIA'
  ): BiometricAnomalyAlert {
    const timestamp = new Date().toISOString();

    switch (scenario) {
      case 'TACHYCARDIA':
        return this.pushAnomaly({
          patientId: 'pat-main',
          patientName: 'أحمد مصطفى السيد',
          patientAge: 58,
          consentToken: 'TOK-CONSENT-CAR-8821',
          deviceSource: {
            deviceId: 'dev-ecg-991',
            model: 'CardioSense Ultra 12-Lead Continuous ECG',
            category: 'ECG_MONITOR',
            batteryPercentage: 91,
            signalQuality: 'EXCELLENT',
          },
          anomalyType: 'ARRHYTHMIA_TACHYCARDIA',
          title: 'تسارع ضربات قلب بطيني مفاجئ (Ventricular Tachycardia Run)',
          titleEn: 'Ventricular Tachycardia Run > 150 bpm',
          severity: 'CRITICAL',
          status: 'UNACKNOWLEDGED',
          parameter: 'معدل ضربات القلب (Heart Rate)',
          unit: 'bpm',
          observedValue: 154,
          baselineRange: { min: 60, max: 100, targetText: '60 - 100 bpm' },
          deviationPercentage: 54,
          physiologicalTrace: [
            { timestamp: 'قبل 4 دقائق', value: 82 },
            { timestamp: 'قبل 3 دقائق', value: 95 },
            { timestamp: 'قبل دقيقتين', value: 128 },
            { timestamp: 'الآن', value: 154 },
          ],
          clinicalMechanism: 'نوبة تسارع بطيني متكررة مسجلة عبر المسار الثاني (Lead II) تستدعي تقييماً عاجلاً لثبات الدورة الدموية.',
          urgencyProtocol: 'تفعيل إشعار الأولوية القصوى (Code Yellow) والتواصل الفوري مع المريض.',
          recommendedAction: 'الاتصال بالمريض أو أسرته فوراً للتحقق من الوعي وضغط الدم، وتجهيز الإحالة لأقرب قسم طوارئ إن استمر.',
        });

      case 'HYPOXEMIA':
        return this.pushAnomaly({
          patientId: 'pat-fatima',
          patientName: 'فاطمة الزهراء الشامي',
          patientAge: 64,
          consentToken: 'TOK-CONSENT-RES-9410',
          deviceSource: {
            deviceId: 'dev-ox-303',
            model: 'PulseOx Cloud Wireless Oximeter',
            category: 'PULSE_OXIMETER',
            batteryPercentage: 76,
            signalQuality: 'GOOD',
          },
          anomalyType: 'HYPOXEMIA_DESATURATION',
          title: 'هبوط أكسجين حرج مع ضيق تنفس (Critical SpO2 Drop)',
          titleEn: 'Severe SpO2 Desaturation to 84%',
          severity: 'CRITICAL',
          status: 'UNACKNOWLEDGED',
          parameter: 'تشبع الأكسجين الشرياني (SpO2)',
          unit: '%',
          observedValue: 84,
          baselineRange: { min: 95, max: 100, targetText: '95 - 100%' },
          deviationPercentage: -11.5,
          physiologicalTrace: [
            { timestamp: 'قبل 5 دقائق', value: 94 },
            { timestamp: 'قبل 3 دقائق', value: 91 },
            { timestamp: 'قبل دقيقة', value: 87 },
            { timestamp: 'الآن', value: 84 },
          ],
          clinicalMechanism: 'هبوط متواصل لمستوى الأكسجين المحيطي تحت عتبة الخطر الشديد (85%).',
          urgencyProtocol: 'تطبيق الأكسجين المنزلي 3L/min فوراً والتحقق من عدم انسداد المجاري الهوائية.',
          recommendedAction: 'توجيه المريض لطلب الإسعاف أو التوجه فوراً لوحدة الطوارئ الرئوية.',
        });

      case 'HYPERTENSION':
        return this.pushAnomaly({
          patientId: 'pat-tareq',
          patientName: 'طارق العلي',
          patientAge: 52,
          consentToken: 'TOK-CONSENT-HTN-6619',
          deviceSource: {
            deviceId: 'dev-bp-202',
            model: 'Omron TeleHealth Bluetooth Cuff',
            category: 'BLOOD_PRESSURE_CUFF',
            batteryPercentage: 86,
            signalQuality: 'GOOD',
          },
          anomalyType: 'HYPERTENSIVE_CRISIS',
          title: 'أزمة ارتفاع ضغط دم مفاجئة (Hypertensive Urgency Alert)',
          titleEn: 'Hypertensive Urgency: SBP > 185 mmHg',
          severity: 'CRITICAL',
          status: 'UNACKNOWLEDGED',
          parameter: 'ضغط الدم الشرياني (Blood Pressure)',
          unit: 'mmHg',
          observedValue: '186/118',
          baselineRange: { min: '110/70', max: '130/80', targetText: '< 130/80 mmHg' },
          deviationPercentage: 43.1,
          physiologicalTrace: [
            { timestamp: 'قبل ساعة', value: 145 },
            { timestamp: 'قبل نصف ساعة', value: 162 },
            { timestamp: 'الآن', value: 186 },
          ],
          clinicalMechanism: 'ارتفاع مفاجئ في المقاومة الوعائية الطرفية يقترب من حد الخطر على الأعضاء المستهدفة.',
          urgencyProtocol: 'التحقق من غياب أعراض الصداع الحاد أو تشوش الرؤية أو ألم الصدر.',
          recommendedAction: 'مراجعة التاريخ الدوائي وتوجيه المريض للهدوء والجلوس، والاتصال الطبي لتعديل العلاج.',
        });

      case 'HYPOGLYCEMIA':
        return this.pushAnomaly({
          patientId: 'pat-zainab',
          patientName: 'زينب السعيد',
          patientAge: 45,
          consentToken: 'TOK-CONSENT-DIA-7744',
          deviceSource: {
            deviceId: 'dev-cgm-404',
            model: 'Dexcom Continuous Glucose Biosensor G7',
            category: 'CONTINUOUS_GLUCOSE',
            batteryPercentage: 94,
            signalQuality: 'EXCELLENT',
          },
          anomalyType: 'SEVERE_HYPOGLYCEMIA',
          title: 'نوبة نقص سكر حاد متسارع (Critical Hypoglycemia Event)',
          titleEn: 'Severe Hypoglycemia Event: Glucose 48 mg/dL',
          severity: 'CRITICAL',
          status: 'UNACKNOWLEDGED',
          parameter: 'الغلوكوز المستمر (CGM)',
          unit: 'mg/dL',
          observedValue: 48,
          baselineRange: { min: 70, max: 140, targetText: '70 - 140 mg/dL' },
          deviationPercentage: -31.4,
          physiologicalTrace: [
            { timestamp: 'قبل 15 دقيقة', value: 92 },
            { timestamp: 'قبل 10 دقائق', value: 74 },
            { timestamp: 'قبل 5 دقائق', value: 58 },
            { timestamp: 'الآن', value: 48 },
          ],
          clinicalMechanism: 'نضوب حاد في غلوكوز الدم مع وتيرة هبوط سريعة جداً تهدد بفقدان الوعي.',
          urgencyProtocol: 'إسعاف فوري: عصير محلى أو أقراص غلوكوز وطلب المساعدة من المحيطين.',
          recommendedAction: 'تنبيه هاتف المريض بصوت إنذار عالي وإبلاغ جهات الاتصال المسجلة بحالات الطوارئ.',
        });

      case 'FEVER':
        return this.pushAnomaly({
          patientId: 'pat-main',
          patientName: 'أحمد مصطفى السيد',
          patientAge: 58,
          consentToken: 'TOK-CONSENT-CAR-8821',
          deviceSource: {
            deviceId: 'dev-temp-505',
            model: 'ThermoTrack Clinical Continuous Biosensor',
            category: 'TEMPERATURE_SENSOR',
            batteryPercentage: 90,
            signalQuality: 'GOOD',
          },
          anomalyType: 'FEBRILE_SPIKE',
          title: 'ارتفاع حاد في درجة حرارة الجسم (High Febrile Spike)',
          titleEn: 'Acute Febrile Spike > 39.2°C',
          severity: 'WARNING',
          status: 'UNACKNOWLEDGED',
          parameter: 'حرارة الجسم المركزية (Body Temperature)',
          unit: '°C',
          observedValue: 39.4,
          baselineRange: { min: 36.5, max: 37.3, targetText: '36.5 - 37.3 °C' },
          deviationPercentage: 5.9,
          physiologicalTrace: [
            { timestamp: 'قبل ساعتين', value: 37.2 },
            { timestamp: 'قبل ساعة', value: 38.1 },
            { timestamp: 'الآن', value: 39.4 },
          ],
          clinicalMechanism: 'استجابة التهابية أو عدوى حادة مفاجئة تؤدي لارتفاع سريع في حرارة الجسم الأساسية.',
          urgencyProtocol: 'سوائل وفيرة وخافض حرارة (باراسيتامول) ومراقبة علامات الصدمة الإنتانية.',
          recommendedAction: 'طلب فحص دم إسعافي ومزرعة في حال استمرار الحمى أو ظهور قشعريرة شديدة.',
        });
    }
  }

  // -------------------------------------------------------------
  // SIMULATION STREAM CONTROLLER
  // -------------------------------------------------------------
  public startLiveSimulation(intervalMs: number = 20000): void {
    if (this.simulationTimer) return;

    const scenarios: ('TACHYCARDIA' | 'HYPOXEMIA' | 'HYPERTENSION' | 'HYPOGLYCEMIA' | 'FEVER')[] = [
      'TACHYCARDIA',
      'HYPOXEMIA',
      'HYPERTENSION',
      'HYPOGLYCEMIA',
      'FEVER',
    ];
    let index = 0;

    this.simulationTimer = setInterval(() => {
      const scenario = scenarios[index % scenarios.length];
      index++;
      this.simulateIncomingAnomaly(scenario);
    }, intervalMs);
  }

  public stopLiveSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public isSimulationRunning(): boolean {
    return this.simulationTimer !== null;
  }

  public resetToDefault(): void {
    this.stopLiveSimulation();
    this.alerts = this.getInitialAnomalies();
    this.notify();
  }

  public toggleSound(enabled?: boolean): boolean {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    return this.soundEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private playAlertSound(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.setValueAtTime(660, now + 0.12);
      osc.frequency.setValueAtTime(880, now + 0.24);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const biometricAnomalyService = new BiometricAnomalyService();
