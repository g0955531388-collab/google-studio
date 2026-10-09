import { ActivityLogEntry, ActivityLogCategory, ActivityLogLevel } from '../types';

class ActivityLogService {
  private listeners: ((logs: ActivityLogEntry[]) => void)[] = [];
  private simulationTimer: ReturnType<typeof setInterval> | null = null;

  private logs: ActivityLogEntry[] = [
    {
      id: 'act-dev-001',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      category: 'DEVICE_DIAGNOSTIC',
      level: 'CRITICAL',
      title: 'تنبيه هبوط سكر الدم الحاد — جهاز Dexcom CGM',
      description: 'تم رصد هبوط سريع في مستوى الغلوكوز إلى 64 mg/dL بمعدل انخفاض > 2.2 mg/dL/min أثناء فترة الراحة.',
      device: {
        id: 'dev-cgm-404',
        model: 'Dexcom Continuous Glucose Biosensor G7',
        category: 'CONTINUOUS_GLUCOSE',
        serialNumber: 'SN-CGM-99120-S',
        batteryPercentage: 98,
        firmware: 'v4.0.2',
        latestReading: '64 mg/dL (Rapid decline ↓↓)',
      },
      diagnosticAlert: {
        alertType: 'NOCTURNAL_HYPOGLYCEMIA_RISK',
        severity: 'CRITICAL',
        parameter: 'Blood Glucose',
        threshold: '< 70 mg/dL with high rate of change',
        actualValue: '64 mg/dL (-2.4 mg/dL/min)',
        recommendedAction: 'تناول 15 غرام من الكربوهيدرات سريعة الامتصاص وإعادة القياس بعد 15 دقيقة وإخطار جهة الاتصال الموثوقة.',
        acknowledged: false,
      },
      provenance: 'IoMT Secure MQTT Gateway -> Algorithmic Vitals Screener -> Event Bus',
    },
    {
      id: 'act-acc-002',
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      category: 'PORTAL_ACCESS',
      level: 'SUCCESS',
      title: 'وصول سريري مصرح — بوابة الطبيب المعالج',
      description: 'د. سارة المنصور قامت باستعراض المخطط الزمني وتخطيط القلب ECG لمريض pat-main بموجب موافقة سارية (POL-CONSENT-CLINICAL-ACTIVE).',
      actor: {
        id: 'doc-dr-sarah',
        name: 'د. سارة المنصور',
        role: 'doctor',
        ip: '194.126.88.14',
        portal: 'بوابة الطبيب (Doctor Portal)',
      },
      systemContext: {
        nodeName: 'Damascus Clinical Gateway',
        action: 'PROJECTION_READ',
        latencyMs: 14,
        policyApplied: 'POL-CONSENT-CLINICAL-ACTIVE',
        status: 'GRANTED_200',
      },
      provenance: 'Zero-Trust OIDC Session Token (mTLS Verified)',
    },
    {
      id: 'act-dev-003',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      category: 'DEVICE_DIAGNOSTIC',
      level: 'WARNING',
      title: 'قراءة ضغط دم مرتفعة — كفة Omron TeleHealth',
      description: 'تم رصد ارتفاع ضغط الدم الانقباضي إلى 152/94 mmHg مع مؤشر نبض 84 bpm عبر اتصال البلوتوث الآمن.',
      device: {
        id: 'dev-bp-202',
        model: 'Omron TeleHealth Bluetooth Cuff Platinum',
        category: 'BLOOD_PRESSURE_CUFF',
        serialNumber: 'SN-BP-11883-M',
        batteryPercentage: 24,
        firmware: 'v2.1.0',
        latestReading: '152/94 mmHg (MAP: 113)',
      },
      diagnosticAlert: {
        alertType: 'HYPERTENSION_STAGE_2_DETECTED',
        severity: 'HIGH',
        parameter: 'Systolic / Diastolic Pressure',
        threshold: '> 140/90 mmHg',
        actualValue: '152/94 mmHg',
        recommendedAction: 'توجيه المريض للجلوس في وضع هادئ وإعادة القياس بعد 5 دقائق، مع تنبيه الطبيب المتابع إذا تكررت القراءة.',
        acknowledged: true,
      },
      provenance: 'Bluetooth GATT Encrypted Tunnel -> IoMT Gateway Adapter',
    },
    {
      id: 'act-sys-004',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      category: 'SYSTEM_EVENT',
      level: 'INFO',
      title: 'مزامنة عقدة HL7 / FHIR R4 Engine بنجاح',
      description: 'اكتمال ترحيل حزمة نتائج الفحوصات الجينية والدهنية من مختبرات الأمل التشخيصية وتدقيق التوقيع الرقمي للمختبر.',
      systemContext: {
        nodeName: 'Lab HL7/FHIR Engine',
        action: 'FHIR_BUNDLE_INGESTION',
        latencyMs: 22,
        policyApplied: 'POL-LAB-CANONICAL-OWNERSHIP',
        status: 'SYNC_COMPLETE_200',
      },
      provenance: 'ISO 15189 Lab Bridge -> Canonical Digest Verifier',
    },
    {
      id: 'act-dev-005',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      category: 'DEVICE_DIAGNOSTIC',
      level: 'INFO',
      title: 'فحص التناغم الكهربائي للقلب — CardioSense Ultra ECG',
      description: 'تحليل شريط ECG مستمر لـ 12 اتجاهاً: نظم جيبي طبيعي (Normal Sinus Rhythm) بتردد 74 نبضة/دقيقة دون خوارج انقباض.',
      device: {
        id: 'dev-ecg-991',
        model: 'CardioSense Ultra 12-Lead Continuous ECG',
        category: 'ECG_MONITOR',
        serialNumber: 'SN-ECG-77492-X',
        batteryPercentage: 91,
        firmware: 'v3.2.1-sec-verified',
        latestReading: 'Sinus Rhythm 74 bpm (PR: 148ms, QRS: 88ms, QTc: 412ms)',
      },
      provenance: 'IoMT Telemetry Stream -> Edge Wavelet Signal Analyzer',
    },
    {
      id: 'act-acc-006',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      category: 'PORTAL_ACCESS',
      level: 'CRITICAL',
      title: 'محاولة وصول غير مصرح بها تم صدها (Zero-Trust Block)',
      description: 'طلب وصول غير مصرح إلى سجل pat-8812 من عنوان شبكة خارجي مجهول دون رمز تفويض صالح.',
      actor: {
        id: 'guest-unauthorized-401',
        name: 'مستخدم خارجي مجهول الهوية',
        role: 'patient',
        ip: '45.133.1.99',
        portal: 'API Direct Ingress',
      },
      systemContext: {
        nodeName: 'Damascus Clinical Gateway',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        latencyMs: 2,
        policyApplied: 'POL-RBAC-ZERO-TRUST-ENFORCED',
        status: 'DENIED_403_CLOSE_FAIL',
      },
      provenance: 'Reverse Proxy WAF -> Sovereign Policy Enforcement Point',
    },
    {
      id: 'act-sys-007',
      timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      category: 'SYSTEM_EVENT',
      level: 'SUCCESS',
      title: 'توثيق صرف دوائي في سجل الصيدلية السيادي',
      description: 'صيدلية الرعاية الذكية وثقت صرف Atorvastatin 20mg برقم الدفعة LOT-ATR-9984B وتوقيع رقمي غير قابل للتعديل.',
      actor: {
        id: 'pharm-dr-khalid',
        name: 'د. خالد الصالح (صيدلي مسؤول)',
        role: 'pharmacy',
        portal: 'بوابة الصيدلية (Pharmacy Portal)',
      },
      systemContext: {
        nodeName: 'Pharmacy Dispense Ledger',
        action: 'LEDGER_BLOCK_COMMITTED',
        latencyMs: 11,
        policyApplied: 'POL-PHARMACY-CANONICAL-OWNERSHIP',
        status: 'COMMITTED_200',
      },
      provenance: 'Sovereign Cryptographic Ledger Node',
    },
    {
      id: 'act-dev-008',
      timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      category: 'DEVICE_DIAGNOSTIC',
      level: 'WARNING',
      title: 'تنبيه انخفاض مستوى البطارية لجهاز الضغط',
      description: 'انخفض شحن بطارية جهاز Omron TeleHealth إلى 18% مع استمرار دقة وحدة القياس الرقمية.',
      device: {
        id: 'dev-bp-202',
        model: 'Omron TeleHealth Bluetooth Cuff Platinum',
        category: 'BLOOD_PRESSURE_CUFF',
        serialNumber: 'SN-BP-11883-M',
        batteryPercentage: 18,
        firmware: 'v2.1.0',
        latestReading: 'Battery Level Alert: 18% Remaining',
      },
      diagnosticAlert: {
        alertType: 'DEVICE_LOW_BATTERY_WARNING',
        severity: 'MEDIUM',
        parameter: 'Battery Percentage',
        threshold: '< 20%',
        actualValue: '18%',
        recommendedAction: 'تذكير المريض أو مقدم الرعاية بشحن الجهاز قبل الجلسة التشخيصية القادمة لضمان سلامة الإرسال.',
        acknowledged: false,
      },
      provenance: 'IoMT Telemetry Device Heartbeat Channel',
    },
  ];

  public getLogs(): ActivityLogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: (logs: ActivityLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const copy = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error notifying activity log listener:', err);
      }
    });
  }

  public addLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): ActivityLogEntry {
    const newEntry: ActivityLogEntry = {
      id: entry.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      category: entry.category,
      level: entry.level,
      title: entry.title,
      description: entry.description,
      actor: entry.actor,
      device: entry.device,
      systemContext: entry.systemContext,
      diagnosticAlert: entry.diagnosticAlert,
      provenance: entry.provenance || 'Lifex-AI Autonomous Event Bus',
    };

    this.logs.unshift(newEntry);
    if (this.logs.length > 250) {
      this.logs = this.logs.slice(0, 250);
    }
    this.notify();
    return newEntry;
  }

  public acknowledgeAlert(id: string): boolean {
    const entry = this.logs.find((l) => l.id === id);
    if (entry && entry.diagnosticAlert) {
      entry.diagnosticAlert.acknowledged = true;
      this.notify();
      return true;
    }
    return false;
  }

  public triggerSimulatedDeviceAlert(): ActivityLogEntry {
    const templates = [
      {
        title: 'تنبيه نبض قلبي متسارع (Tachycardia Alert) — CardioSense ECG',
        description: 'تم رصد تسارع مفاجئ في ضربات القلب إلى 116 bpm أثناء سكون المريض مع استقرار شكل موجة P-QRS.',
        device: {
          id: 'dev-ecg-991',
          model: 'CardioSense Ultra 12-Lead Continuous ECG',
          category: 'ECG_MONITOR',
          serialNumber: 'SN-ECG-77492-X',
          batteryPercentage: 88,
          firmware: 'v3.2.1-sec-verified',
          latestReading: '116 bpm (Sinus Tachycardia - Transient)',
        },
        diagnosticAlert: {
          alertType: 'ELEVATED_HEART_RATE_ANOMALY',
          severity: 'HIGH' as const,
          parameter: 'Resting Heart Rate',
          threshold: '> 100 bpm at rest',
          actualValue: '116 bpm',
          recommendedAction: 'توجيه المريض للاستراحة والتنفس العميق، وإرسال تنبيه آلي لمنصة الاستشارة السريرية.',
          acknowledged: false,
        },
        provenance: 'CardioSense Telemetry Stream -> Edge Wavelet Signal Analyzer',
      },
      {
        title: 'تنبيه تقلب مؤشر الأكسجين في الدم (SpO2 Desaturation) — مجس النبض المحمول',
        description: 'هبوط عابر لمستوى تشبع الأكسجين إلى 92% لمدة 45 ثانية متواصلة.',
        device: {
          id: 'dev-spo2-881',
          model: 'PulseOx Pro Continuous Oximeter',
          category: 'PULSE_OXIMETER',
          serialNumber: 'SN-OXI-33109-B',
          batteryPercentage: 74,
          firmware: 'v1.8.4',
          latestReading: '92% SpO2 (PR: 80 bpm)',
        },
        diagnosticAlert: {
          alertType: 'SPO2_MILD_DESATURATION',
          severity: 'MEDIUM' as const,
          parameter: 'Oxygen Saturation SpO2',
          threshold: '< 94%',
          actualValue: '92%',
          recommendedAction: 'التحقق من تثبيت المجس على الإصبع وإعادة قياس التنفس مع الحفاظ على وضعية الجلوس المستقيمة.',
          acknowledged: false,
        },
        provenance: 'BLE Secure GATT -> Clinical Event Bus',
      },
      {
        title: 'تنبيه ارتفاع تركيز السكر فوق المدى المستهدف — Dexcom CGM',
        description: 'ارتفاع مستوى السكر في الدم إلى 215 mg/dL بعد وجبة الغداء مع سهم صعود مائل.',
        device: {
          id: 'dev-cgm-404',
          model: 'Dexcom Continuous Glucose Biosensor G7',
          category: 'CONTINUOUS_GLUCOSE',
          serialNumber: 'SN-CGM-99120-S',
          batteryPercentage: 96,
          firmware: 'v4.0.2',
          latestReading: '215 mg/dL (Rising trend ↗)',
        },
        diagnosticAlert: {
          alertType: 'HYPERGLYCEMIA_POSTPRANDIAL',
          severity: 'MEDIUM' as const,
          parameter: 'Blood Glucose',
          threshold: '> 180 mg/dL postprandial',
          actualValue: '215 mg/dL',
          recommendedAction: 'مراجعة موعد جرعة الإنسولين/الدواء الموصوفة وتناول كميات وفيرة من الماء وتفادي السكريات البسيطة.',
          acknowledged: false,
        },
        provenance: 'Continuous CGM Transmitter -> IoMT MQTT Broker',
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    return this.addLog({
      category: 'DEVICE_DIAGNOSTIC',
      level: pick.diagnosticAlert.severity === 'HIGH' ? 'WARNING' : 'INFO',
      title: pick.title,
      description: pick.description,
      device: pick.device,
      diagnosticAlert: pick.diagnosticAlert,
      provenance: pick.provenance,
    });
  }

  public triggerSimulatedPortalAccess(): ActivityLogEntry {
    const templates = [
      {
        title: 'وصول مريض إلى تقرير الفحوصات المخبرية',
        description: 'المريض أحمد فهد قام بعرض تقرير تحليل الدهون التراكمي من مختبرات الأمل عبر البوابة الذاتية.',
        actor: {
          id: 'pat-main',
          name: 'أحمد فهد المنصوري',
          role: 'patient',
          ip: '176.28.45.12',
          portal: 'بوابة المريض (Patient Portal)',
        },
        systemContext: {
          nodeName: 'Damascus Clinical Gateway',
          action: 'PROJECTION_VIEW',
          latencyMs: 12,
          policyApplied: 'POL-PATIENT-OWNERSHIP-SOVEREIGN',
          status: 'SUCCESS_200',
        },
      },
      {
        title: 'فحص وصفات طبية عبر بوابة الصيدلية',
        description: 'الصيدلي المناوب قام بفحص سلامة التفاعل الدوائي لوصفة Metformin XR قبل صرفها.',
        actor: {
          id: 'pharm-dr-khalid',
          name: 'د. خالد الصالح',
          role: 'pharmacy',
          ip: '185.112.4.9',
          portal: 'بوابة الصيدلية (Pharmacy Portal)',
        },
        systemContext: {
          nodeName: 'Pharmacy Dispense Ledger',
          action: 'DRUG_INTERACTION_CHECK',
          latencyMs: 16,
          policyApplied: 'POL-PHARMACY-DISPENSE-INTEGRITY',
          status: 'SUCCESS_200',
        },
      },
      {
        title: 'تحديث حالة سرير العناية المركزة — بوابة المستشفى',
        description: 'قسم الطوارئ في مستشفى الحياة قام بتسجيل إشغال سرير في وحدة رعاية القلب التخصصية CCU.',
        actor: {
          id: 'hosp-triage-officer',
          name: 'مكتب تنسيق الطوارئ والأسرة',
          role: 'hospital',
          ip: '192.168.10.15',
          portal: 'بوابة المستشفيات (Hospital Portal)',
        },
        systemContext: {
          nodeName: 'Hospital Emergency Node',
          action: 'BED_CAPACITY_UPDATE',
          latencyMs: 9,
          policyApplied: 'POL-HOSPITAL-EMS-COORDINATION',
          status: 'COMMITTED_200',
        },
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    return this.addLog({
      category: 'PORTAL_ACCESS',
      level: 'SUCCESS',
      title: pick.title,
      description: pick.description,
      actor: pick.actor,
      systemContext: pick.systemContext,
      provenance: 'Lifex Secure Identity Broker -> Session Context Evaluator',
    });
  }

  public triggerSimulatedSystemEvent(): ActivityLogEntry {
    const templates = [
      {
        title: 'فحص النبض الدوري لعقدة IoMT Telemetry MQTT Broker',
        description: 'معدل المعالجة 4,820 رسالة/ثانية، زمن الاستجابة 8ms، عدم وجود أي طوابير متراكمة.',
        systemContext: {
          nodeName: 'IoMT Telemetry MQTT Broker',
          action: 'HEARTBEAT_HEALTH_PROBE',
          latencyMs: 8,
          policyApplied: 'POL-SYSTEM-TELEMETRY-SLA',
          status: 'HEALTHY_200',
        },
      },
      {
        title: 'عزل وفحص حزمة الذكاء الاصطناعي — AI Knowledge Sandbox',
        description: 'تم التحقق من عزل بيئة استدلال النماذج الطبية وعدم امتلاكها صلاحية كتابة مباشرة في قاعدة السجلات.',
        systemContext: {
          nodeName: 'AI Assistance Knowledge Sandbox',
          action: 'SANDBOX_ISOLATION_AUDIT',
          latencyMs: 110,
          policyApplied: 'POL-AI-NON-SOURCE-OF-TRUTH',
          status: 'ENFORCED_ISOLATED',
        },
      },
      {
        title: 'تدقيق شهادات الأمان والتشفير E2EE لقنوات الاتصال',
        description: 'تم التحقق من تشفير TLS 1.3 ومفاتيح التوقيع الرقمي لكافة العقد الخمس النشطة بنسبة تطابق 100%.',
        systemContext: {
          nodeName: 'Damascus Clinical Gateway',
          action: 'CRYPTOGRAPHIC_AUDIT',
          latencyMs: 15,
          policyApplied: 'POL-E2EE-ZERO-TRUST-VERIFIED',
          status: 'COMPLIANT_100',
        },
      },
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    return this.addLog({
      category: 'SYSTEM_EVENT',
      level: 'INFO',
      title: pick.title,
      description: pick.description,
      systemContext: pick.systemContext,
      provenance: 'Lifex Sovereign Infrastructure Orchestrator',
    });
  }

  public startSimulation(intervalMs: number = 9000): void {
    if (this.simulationTimer) return;
    this.simulationTimer = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.45) {
        this.triggerSimulatedPortalAccess();
      } else if (rand < 0.8) {
        this.triggerSimulatedSystemEvent();
      } else {
        this.triggerSimulatedDeviceAlert();
      }
    }, intervalMs);
  }

  public stopSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public isSimulating(): boolean {
    return this.simulationTimer !== null;
  }
}

export const activityLogService = new ActivityLogService();
