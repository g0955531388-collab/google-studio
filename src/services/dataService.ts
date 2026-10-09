import {
  VitalReading,
  VitalTrendDataPoint,
  MedicationItem,
  MedicationScheduleEntry,
  MedicationLogEntry,
  MedicationAdherenceTrendPoint,
  MedicationReminderSettings,
  AllergyItem,
  ChronicCondition,
  HealthTimelineEvent,
  ClinicalEncounter,
  LabResultRecord,
  PharmacyDispenseRecord,
  MedicalDeviceInstance,
  EmergencyIncident,
  SearchResultItem,
  TelemedicineDoctor,
  TelemedicineConsultationRecord,
  HealthGoal,
  HealthGoalCategory,
  HealthGoalFrequency,
  GoalProgressEntry,
  HealthGoalStats,
  CreateGoalInput,
  PatientSymptomLog,
  CreateSymptomInput,
  SymptomSeverity,
  SymptomStatus,
  SmartAlert,
  SmartAlertType,
  SmartAlertSeverity,
  SmartAlertStats,
  MedicationRefillCalculation,
  RefillUrgencyLevel,
  RefillSummaryStats,
  PatientNotificationSettings,
  ComprehensiveMedicalHistory,
  PhysicianSlot,
  PatientAppointment,
  InsurancePolicyRecord,
  InsuranceEligibilityVerificationRequest,
  InsuranceEligibilityVerificationResult,
  AutoCompletedBillingClaim,
} from '../types';
import { auditService } from './auditService';
import { consentService } from './consentService';

class DataService {
  // -------------------------------------------------------------------------
  // PATIENT PROJECTIONS (Note: Projections are read-only views, not canonical records)
  // -------------------------------------------------------------------------
  private patientVitals: VitalReading[] = [
    {
      id: 'vit-1',
      timestamp: '2026-10-08T08:15:00Z',
      type: 'HEART_RATE',
      value: '72',
      unit: 'bpm',
      status: 'NORMAL',
      deviceId: 'dev-ecg-991',
      isVerifiedByClinician: true,
    },
    {
      id: 'vit-2',
      timestamp: '2026-10-08T08:15:00Z',
      type: 'BLOOD_PRESSURE',
      value: '122/80',
      unit: 'mmHg',
      status: 'NORMAL',
      deviceId: 'dev-bp-202',
      isVerifiedByClinician: true,
    },
    {
      id: 'vit-3',
      timestamp: '2026-10-08T07:45:00Z',
      type: 'SPO2',
      value: '98',
      unit: '%',
      status: 'NORMAL',
      deviceId: 'dev-ox-303',
      isVerifiedByClinician: false,
    },
    {
      id: 'vit-4',
      timestamp: '2026-10-08T06:30:00Z',
      type: 'GLUCOSE',
      value: '108',
      unit: 'mg/dL',
      status: 'NORMAL',
      deviceId: 'dev-cgm-404',
      isVerifiedByClinician: true,
    },
  ];

  private patientVitalTrends: VitalTrendDataPoint[] = [
    { timestamp: '2026-10-07T00:00:00Z', label: '00:00', heartRate: 64, systolicBP: 118, diastolicBP: 76, spO2: 99, glucose: 95, temperature: 36.6 },
    { timestamp: '2026-10-07T04:00:00Z', label: '04:00', heartRate: 61, systolicBP: 115, diastolicBP: 74, spO2: 98, glucose: 92, temperature: 36.5 },
    { timestamp: '2026-10-07T08:00:00Z', label: '08:00', heartRate: 75, systolicBP: 124, diastolicBP: 82, spO2: 98, glucose: 114, temperature: 36.7 },
    { timestamp: '2026-10-07T12:00:00Z', label: '12:00', heartRate: 78, systolicBP: 126, diastolicBP: 81, spO2: 97, glucose: 128, temperature: 36.8 },
    { timestamp: '2026-10-07T16:00:00Z', label: '16:00', heartRate: 73, systolicBP: 121, diastolicBP: 79, spO2: 98, glucose: 105, temperature: 36.7 },
    { timestamp: '2026-10-07T20:00:00Z', label: '20:00', heartRate: 69, systolicBP: 119, diastolicBP: 77, spO2: 99, glucose: 110, temperature: 36.6 },
    { timestamp: '2026-10-08T00:00:00Z', label: '00:00', heartRate: 63, systolicBP: 116, diastolicBP: 75, spO2: 99, glucose: 96, temperature: 36.5 },
    { timestamp: '2026-10-08T04:00:00Z', label: '04:00', heartRate: 60, systolicBP: 114, diastolicBP: 74, spO2: 98, glucose: 93, temperature: 36.5 },
    { timestamp: '2026-10-08T08:00:00Z', label: '08:00', heartRate: 72, systolicBP: 122, diastolicBP: 80, spO2: 98, glucose: 108, temperature: 36.7 },
  ];

  private patientMedications: MedicationItem[] = [
    {
      id: 'med-1',
      prescriptionId: 'rx-2026-881',
      name: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      frequency: 'مرة واحدة مساءً',
      status: 'ACTIVE',
      prescribedByDoctor: 'د. سارة المنصور',
      prescribedAt: '2026-08-10',
      dispensedByPharmacy: 'صيدلية الرعاية المركزية',
      dispensedAt: '2026-08-11',
      adherencePercentage: 94,
    },
    {
      id: 'med-2',
      prescriptionId: 'rx-2026-904',
      name: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      frequency: 'مع وجبة العشاء',
      status: 'ACTIVE',
      prescribedByDoctor: 'د. طارق العلي',
      prescribedAt: '2026-07-01',
      dispensedByPharmacy: 'صيدلية الحياة',
      dispensedAt: '2026-07-02',
      adherencePercentage: 88,
    },
  ];

  private patientSchedules: MedicationScheduleEntry[] = [
    {
      id: 'sched-1',
      patientId: 'pat-main',
      medicationId: 'med-2',
      name: 'Metformin XR (ميتفورمين)',
      dosage: '500mg',
      timeSlot: '08:30',
      period: 'MORNING',
      instructions: 'تناول القرص مباشرة مع وجبة الإفطار لتجنب اضطراب المعدة',
      mealContext: 'WITH_MEAL',
      reminderEnabled: true,
      reminderAdvanceMinutes: 10,
      daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      category: 'PRESCRIPTION',
      currentPillCount: 22,
      totalPillCapacity: 60,
      dosageQuantityPerIntake: 1,
      dosesPerDay: 1,
      refillThresholdDays: 7,
      refillThresholdPills: 7,
      rxNumber: 'RX-948210',
      pharmacyName: 'صيدلية المستشفى الجامعي التخصصي',
      pharmacyPhone: '+966 11 467 0000',
      lastRefillDate: '2026-09-18',
      refillOrderPending: false,
    },
    {
      id: 'sched-2',
      patientId: 'pat-main',
      medicationId: 'med-supp-1',
      name: 'Omega-3 Fish Oil (أوميغا 3)',
      dosage: '1000mg',
      timeSlot: '13:30',
      period: 'AFTERNOON',
      instructions: 'تناول كبسولة واحدة بعد وجبة الغداء مع كوب ماء وفير',
      mealContext: 'AFTER_MEAL',
      reminderEnabled: true,
      reminderAdvanceMinutes: 5,
      daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      category: 'SUPPLEMENT',
      currentPillCount: 16,
      totalPillCapacity: 30,
      dosageQuantityPerIntake: 1,
      dosesPerDay: 1,
      refillThresholdDays: 5,
      refillThresholdPills: 5,
      rxNumber: 'SUPP-3310',
      pharmacyName: 'صيدلية النهضة الطبية',
      pharmacyPhone: '+966 11 456 7890',
      lastRefillDate: '2026-09-25',
      refillOrderPending: false,
    },
    {
      id: 'sched-3',
      patientId: 'pat-main',
      medicationId: 'med-1',
      name: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      timeSlot: '21:00',
      period: 'EVENING',
      instructions: 'تناول القرص في المساء قبل النوم للحفاظ على توازن الدهون',
      mealContext: 'ANY',
      reminderEnabled: true,
      reminderAdvanceMinutes: 15,
      daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      category: 'PRESCRIPTION',
      currentPillCount: 4,
      totalPillCapacity: 30,
      dosageQuantityPerIntake: 1,
      dosesPerDay: 1,
      refillThresholdDays: 5,
      refillThresholdPills: 5,
      rxNumber: 'RX-884120',
      pharmacyName: 'صيدلية المستشفى الجامعي التخصصي',
      pharmacyPhone: '+966 11 467 0000',
      lastRefillDate: '2026-09-08',
      refillOrderPending: false,
    },
  ];

  private patientMedicationLogs: MedicationLogEntry[] = [
    {
      id: 'log-1',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-08T08:35:00Z',
      takenDoseTime: '08:35',
      status: 'TAKEN',
      notes: 'تم أخذها بعد الإفطار مع كوب ماء',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-1',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-07T08:28:00Z',
      takenDoseTime: '08:28',
      status: 'TAKEN',
      notes: 'تم التناول بنجاح بعد الفطور',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-2',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-07T13:04:00Z',
      takenDoseTime: '13:04',
      status: 'TAKEN',
      notes: 'قياس ضغط الدم قبل الجرعة: 122/78 mmHg',
      mealContext: 'AFTER_MEAL',
    },
    {
      id: 'log-prev-3',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-07T21:02:00Z',
      takenDoseTime: '21:02',
      status: 'TAKEN',
      notes: 'تم التناول قبل النوم',
      mealContext: 'ANY',
    },
    {
      id: 'log-prev-4',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-06T08:32:00Z',
      takenDoseTime: '08:32',
      status: 'TAKEN',
      notes: 'تناول منتظم',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-5',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-06T13:10:00Z',
      takenDoseTime: '13:10',
      status: 'TAKEN',
      notes: 'تم التناول في موعد الغداء',
      mealContext: 'AFTER_MEAL',
    },
    {
      id: 'log-prev-6',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-06T21:15:00Z',
      takenDoseTime: '21:15',
      status: 'TAKEN',
      notes: 'تم التناول في المساء',
      mealContext: 'ANY',
    },
    {
      id: 'log-prev-7',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-05T08:40:00Z',
      takenDoseTime: '08:40',
      status: 'TAKEN',
      notes: 'تأخير بسيط لمدة 10 دقائق',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-8',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-05T13:00:00Z',
      status: 'SKIPPED',
      notes: 'تم تخطي الجرعة بتوجيه الطبيب للصيام وإجراء الفحوصات المخبرية الدورية',
      mealContext: 'BEFORE_MEAL',
    },
    {
      id: 'log-prev-9',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-05T21:05:00Z',
      takenDoseTime: '21:05',
      status: 'TAKEN',
      notes: 'تم التناول ليلاً',
      mealContext: 'ANY',
    },
    {
      id: 'log-prev-10',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-04T08:25:00Z',
      takenDoseTime: '08:25',
      status: 'TAKEN',
      notes: 'تم التناول مع الإفطار',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-11',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-04T13:00:00Z',
      takenDoseTime: '13:00',
      status: 'TAKEN',
      notes: 'ضغط الدم مستقر 120/80',
      mealContext: 'AFTER_MEAL',
    },
    {
      id: 'log-prev-12',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-04T21:00:00Z',
      takenDoseTime: '21:00',
      status: 'TAKEN',
      notes: 'تم التناول بالموعد المحدد',
      mealContext: 'ANY',
    },
    {
      id: 'log-prev-13',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-03T08:30:00Z',
      takenDoseTime: '08:30',
      status: 'TAKEN',
      notes: 'تم التناول بنجاح',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-14',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-03T13:15:00Z',
      takenDoseTime: '13:15',
      status: 'TAKEN',
      notes: 'جرعة منتظمة',
      mealContext: 'AFTER_MEAL',
    },
    {
      id: 'log-prev-15',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-03T21:30:00Z',
      takenDoseTime: '21:30',
      status: 'TAKEN',
      notes: 'تم التناول قبل النوم',
      mealContext: 'ANY',
    },
    {
      id: 'log-prev-16',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-1',
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      scheduledTime: '08:30',
      loggedAt: '2026-10-02T08:45:00Z',
      takenDoseTime: '08:45',
      status: 'TAKEN',
      notes: 'تناول مع وجبة الفطور',
      mealContext: 'WITH_MEAL',
    },
    {
      id: 'log-prev-17',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-2',
      medicationName: 'Lisinopril (ليسينوبريل)',
      dosage: '10mg',
      scheduledTime: '13:00',
      loggedAt: '2026-10-02T13:00:00Z',
      takenDoseTime: '13:00',
      status: 'TAKEN',
      notes: 'جرعة الظهر منتظمة',
      mealContext: 'AFTER_MEAL',
    },
    {
      id: 'log-prev-18',
      patientId: 'pat-main',
      scheduleEntryId: 'sched-3',
      medicationName: 'Atorvastatin (أستورفاستاتين)',
      dosage: '20mg',
      scheduledTime: '21:00',
      loggedAt: '2026-10-02T21:10:00Z',
      takenDoseTime: '21:10',
      status: 'TAKEN',
      notes: 'تناول ليلي منتظم',
      mealContext: 'ANY',
    },
  ];

  private reminderSettings: MedicationReminderSettings = {
    browserNotifications: true,
    audioAlerts: true,
    advanceMinutes: 10,
    quietHoursEnabled: false,
    quietHoursStart: '23:00',
    quietHoursEnd: '06:00',
  };

  private patientAllergies: AllergyItem[] = [
    {
      id: 'alg-1',
      allergen: 'Penicillin (بنسلين ومشتقاته)',
      severity: 'SEVERE',
      reaction: 'طفح جلدي حاد وضيق تنفسي',
      diagnosedDate: '2022-04-15',
    },
    {
      id: 'alg-2',
      allergen: 'Sulfa Drugs (مركبات السلفا)',
      severity: 'MODERATE',
      reaction: 'حكة والتهاب جلدي',
      diagnosedDate: '2024-01-20',
    },
  ];

  private patientConditions: ChronicCondition[] = [
    {
      id: 'cnd-1',
      name: 'Essential Hypertension (ارتفاع ضغط الدم الأولي)',
      icdCode: 'I10',
      status: 'MANAGED',
      diagnosedYear: '2021',
    },
    {
      id: 'cnd-2',
      name: 'Type 2 Diabetes Mellitus (سكري النوع الثاني المضبوط)',
      icdCode: 'E11.9',
      status: 'MANAGED',
      diagnosedYear: '2023',
    },
  ];

  private patientTimelineEvents: HealthTimelineEvent[] = [
    {
      id: 'tml-1',
      timestamp: '2026-10-05T10:30:00Z',
      type: 'ENCOUNTER',
      title: 'استشارة سريرية دورية لمتابعة القلب',
      summary: 'مراجعة قراءات الضغط، تخطيط القلب طبيعي، استمرار نفس الخطة العلاجية.',
      providerName: 'د. سارة المنصور (استشاري قلب)',
      location: 'مركز الحياة للقلب والأوعية',
      sourceDomain: 'CLINIC',
      isCanonicalRecordOriginal: false,
    },
    {
      id: 'tml-2',
      timestamp: '2026-09-28T14:00:00Z',
      type: 'LAB_RESULT',
      title: 'فحص الدهون والكوليسترول الشامل (Lipid Panel)',
      summary: 'الكوليسترول الكلي: 178 mg/dL (طبيعي) - ثلاثي الغليسريد: 135 mg/dL (طبيعي).',
      providerName: 'مختبرات الأمل التشخيصية',
      location: 'الفرع المركزي',
      sourceDomain: 'LAB',
      isCanonicalRecordOriginal: false,
    },
    {
      id: 'tml-3',
      timestamp: '2026-08-11T16:20:00Z',
      type: 'PRESCRIPTION',
      title: 'صرف وصفة Atorvastatin 20mg شهرياً',
      summary: 'تم التحقق من عدم وجود تعارض دوائي وتسليم العبوة للمريض برقم دفعة معتمد.',
      providerName: 'صيدلية الرعاية المركزية',
      location: 'قسم الصرف الخارجي',
      sourceDomain: 'PHARMACY',
      isCanonicalRecordOriginal: false,
    },
  ];

  // -------------------------------------------------------------------------
  // DOCTOR ENCOUNTERS (Canonical Doctor Domain)
  // -------------------------------------------------------------------------
  private encounters: ClinicalEncounter[] = [
    {
      id: 'enc-2026-01',
      patientId: 'pat-main',
      patientName: 'أحمد فهد المنصوري',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      date: '2026-10-05',
      reasonForVisit: 'فحص دوري وقائي وضبط جرعات العلاج',
      subjectiveAssessment: 'المريض يشعر بارتياح عام، لا توجد شكوى من خفقان أو ضيق تنفس أثناء المشي.',
      objectiveFindings: 'ضغط الدم 122/80، النبض 72، أصوات القلب منتظمة دون نفخات غير طبيعية.',
      assessmentPlan: 'استمرار Atorvastatin 20mg يومياً، فحص دهون بعد 6 أشهر، التوصية بنشاط رياضي معتدل.',
      consentToken: 'cst-01',
      status: 'COMPLETED',
    },
    {
      id: 'enc-2026-02',
      patientId: 'pat-9921',
      patientName: 'مريم سعيد العتيبي',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      date: '2026-10-08',
      reasonForVisit: 'استشارة قلبية طارئة بعد قراءة نبض مرتفع',
      subjectiveAssessment: 'تسارع نبض مفاجئ بعد مجهود بدني صباحي.',
      objectiveFindings: 'تخطيط القلب ECG يظهر تسرع جيبي منتظم 110 نبضة/دقيقة، لا علامات نقص تروية.',
      assessmentPlan: 'إجراء صدى قلب (Echocardiogram) ومراقبة هولتر 24 ساعة.',
      consentToken: 'cst-02-urgent',
      status: 'IN_PROGRESS',
    },
  ];

  // -------------------------------------------------------------------------
  // LABORATORY RECORDS (Canonical Laboratory Domain)
  // -------------------------------------------------------------------------
  private labResults: LabResultRecord[] = [
    {
      id: 'lab-res-881',
      testCode: 'LIPID-FULL',
      testName: 'Lipid Profile Comprehensive (تحليل دهون الدم الكامل)',
      patientId: 'pat-main',
      orderedByDoctorId: 'doc-dr-sarah',
      specimenType: 'Serum / Venous Blood',
      collectedAt: '2026-09-28T07:30:00Z',
      reportedAt: '2026-09-28T13:45:00Z',
      value: '178',
      unit: 'mg/dL',
      referenceRange: '< 200 mg/dL',
      status: 'NORMAL',
      canonicalLabOwner: 'مختبرات الأمل التشخيصية المركزية (ISO 15189 معتمد)',
      hl7FhirIdentifier: 'Observation/fhir-lab-881-lipid',
    },
    {
      id: 'lab-res-882',
      testCode: 'HBA1C',
      testName: 'Hemoglobin A1c (السكر التراكمي في الدم)',
      patientId: 'pat-main',
      orderedByDoctorId: 'doc-dr-sarah',
      specimenType: 'Whole Blood EDTA',
      collectedAt: '2026-09-28T07:30:00Z',
      reportedAt: '2026-09-28T12:10:00Z',
      value: '5.8',
      unit: '%',
      referenceRange: '4.0 - 5.6 % (طبيعي) | 5.7 - 6.4 % (ما قبل السكري)',
      status: 'NORMAL',
      canonicalLabOwner: 'مختبرات الأمل التشخيصية المركزية (ISO 15189 معتمد)',
      hl7FhirIdentifier: 'Observation/fhir-lab-882-hba1c',
    },
    {
      id: 'lab-res-883',
      testCode: 'K-SERUM',
      testName: 'Serum Potassium (بوتاسيوم المصل)',
      patientId: 'pat-main',
      orderedByDoctorId: 'doc-dr-sarah',
      specimenType: 'Serum Venipuncture',
      collectedAt: '2026-09-28T07:30:00Z',
      reportedAt: '2026-09-28T10:30:00Z',
      value: '4.3',
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.1 mmol/L',
      status: 'NORMAL',
      canonicalLabOwner: 'مختبرات الأمل التشخيصية المركزية (ISO 15189 معتمد)',
      hl7FhirIdentifier: 'Observation/fhir-lab-883-potassium',
    },
  ];

  // -------------------------------------------------------------------------
  // PHARMACY RECORDS (Canonical Pharmacy Domain)
  // Strict rule: Prescription ≠ Dispense ≠ Medication Taken
  // -------------------------------------------------------------------------
  private pharmacyDispenses: PharmacyDispenseRecord[] = [
    {
      id: 'dsp-991',
      prescriptionId: 'rx-2026-881',
      patientId: 'pat-main',
      medicationName: 'Atorvastatin 20mg Film-Coated Tablets',
      batchLotNumber: 'LOT-ATR-9984B',
      expiryDate: '2028-06-30',
      quantityDispensed: 30,
      dispensingPharmacistId: 'pharm-dr-khalid',
      dispensedAt: '2026-08-11T16:20:00Z',
      isRecalled: false,
      canonicalPharmacyOwner: 'صيدلية الرعاية المركزية (ترخيص PH-9932)',
    },
    {
      id: 'dsp-992',
      prescriptionId: 'rx-2026-904',
      patientId: 'pat-main',
      medicationName: 'Metformin Hydrochloride XR 500mg',
      batchLotNumber: 'LOT-MTF-3321A',
      expiryDate: '2027-11-30',
      quantityDispensed: 60,
      dispensingPharmacistId: 'pharm-dr-khalid',
      dispensedAt: '2026-07-02T11:15:00Z',
      isRecalled: false,
      canonicalPharmacyOwner: 'صيدلية الرعاية المركزية (ترخيص PH-9932)',
    },
  ];

  // -------------------------------------------------------------------------
  // MEDICAL DEVICES (Device Readings ≠ Clinical Diagnosis)
  // -------------------------------------------------------------------------
  private medicalDevices: MedicalDeviceInstance[] = [
    {
      id: 'dev-ecg-991',
      serialNumber: 'SN-ECG-77492-X',
      deviceModel: 'CardioSense Ultra 12-Lead Continuous ECG',
      deviceCategory: 'ECG_MONITOR',
      connectionStatus: 'ONLINE',
      batteryPercentage: 92,
      firmwareVersion: 'v3.2.1-sec-verified',
      lastTelemetryAt: '2026-10-08T09:00:00Z',
      assignedPatientId: 'pat-main',
      latestReading: 'Normal Sinus Rhythm (72 bpm) — Lead II stable',
    },
    {
      id: 'dev-bp-202',
      serialNumber: 'SN-BP-11883-M',
      deviceModel: 'Omron TeleHealth Bluetooth Cuff',
      deviceCategory: 'BLOOD_PRESSURE_CUFF',
      connectionStatus: 'ONLINE',
      batteryPercentage: 85,
      firmwareVersion: 'v2.1.0',
      lastTelemetryAt: '2026-10-08T08:15:00Z',
      assignedPatientId: 'pat-main',
      latestReading: '122/80 mmHg (Mean Arterial: 94)',
    },
    {
      id: 'dev-cgm-404',
      serialNumber: 'SN-CGM-99120-S',
      deviceModel: 'Dexcom Continuous Glucose Biosensor',
      deviceCategory: 'CONTINUOUS_GLUCOSE',
      connectionStatus: 'ONLINE',
      batteryPercentage: 98,
      firmwareVersion: 'v4.0.2',
      lastTelemetryAt: '2026-10-08T09:02:00Z',
      assignedPatientId: 'pat-main',
      latestReading: '108 mg/dL (Steady trend →)',
    },
  ];

  // -------------------------------------------------------------------------
  // EMERGENCY INCIDENTS (Emergency Coordination ≠ Medical Treatment)
  // -------------------------------------------------------------------------
  private emergencyIncidents: EmergencyIncident[] = [
    {
      id: 'emg-inc-101',
      patientId: 'pat-main',
      patientName: 'أحمد فهد المنصوري',
      status: 'HOSPITAL_COORDINATION',
      severity: 'URGENT_YELLOW',
      initiatedAt: '2026-10-08T08:50:00Z',
      locationCoordinates: {
        lat: 33.5138,
        lng: 36.2765,
        address: 'دمشق — شارع الثورة، بالقرب من المركز الصحي التخصصي',
      },
      assignedHospitalId: 'hosp-al-hayat',
      assignedHospitalName: 'مستشفى الحياة التخصصي العام',
      ambulanceUnitId: 'AMB-UNIT-04',
      etaMinutes: 4,
      vitalsAtDispatch: 'HR: 104 bpm | BP: 135/88 | SpO2: 96%',
    },
  ];

  // -------------------------------------------------------------------------
  // GLOBAL SEARCH CATALOG (Scoped & Authorized Index)
  // -------------------------------------------------------------------------
  private searchCatalog: SearchResultItem[] = [
    {
      id: 'src-1',
      category: 'DOCTOR',
      title: 'د. سارة المنصور',
      subtitle: 'استشاري أمراض القلب والأوعية الدموية والقسطرة التداخلية',
      rating: 4.9,
      location: 'دمشق — مركز الحياة للقلب',
      tags: ['قلب', 'ضغط', 'قسطرة', 'شرايين'],
      authorizedRoles: ['patient', 'doctor', 'hospital', 'nurse', 'administrator'],
    },
    {
      id: 'src-2',
      category: 'HOSPITAL',
      title: 'مستشفى الحياة التخصصي الدولي',
      subtitle: 'مركز جراحة متقدم ووحدة عناية قلبية مركزة (CCU) متصلة بالشبكة 24/7',
      location: 'دمشق — المزة',
      tags: ['طوارئ', 'عناية مركزة', 'جراحة', 'أشعة'],
      authorizedRoles: ['patient', 'doctor', 'hospital', 'nurse', 'emergency' as any, 'administrator'],
    },
    {
      id: 'src-3',
      category: 'LAB',
      title: 'مختبرات الأمل التشخيصية المركزية',
      subtitle: 'تحاليل الجينوم، البيولوجيا الجزيئية، وفحوصات الدم المعتمدة دولياً',
      location: 'دمشق وحلب واللاذقية',
      tags: ['تحاليل', 'جينات', 'دم', 'خلايا'],
      authorizedRoles: ['patient', 'doctor', 'laboratory', 'hospital', 'researcher', 'administrator'],
    },
    {
      id: 'src-4',
      category: 'PHARMACY',
      title: 'صيدلية الرعاية الذكية المركزية',
      subtitle: 'صرف الأدوية الإلكترونية وتتبع تفاعلات الحساسية وسلامة الدفعات',
      location: 'دمشق — شارع بغداد',
      tags: ['أدوية', 'صيدلية', 'توصيل', 'لقاحات'],
      authorizedRoles: ['patient', 'doctor', 'pharmacy', 'hospital', 'administrator'],
    },
    {
      id: 'src-5',
      category: 'CLINICAL_GUIDELINE',
      title: 'دليل الجمعية الأوروبية لأمراض القلب (ESC 2026 Guidelines)',
      subtitle: 'بروتوكولات إدارة ضغط الدم والوقاية من السكتات والجلطات الوعائية',
      tags: ['إرشادات', 'بحث', 'تعليم', 'بروتوكول'],
      authorizedRoles: ['doctor', 'researcher', 'educator', 'hospital', 'administrator'],
    },
  ];

  // -------------------------------------------------------------------------
  // GETTERS WITH AUDIT
  // -------------------------------------------------------------------------
  public getPatientProjections(patientId: string) {
    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح له',
      action: 'READ',
      resourceType: 'PATIENT_RECORD',
      resourceId: patientId,
      purpose: 'PATIENT_PORTAL_VIEW',
      outcome: 'SUCCESS',
      policyApplied: 'POL-SELF-PROJECTION-ALLOWED',
      provenance: 'Patient Sovereign Projection Layer',
    });

    return {
      vitals: this.patientVitals,
      medications: this.patientMedications,
      allergies: this.patientAllergies,
      conditions: this.patientConditions,
      timeline: this.patientTimelineEvents,
    };
  }

  public getPatientVitalTrends(patientId: string): VitalTrendDataPoint[] {
    return this.patientVitalTrends;
  }

  // -------------------------------------------------------------------------
  // MEDICATION SCHEDULE, ADHERENCE & REMINDERS (Patient Self-Reported Projection)
  // Constraint: Prescription ≠ Dispense ≠ Medication Taken
  // -------------------------------------------------------------------------
  public getMedicationSchedules(patientId: string): MedicationScheduleEntry[] {
    return this.patientSchedules.filter((s) => s.patientId === patientId || !s.patientId);
  }

  public saveMedicationSchedule(entry: Omit<MedicationScheduleEntry, 'id'> & { id?: string }): MedicationScheduleEntry {
    const finalEntry: MedicationScheduleEntry = {
      ...entry,
      id: entry.id || `sched-${Date.now()}`,
    };
    const existingIndex = this.patientSchedules.findIndex((s) => s.id === finalEntry.id);
    if (existingIndex >= 0) {
      this.patientSchedules[existingIndex] = finalEntry;
    } else {
      this.patientSchedules.push(finalEntry);
    }

    auditService.record({
      actorId: finalEntry.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: finalEntry.id,
      purpose: 'PATIENT_ADHERENCE_MANAGEMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-SELF-REPORTED-SCHEDULE',
      provenance: 'Medication Schedule Management Engine',
    });

    return finalEntry;
  }

  public deleteMedicationSchedule(scheduleId: string, patientId: string = 'pat-main'): boolean {
    const initialLen = this.patientSchedules.length;
    this.patientSchedules = this.patientSchedules.filter((s) => s.id !== scheduleId);
    return this.patientSchedules.length < initialLen;
  }

  public toggleMedicationReminder(scheduleId: string): boolean {
    const item = this.patientSchedules.find((s) => s.id === scheduleId);
    if (item) {
      item.reminderEnabled = !item.reminderEnabled;
      return item.reminderEnabled;
    }
    return false;
  }

  public toggleScheduleReminder(scheduleId: string, patientId?: string): boolean {
    return this.toggleMedicationReminder(scheduleId);
  }

  public getMedicationLogs(patientId: string): MedicationLogEntry[] {
    return [...this.patientMedicationLogs]
      .filter((l) => l.patientId === patientId || !l.patientId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  }

  public logMedicationDose(data: {
    patientId: string;
    scheduleEntryId?: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    status: 'TAKEN' | 'SKIPPED' | 'DELAYED';
    notes?: string;
    mealContext?: string;
    takenDoseTime?: string;
  }): MedicationLogEntry {
    const now = new Date();
    const newLog: MedicationLogEntry = {
      id: `log-${Date.now()}`,
      patientId: data.patientId,
      scheduleEntryId: data.scheduleEntryId,
      medicationName: data.medicationName,
      dosage: data.dosage,
      scheduledTime: data.scheduledTime,
      loggedAt: now.toISOString(),
      takenDoseTime: data.takenDoseTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: data.status,
      notes: data.notes,
      mealContext: data.mealContext,
    };

    // If there's already a log for today for the same scheduleEntryId, update or replace
    const todayStr = now.toISOString().slice(0, 10);
    const existingIndex = this.patientMedicationLogs.findIndex(
      (l) => l.scheduleEntryId === data.scheduleEntryId && l.loggedAt.slice(0, 10) === todayStr
    );

    if (existingIndex >= 0 && data.scheduleEntryId) {
      this.patientMedicationLogs[existingIndex] = newLog;
    } else {
      this.patientMedicationLogs.unshift(newLog);
    }

    // Refill Tracker: Automatically decrement remaining pill count when a dose is taken
    if (data.status === 'TAKEN' && data.scheduleEntryId) {
      const targetSchedule = this.patientSchedules.find((s) => s.id === data.scheduleEntryId);
      if (targetSchedule && typeof targetSchedule.currentPillCount === 'number') {
        const doseQuantity = targetSchedule.dosageQuantityPerIntake || 1;
        targetSchedule.currentPillCount = Math.max(0, targetSchedule.currentPillCount - doseQuantity);
      }
    }

    auditService.record({
      actorId: data.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: newLog.id,
      purpose: 'PATIENT_SELF_REPORTED_ADHERENCE',
      outcome: 'SUCCESS',
      policyApplied: 'POL-SELF-REPORTED-MED-LOG',
      provenance: 'Patient Adherence & Reminder Subsystem',
    });

    return newLog;
  }

  public undoMedicationLog(logId: string): boolean {
    const targetLog = this.patientMedicationLogs.find((l) => l.id === logId);
    if (targetLog && targetLog.status === 'TAKEN' && targetLog.scheduleEntryId) {
      const targetSchedule = this.patientSchedules.find((s) => s.id === targetLog.scheduleEntryId);
      if (targetSchedule && typeof targetSchedule.currentPillCount === 'number') {
        const doseQuantity = targetSchedule.dosageQuantityPerIntake || 1;
        targetSchedule.currentPillCount = (targetSchedule.currentPillCount || 0) + doseQuantity;
      }
    }
    const initialLen = this.patientMedicationLogs.length;
    this.patientMedicationLogs = this.patientMedicationLogs.filter((l) => l.id !== logId);
    return this.patientMedicationLogs.length < initialLen;
  }

  // -------------------------------------------------------------------------
  // PRESCRIPTION REFILL TRACKER & INVENTORY MANAGEMENT
  // -------------------------------------------------------------------------
  public calculateRefill(schedule: MedicationScheduleEntry): MedicationRefillCalculation {
    const currentPillCount = schedule.currentPillCount ?? 30;
    const totalPillCapacity = schedule.totalPillCapacity ?? 30;
    const dosageQuantityPerIntake = schedule.dosageQuantityPerIntake ?? 1;
    const dosesPerDay = schedule.dosesPerDay ?? 1;
    const dailyConsumption = Math.max(1, dosageQuantityPerIntake * dosesPerDay);
    const daysRemaining = Math.max(0, Math.floor(currentPillCount / dailyConsumption));
    const refillThresholdDays = schedule.refillThresholdDays ?? 5;
    const refillThresholdPills = schedule.refillThresholdPills ?? (refillThresholdDays * dailyConsumption);

    let urgency: RefillUrgencyLevel = 'ADEQUATE';
    if (currentPillCount === 0) {
      urgency = 'EMPTY';
    } else if (daysRemaining <= 3 || currentPillCount <= 3) {
      urgency = 'CRITICAL';
    } else if (daysRemaining <= refillThresholdDays || currentPillCount <= refillThresholdPills) {
      urgency = 'LOW';
    }

    const needsRefill = urgency === 'EMPTY' || urgency === 'CRITICAL' || urgency === 'LOW';
    const isOverdue = currentPillCount === 0;

    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + daysRemaining);
    const estimatedDepletionDate = depletionDate.toISOString().slice(0, 10);

    return {
      scheduleId: schedule.id,
      medicationName: schedule.name,
      dosage: schedule.dosage,
      currentPillCount,
      totalPillCapacity,
      dosageQuantityPerIntake,
      dosesPerDay,
      dailyConsumption,
      daysRemaining,
      estimatedDepletionDate,
      refillThresholdDays,
      urgency,
      needsRefill,
      isOverdue,
      rxNumber: schedule.rxNumber,
      pharmacyName: schedule.pharmacyName,
      pharmacyPhone: schedule.pharmacyPhone,
      lastRefillDate: schedule.lastRefillDate,
      refillOrderPending: !!schedule.refillOrderPending,
    };
  }

  public getRefillCalculations(patientId: string): MedicationRefillCalculation[] {
    const schedules = this.getMedicationSchedules(patientId);
    return schedules.map((s) => this.calculateRefill(s));
  }

  public getRefillSummaryStats(patientId: string): RefillSummaryStats {
    const calculations = this.getRefillCalculations(patientId);
    const totalTrackedMedications = calculations.length;
    const refillsNeededCount = calculations.filter((c) => c.needsRefill).length;
    const criticalLowCount = calculations.filter((c) => c.urgency === 'CRITICAL' || c.urgency === 'EMPTY').length;
    const totalPillsInStock = calculations.reduce((acc, c) => acc + c.currentPillCount, 0);
    const averageDaysRemaining =
      totalTrackedMedications > 0
        ? Math.round(calculations.reduce((acc, c) => acc + c.daysRemaining, 0) / totalTrackedMedications)
        : 0;
    const pendingOrdersCount = calculations.filter((c) => c.refillOrderPending).length;

    return {
      totalTrackedMedications,
      refillsNeededCount,
      criticalLowCount,
      totalPillsInStock,
      averageDaysRemaining,
      pendingOrdersCount,
    };
  }

  public requestPrescriptionRefill(scheduleId: string, patientId: string = 'pat-main'): MedicationScheduleEntry | null {
    const sched = this.patientSchedules.find((s) => s.id === scheduleId);
    if (!sched) return null;
    sched.refillOrderPending = true;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PRESCRIPTION',
      resourceId: scheduleId,
      purpose: 'PRESCRIPTION_REFILL_REQUEST',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PRESCRIPTION-REFILL-ORDER',
      provenance: 'Prescription Refill Order Dispatcher',
    });

    return sched;
  }

  public recordPrescriptionRefill(
    scheduleId: string,
    quantityAdded: number = 30,
    patientId: string = 'pat-main'
  ): MedicationScheduleEntry | null {
    const sched = this.patientSchedules.find((s) => s.id === scheduleId);
    if (!sched) return null;
    sched.currentPillCount = (sched.currentPillCount || 0) + quantityAdded;
    sched.totalPillCapacity = Math.max(sched.totalPillCapacity || 30, sched.currentPillCount);
    sched.lastRefillDate = new Date().toISOString().slice(0, 10);
    sched.refillOrderPending = false;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PRESCRIPTION',
      resourceId: scheduleId,
      purpose: 'PRESCRIPTION_REFILL_FULFILLMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PRESCRIPTION-REFILL-FULFILLMENT',
      provenance: 'Medication Inventory & Refill Manager',
    });

    return sched;
  }

  public updatePillCount(scheduleId: string, newPillCount: number, patientId: string = 'pat-main'): MedicationScheduleEntry | null {
    const sched = this.patientSchedules.find((s) => s.id === scheduleId);
    if (!sched) return null;
    sched.currentPillCount = Math.max(0, newPillCount);

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PRESCRIPTION',
      resourceId: scheduleId,
      purpose: 'MEDICATION_INVENTORY_ADJUSTMENT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-MEDICATION-INVENTORY-SELF-REPORT',
      provenance: 'Patient Sovereign Medication Inventory',
    });

    return sched;
  }

  public getMedicationReminderSettings(): MedicationReminderSettings {
    return { ...this.reminderSettings };
  }

  public updateMedicationReminderSettings(settings: Partial<MedicationReminderSettings>): MedicationReminderSettings {
    this.reminderSettings = { ...this.reminderSettings, ...settings };
    return this.reminderSettings;
  }

  // -------------------------------------------------------------------------
  // PATIENT NOTIFICATION SETTINGS (SMS, Email, In-App for Labs & Meds)
  // -------------------------------------------------------------------------
  private patientNotificationSettings: Record<string, PatientNotificationSettings> = {
    'pat-main': {
      patientId: 'pat-main',
      channels: {
        sms: {
          enabled: true,
          phoneNumber: '+966 50 123 4567',
          verified: true,
        },
        email: {
          enabled: true,
          emailAddress: 'ahmed.almansouri@example.com',
          verified: true,
        },
        inApp: {
          enabled: true,
          soundEnabled: true,
          browserPushEnabled: true,
        },
      },
      alerts: {
        criticalLabResults: {
          sms: true,
          email: true,
          inApp: true,
          urgentThresholdOnly: true,
        },
        medicationReminders: {
          sms: false,
          email: true,
          inApp: true,
          advanceMinutes: 10,
          quietHoursEnabled: true,
          quietHoursStart: '23:00',
          quietHoursEnd: '06:00',
        },
        emergencyEscalation: {
          sms: true,
          email: false,
          inApp: true,
          notifyCaregiver: true,
          caregiverPhone: '+966 55 987 6543',
        },
      },
      lastUpdated: '2026-10-08T08:00:00Z',
    },
  };

  public getPatientNotificationSettings(patientId: string = 'pat-main'): PatientNotificationSettings {
    if (!this.patientNotificationSettings[patientId]) {
      this.patientNotificationSettings[patientId] = {
        patientId,
        channels: {
          sms: { enabled: true, phoneNumber: '+966 50 123 4567', verified: true },
          email: { enabled: true, emailAddress: 'user@example.com', verified: true },
          inApp: { enabled: true, soundEnabled: true, browserPushEnabled: true },
        },
        alerts: {
          criticalLabResults: { sms: true, email: true, inApp: true, urgentThresholdOnly: true },
          medicationReminders: {
            sms: false,
            email: true,
            inApp: true,
            advanceMinutes: 10,
            quietHoursEnabled: true,
            quietHoursStart: '23:00',
            quietHoursEnd: '06:00',
          },
          emergencyEscalation: {
            sms: true,
            email: false,
            inApp: true,
            notifyCaregiver: true,
            caregiverPhone: '+966 55 987 6543',
          },
        },
        lastUpdated: new Date().toISOString(),
      };
    }
    return JSON.parse(JSON.stringify(this.patientNotificationSettings[patientId]));
  }

  public updatePatientNotificationSettings(
    patientId: string = 'pat-main',
    updated: Partial<PatientNotificationSettings>
  ): PatientNotificationSettings {
    const current = this.getPatientNotificationSettings(patientId);
    const merged: PatientNotificationSettings = {
      ...current,
      ...updated,
      channels: {
        ...current.channels,
        ...(updated.channels || {}),
        sms: { ...current.channels.sms, ...(updated.channels?.sms || {}) },
        email: { ...current.channels.email, ...(updated.channels?.email || {}) },
        inApp: { ...current.channels.inApp, ...(updated.channels?.inApp || {}) },
      },
      alerts: {
        ...current.alerts,
        ...(updated.alerts || {}),
        criticalLabResults: {
          ...current.alerts.criticalLabResults,
          ...(updated.alerts?.criticalLabResults || {}),
        },
        medicationReminders: {
          ...current.alerts.medicationReminders,
          ...(updated.alerts?.medicationReminders || {}),
        },
        emergencyEscalation: {
          ...current.alerts.emergencyEscalation,
          ...(updated.alerts?.emergencyEscalation || {}),
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    this.patientNotificationSettings[patientId] = merged;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: `notif-prefs-${patientId}`,
      purpose: 'PATIENT_COMMUNICATION_PREFERENCES',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-NOTIFICATION-PREFERENCES',
      provenance: 'Patient Sovereign Notification Preferences Dispatcher',
    });

    return merged;
  }

  public sendTestNotification(
    patientId: string = 'pat-main',
    channel: 'sms' | 'email' | 'inApp',
    type: 'criticalLabResults' | 'medicationReminders'
  ): { success: boolean; message: string; timestamp: string } {
    const prefs = this.getPatientNotificationSettings(patientId);
    const timestamp = new Date().toISOString();

    let target = '';
    if (channel === 'sms') target = prefs.channels.sms.phoneNumber || 'SMS Gateway';
    else if (channel === 'email') target = prefs.channels.email.emailAddress || 'Email Gateway';
    else target = 'In-App Secure Push Channel';

    const sampleSubject =
      type === 'criticalLabResults'
        ? 'تنبيه نتائج مخبرية حرجة (Lipid / Troponin Critical Flag)'
        : 'تذكير موعد جرعة دواء (Metformin XR 500mg)';

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: `test-alert-${channel}-${type}`,
      purpose: 'TEST_ALERT_DISPATCH',
      outcome: 'SUCCESS',
      policyApplied: 'POL-SECURE-NOTIFICATION-TEST',
      provenance: `Simulated Dispatch via ${channel.toUpperCase()} (${target})`,
    });

    return {
      success: true,
      message: `تم إرسال إشعار تجريبي عبر ${channel.toUpperCase()} (${target}) لـ "${sampleSubject}" بنجاح.`,
      timestamp,
    };
  }

  public getMedicationAdherenceStats(patientId: string) {
    const schedules = this.getMedicationSchedules(patientId);
    const logs = this.getMedicationLogs(patientId);
    const todayStr = new Date().toISOString().slice(0, 10);

    const todayLogs = logs.filter((l) => l.loggedAt.slice(0, 10) === todayStr);
    const takenToday = todayLogs.filter((l) => l.status === 'TAKEN').length;
    const skippedToday = todayLogs.filter((l) => l.status === 'SKIPPED').length;
    const totalScheduledToday = schedules.length || 1;

    const todayAdherencePct = Math.round((takenToday / totalScheduledToday) * 100);

    // Calculate weekly adherence
    const past7DaysLogs = logs.filter((l) => {
      const diffMs = Date.now() - new Date(l.loggedAt).getTime();
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    });
    const takenPast7Days = past7DaysLogs.filter((l) => l.status === 'TAKEN').length;
    const totalExpectedPast7Days = Math.max(schedules.length * 7, past7DaysLogs.length, 1);
    const weeklyAdherencePct = Math.min(100, Math.round((takenPast7Days / totalExpectedPast7Days) * 100) || 92);

    return {
      todayScheduled: totalScheduledToday,
      todayTaken: takenToday,
      todaySkipped: skippedToday,
      todayAdherencePct: Math.min(100, todayAdherencePct),
      weeklyAdherencePct,
      streakDays: 6, // 6 consecutive compliant days
      totalHistoricalLogs: logs.length,
      totalTakenAllTime: logs.filter((l) => l.status === 'TAKEN').length,
      totalSkippedAllTime: logs.filter((l) => l.status === 'SKIPPED').length,
    };
  }

  public getMedicationAdherenceTrends(patientId: string, days = 7): MedicationAdherenceTrendPoint[] {
    const schedules = this.getMedicationSchedules(patientId);
    const logs = this.getMedicationLogs(patientId);
    const expectedPerDay = Math.max(schedules.length, 3);
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const trendPoints: MedicationAdherenceTrendPoint[] = [];

    const baseDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = arabicDays[d.getDay()];

      const dayLogs = logs.filter((l) => l.loggedAt.slice(0, 10) === dateStr);
      const taken = dayLogs.filter((l) => l.status === 'TAKEN').length;
      const skipped = dayLogs.filter((l) => l.status === 'SKIPPED').length;

      const scheduled = i === 0 ? schedules.length : expectedPerDay;
      const effectiveExpected = Math.max(scheduled, taken + skipped, 1);
      const adherencePct = Math.min(100, Math.round((taken / effectiveExpected) * 100));

      trendPoints.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        dayName,
        scheduled,
        taken,
        skipped,
        adherencePct,
      });
    }

    return trendPoints;
  }

  public getMedicationBreakdownStats(patientId: string) {
    const logs = this.getMedicationLogs(patientId);
    const map = new Map<string, { name: string; dosage: string; taken: number; skipped: number; total: number }>();

    for (const log of logs) {
      const key = log.medicationName;
      const entry = map.get(key) || {
        name: log.medicationName,
        dosage: log.dosage,
        taken: 0,
        skipped: 0,
        total: 0,
      };
      entry.total += 1;
      if (log.status === 'TAKEN') entry.taken += 1;
      if (log.status === 'SKIPPED') entry.skipped += 1;
      map.set(key, entry);
    }

    return Array.from(map.values()).map((item) => ({
      ...item,
      adherencePct: item.total > 0 ? Math.round((item.taken / item.total) * 100) : 100,
    }));
  }

  public getDoctorEncounters(doctorId: string) {
    return this.encounters.filter((e) => e.doctorId === doctorId);
  }

  public getPatientEncounters(patientId: string): ClinicalEncounter[] {
    return this.encounters.filter((e) => e.patientId === patientId);
  }

  public getComprehensiveMedicalHistory(patientId: string = 'pat-main'): ComprehensiveMedicalHistory {
    const projections = this.getPatientProjections(patientId);
    const vitalTrends = this.getPatientVitalTrends(patientId);
    const labResults = this.getLabResults(patientId);
    const encounters = this.getPatientEncounters(patientId);
    const dispenses = this.getPharmacyDispenses(patientId);

    // Cryptographic pseudo-hash for medical summary verification
    const hashSeed = `${patientId}-${Date.now()}-SOVEREIGN-EHR-TRANSFER`;
    let hash = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      hash = (hash << 5) - hash + hashSeed.charCodeAt(i);
      hash |= 0;
    }
    const trackingHash = `LX-EHR-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;

    return {
      patientId,
      patientName: 'أحمد فهد المنصوري',
      nationalId: 'NAT-9482-1082-99',
      dateOfBirth: '1982-05-14',
      age: 44,
      gender: 'ذكر (Male)',
      bloodType: 'O+',
      primaryCareDoctor: 'د. سارة المنصور (استشاري أمراض القلب والأوعية)',
      emergencyContact: {
        name: 'فهد أحمد المنصوري (الأخ)',
        relation: 'شقيق (Next of Kin)',
        phone: '+966 50 123 4567',
      },
      generatedAt: new Date().toISOString(),
      documentTrackingHash: trackingHash,
      conditions: projections.conditions,
      allergies: projections.allergies,
      medications: projections.medications,
      vitals: projections.vitals,
      vitalTrends,
      labResults,
      encounters,
      timeline: projections.timeline,
      dispenses,
      disclaimer:
        'ملخص التاريخ الطبي صادر لأغراض الاستشارة السريرية والمراجعة الطبية الخارجية. تظل السجلات الأصلية الحاكمة محفوظة وموثقة لدى المنشآت والمختبرات المعتمدة المصدرة.',
    };
  }

  public getLabResults(patientId: string) {
    return this.labResults.filter((l) => l.patientId === patientId);
  }

  public getPharmacyDispenses(patientId: string) {
    return this.pharmacyDispenses.filter((p) => p.patientId === patientId);
  }

  public getMedicalDevices() {
    return this.medicalDevices;
  }

  public getEmergencyIncidents() {
    return this.emergencyIncidents;
  }

  public search(query: string, userRole: any): SearchResultItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return this.searchCatalog.filter((item) => {
      const matchRole = item.authorizedRoles.includes(userRole);
      const matchText =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchRole && matchText;
    });
  }

  // -------------------------------------------------------------------------
  // EXPORT WITH STRICT ZERO-TRUST CLOSE-FAIL
  // -------------------------------------------------------------------------
  public exportPatientRecord(patientId: string, requesterRole: string): { success: boolean; data?: any; error?: string } {
    if (requesterRole !== 'patient' && requesterRole !== 'administrator') {
      auditService.record({
        actorId: 'unknown',
        actorRole: requesterRole as any,
        actorName: 'محاولة تصدير غير مصرح بها',
        action: 'EXPORT',
        resourceType: 'PATIENT_RECORD',
        resourceId: patientId,
        purpose: 'DATA_EXPORT',
        outcome: 'DENIED',
        policyApplied: 'POL-FAIL-CLOSED-UNAUTHORIZED-EXPORT',
        provenance: 'Zero-Trust Export Guard',
      });
      return { success: false, error: 'تم رفض التصدير: غير مصرح لك بتصدير هذا السجل الطبي وفق سياسات الحماية.' };
    }

    auditService.record({
      actorId: patientId,
      actorRole: requesterRole as any,
      actorName: 'المستخدم المصرح بالتصدير',
      action: 'EXPORT',
      resourceType: 'PATIENT_RECORD',
      resourceId: patientId,
      purpose: 'PATIENT_DATA_PORTABILITY_GDPR_HIPAA',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SOVEREIGN-EXPORT',
      provenance: 'Cryptographic JSON Export Generator',
    });

    return {
      success: true,
      data: {
        exportVersion: 'v0.1.0',
        exportedAt: new Date().toISOString(),
        patientId,
        dataOwnershipDisclaimer: 'This is an authorized projection of clinical records. Original canonical records reside in their source hospital/laboratory/pharmacy domains.',
        projections: {
          vitals: this.patientVitals,
          medications: this.patientMedications,
          allergies: this.patientAllergies,
          conditions: this.patientConditions,
          timeline: this.patientTimelineEvents,
        },
      },
    };
  }

  // -------------------------------------------------------------------------
  // TELEMEDICINE VIRTUAL CONSULTATIONS
  // -------------------------------------------------------------------------
  private telemedicineDoctors: TelemedicineDoctor[] = [
    {
      id: 'doc-dr-sarah',
      name: 'د. سارة المنصور',
      specialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      rating: 4.9,
      consultationFee: 'مجاناً ضمن التأمين الصحي',
      status: 'ONLINE',
      languages: ['العربية', 'English'],
    },
    {
      id: 'doc-dr-tariq',
      name: 'د. طارق الحازمي',
      specialty: 'استشاري طب الأسرة ومتابعة الأمراض المزمنة',
      hospital: 'المركز الصحي الأول للرعاية الأولية',
      rating: 4.8,
      consultationFee: 'مشمول بالتغطية الحكومية',
      status: 'ONLINE',
      languages: ['العربية'],
    },
    {
      id: 'doc-dr-layla',
      name: 'د. ليلى الشريف',
      specialty: 'أخصائية الغدد الصماء والسكري والتغذية العلاجية',
      hospital: 'مجمع الرياض الطبي التخصصي',
      rating: 4.95,
      consultationFee: 'مجاناً ضمن التأمين الصحي',
      status: 'ONLINE',
      languages: ['العربية', 'English'],
    },
  ];

  private telemedicineConsultations: TelemedicineConsultationRecord[] = [
    {
      id: 'tele-past-1',
      patientId: 'pat-main',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي',
      scheduledAt: '2026-10-01T14:00:00Z',
      durationSeconds: 940,
      status: 'COMPLETED',
      chiefComplaint: 'متابعة انتظام ضغط الدم والجرعة اليومية للكونكور',
      clinicalSummary: 'المريض في حالة استقرار سريري ممتاز، ضغط الدم 122/80 مم زئبق، الالتزام الدوائي 85%. تمت التوصية بالاستمرار على الجرعة الحالية وإجراء فحص دوري بعد شهرين.',
      prescriptions: ['Concor 5mg - قرص يومياً صباحاً', 'Omega-3 1000mg - كبسولة يومياً مع الغداء'],
      followUpDate: '2026-12-01',
    },
  ];

  public getAvailableTelemedicineDoctors(): TelemedicineDoctor[] {
    return this.telemedicineDoctors;
  }

  public getTelemedicineConsultations(patientId: string): TelemedicineConsultationRecord[] {
    return this.telemedicineConsultations.filter((c) => c.patientId === patientId);
  }

  public saveTelemedicineConsultation(record: TelemedicineConsultationRecord): void {
    const existingIndex = this.telemedicineConsultations.findIndex((c) => c.id === record.id);
    if (existingIndex >= 0) {
      this.telemedicineConsultations[existingIndex] = record;
    } else {
      this.telemedicineConsultations.unshift(record);
    }

    // Append to timeline as a clinical encounter projection
    this.patientTimelineEvents.unshift({
      id: `evt-tele-${Date.now()}`,
      timestamp: record.scheduledAt,
      type: 'ENCOUNTER',
      title: `استشارة مرئية عن بُعد - ${record.doctorName}`,
      summary: `${record.chiefComplaint}. ${record.clinicalSummary}`,
      providerName: record.doctorName,
      location: record.hospital,
      sourceDomain: 'CLINIC',
      isCanonicalRecordOriginal: false,
    });

    auditService.record({
      actorId: record.patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: record.id,
      purpose: 'TELEMEDICINE_REMOTE_CONSULTATION_LOG',
      outcome: 'SUCCESS',
      policyApplied: 'POL-TELEHEALTH-SESSION-LOG',
      provenance: 'WebRTC Secure Telemedicine Session Engine',
    });
  }

  // -------------------------------------------------------------------------
  // APPOINTMENT SCHEDULING & PHYSICIAN AVAILABILITY DOMAIN
  // -------------------------------------------------------------------------
  private physicianSlots: PhysicianSlot[] = [
    // Dr. Sarah Al-Mansour (Cardiology)
    {
      id: 'slot-sarah-1',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      date: '2026-10-10',
      startTime: '08:30',
      endTime: '09:00',
      period: 'MORNING',
      consultationType: 'BOTH',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 98,
      aiRecommendationReasonAr: 'الموعد الأنسب فسيولوجياً لإجراء فحص دهون الدم الصائم ومتابعة ذروة الضغط الصباحية مباشرة مع الاستشارية.',
      clinicalUrgencyMatch: 'HIGH',
    },
    {
      id: 'slot-sarah-2',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      date: '2026-10-10',
      startTime: '10:15',
      endTime: '10:45',
      period: 'MORNING',
      consultationType: 'IN_PERSON',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 92,
      aiRecommendationReasonAr: 'مناسب لتقييم تخطيط القلب ومراجعة تأثير جرعات خافض الضغط الصباحية.',
      clinicalUrgencyMatch: 'MEDIUM',
    },
    {
      id: 'slot-sarah-3',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      date: '2026-10-11',
      startTime: '14:00',
      endTime: '14:30',
      period: 'AFTERNOON',
      consultationType: 'TELEMEDICINE',
      isAvailable: true,
      aiSuggested: false,
      aiOptimalityScore: 84,
      aiRecommendationReasonAr: 'جلسة استشارة مرئية لمراجعة سجل ضغط الدم المنزلي دون الحاجة للحضور للمستشفى.',
      clinicalUrgencyMatch: 'ROUTINE',
    },
    {
      id: 'slot-sarah-4',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      date: '2026-10-12',
      startTime: '09:00',
      endTime: '09:30',
      period: 'MORNING',
      consultationType: 'IN_PERSON',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 95,
      aiRecommendationReasonAr: 'موعد صباحي متقدم يتيح الربط الفوري مع قراءات جهاز هولتر ونتائج المختبر.',
      clinicalUrgencyMatch: 'HIGH',
    },

    // Dr. Tariq Al-Hazmi (Family Medicine & Chronic Disease)
    {
      id: 'slot-tariq-1',
      doctorId: 'doc-dr-tariq',
      doctorName: 'د. طارق الحازمي',
      doctorSpecialty: 'استشاري طب الأسرة ومتابعة الأمراض المزمنة',
      hospital: 'المركز الصحي الأول للرعاية الأولية',
      date: '2026-10-10',
      startTime: '09:00',
      endTime: '09:30',
      period: 'MORNING',
      consultationType: 'BOTH',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 94,
      aiRecommendationReasonAr: 'فحص شامل وتنسيق الخطة الدوائية التراكمية مع تجديد وصفات الأمراض المزمنة.',
      clinicalUrgencyMatch: 'HIGH',
    },
    {
      id: 'slot-tariq-2',
      doctorId: 'doc-dr-tariq',
      doctorName: 'د. طارق الحازمي',
      doctorSpecialty: 'استشاري طب الأسرة ومتابعة الأمراض المزمنة',
      hospital: 'المركز الصحي الأول للرعاية الأولية',
      date: '2026-10-10',
      startTime: '16:30',
      endTime: '17:00',
      period: 'AFTERNOON',
      consultationType: 'TELEMEDICINE',
      isAvailable: true,
      aiSuggested: false,
      aiOptimalityScore: 82,
      aiRecommendationReasonAr: 'استشارة بعد الدوام الرسمي لمراجعة التوافق العلاجي والاستفسارات الوقائية.',
      clinicalUrgencyMatch: 'ROUTINE',
    },
    {
      id: 'slot-tariq-3',
      doctorId: 'doc-dr-tariq',
      doctorName: 'د. طارق الحازمي',
      doctorSpecialty: 'استشاري طب الأسرة ومتابعة الأمراض المزمنة',
      hospital: 'المركز الصحي الأول للرعاية الأولية',
      date: '2026-10-12',
      startTime: '11:00',
      endTime: '11:30',
      period: 'MORNING',
      consultationType: 'IN_PERSON',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 88,
      aiRecommendationReasonAr: 'مراجعة سريرية للأعراض التنفسية وأثر دواء الضغط على السعال الجاف.',
      clinicalUrgencyMatch: 'MEDIUM',
    },

    // Dr. Layla Al-Sharif (Endocrinology & Diabetes)
    {
      id: 'slot-layla-1',
      doctorId: 'doc-dr-layla',
      doctorName: 'د. ليلى الشريف',
      doctorSpecialty: 'أخصائية الغدد الصماء والسكري والتغذية العلاجية',
      hospital: 'مجمع الرياض الطبي التخصصي',
      date: '2026-10-10',
      startTime: '08:00',
      endTime: '08:30',
      period: 'MORNING',
      consultationType: 'IN_PERSON',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 97,
      aiRecommendationReasonAr: 'الموعد الذهبي لفحص السكر الصيامي والتحليل التراكمي ومقارنتها بقراءات جهاز CGM مباشرة.',
      clinicalUrgencyMatch: 'HIGH',
    },
    {
      id: 'slot-layla-2',
      doctorId: 'doc-dr-layla',
      doctorName: 'د. ليلى الشريف',
      doctorSpecialty: 'أخصائية الغدد الصماء والسكري والتغذية العلاجية',
      hospital: 'مجمع الرياض الطبي التخصصي',
      date: '2026-10-11',
      startTime: '10:00',
      endTime: '10:30',
      period: 'MORNING',
      consultationType: 'BOTH',
      isAvailable: true,
      aiSuggested: true,
      aiOptimalityScore: 91,
      aiRecommendationReasonAr: 'متابعة الحمية الغذائية وضبط جرعات Metformin مع التغذية العلاجية.',
      clinicalUrgencyMatch: 'MEDIUM',
    },
    {
      id: 'slot-layla-3',
      doctorId: 'doc-dr-layla',
      doctorName: 'د. ليلى الشريف',
      doctorSpecialty: 'أخصائية الغدد الصماء والسكري والتغذية العلاجية',
      hospital: 'مجمع الرياض الطبي التخصصي',
      date: '2026-10-13',
      startTime: '17:00',
      endTime: '17:30',
      period: 'EVENING',
      consultationType: 'TELEMEDICINE',
      isAvailable: true,
      aiSuggested: false,
      aiOptimalityScore: 80,
      aiRecommendationReasonAr: 'استشارة مسائية مرئية لمراجعة تقرير السكر الأسبوعي الذكي.',
      clinicalUrgencyMatch: 'ROUTINE',
    },
  ];

  private patientAppointments: PatientAppointment[] = [
    {
      id: 'apt-2026-01',
      patientId: 'pat-main',
      doctorId: 'doc-dr-sarah',
      doctorName: 'د. سارة المنصور',
      doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
      hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      date: '2026-10-14',
      startTime: '09:00',
      endTime: '09:30',
      period: 'MORNING',
      consultationType: 'IN_PERSON',
      status: 'CONFIRMED',
      reasonForVisit: 'فحص دوري وقائي لضغط الدم الشرياني ومراجعة جرعة Atorvastatin',
      aiSuggestedSlot: true,
      aiCompatibilityScore: 96,
      preparationInstructions: [
        'الصيام لمدة 8 ساعات قبل الموعد لسحب عينات دهون الدم وسكر الصائم',
        'إحضار قراءات ضغط الدم المنزلية المسجلة بالأسبوع المنصرم',
        'تناول أدوية الضغط الصباحية مع رشفة ماء خفيفة',
      ],
      reminderEnabled: true,
      bookedAt: '2026-10-06T10:00:00Z',
    },
  ];

  public getPhysicianSlots(doctorId?: string, date?: string): PhysicianSlot[] {
    return this.physicianSlots.filter((slot) => {
      if (doctorId && slot.doctorId !== doctorId) return false;
      if (date && slot.date !== date) return false;
      return true;
    });
  }

  public getPatientAppointments(patientId: string): PatientAppointment[] {
    return this.patientAppointments.filter((a) => a.patientId === patientId);
  }

  public bookAppointment(params: Omit<PatientAppointment, 'id' | 'bookedAt'>): PatientAppointment {
    const id = `apt-${Date.now()}`;
    const bookedAt = new Date().toISOString();

    const newAppointment: PatientAppointment = {
      ...params,
      id,
      bookedAt,
      status: 'CONFIRMED',
    };

    // Mark slot as booked/unavailable if exists
    const matchingSlot = this.physicianSlots.find(
      (s) => s.doctorId === params.doctorId && s.date === params.date && s.startTime === params.startTime
    );
    if (matchingSlot) {
      matchingSlot.isAvailable = false;
    }

    this.patientAppointments.unshift(newAppointment);

    // Append projection event to patient timeline
    this.patientTimelineEvents.unshift({
      id: `evt-apt-${Date.now()}`,
      timestamp: `${newAppointment.date}T${newAppointment.startTime}:00Z`,
      type: 'ENCOUNTER',
      title: `موعد سريري مؤكد - ${newAppointment.doctorName}`,
      summary: `${newAppointment.reasonForVisit}. نوع الزيارة: ${
        newAppointment.consultationType === 'IN_PERSON' ? 'حضوري بالعيادة' : 'استشارة مرئية عن بُعد'
      }`,
      providerName: newAppointment.doctorName,
      location: newAppointment.hospital,
      sourceDomain: 'CLINIC',
      isCanonicalRecordOriginal: false,
    });

    // Record immutable audit entry
    auditService.record({
      actorId: newAppointment.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح له بحجز المواعيد',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'CLINICAL_APPOINTMENT_BOOKING',
      outcome: 'SUCCESS',
      policyApplied: 'POL-APPOINTMENT-BOOKING',
      provenance: 'AI Optimal Slot Reservation Engine',
    });

    return newAppointment;
  }

  public cancelAppointment(appointmentId: string, patientId: string = 'pat-main'): boolean {
    const apt = this.patientAppointments.find((a) => a.id === appointmentId && a.patientId === patientId);
    if (!apt) return false;

    apt.status = 'CANCELLED';

    // Release slot back to available
    const matchingSlot = this.physicianSlots.find(
      (s) => s.doctorId === apt.doctorId && s.date === apt.date && s.startTime === apt.startTime
    );
    if (matchingSlot) {
      matchingSlot.isAvailable = true;
    }

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: appointmentId,
      purpose: 'CLINICAL_APPOINTMENT_CANCELLATION',
      outcome: 'SUCCESS',
      policyApplied: 'POL-APPOINTMENT-CANCELLATION',
      provenance: 'Appointment Governance Engine',
    });

    return true;
  }

  public rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    patientId: string = 'pat-main'
  ): PatientAppointment | null {
    const apt = this.patientAppointments.find((a) => a.id === appointmentId && a.patientId === patientId);
    if (!apt) return null;

    // Release old slot
    const oldSlot = this.physicianSlots.find(
      (s) => s.doctorId === apt.doctorId && s.date === apt.date && s.startTime === apt.startTime
    );
    if (oldSlot) oldSlot.isAvailable = true;

    apt.date = newDate;
    apt.startTime = newStartTime;
    apt.endTime = newEndTime;
    apt.status = 'RESCHEDULED';

    // Occupy new slot
    const newSlot = this.physicianSlots.find(
      (s) => s.doctorId === apt.doctorId && s.date === newDate && s.startTime === newStartTime
    );
    if (newSlot) newSlot.isAvailable = false;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: appointmentId,
      purpose: 'CLINICAL_APPOINTMENT_RESCHEDULING',
      outcome: 'SUCCESS',
      policyApplied: 'POL-APPOINTMENT-RESCHEDULING',
      provenance: 'Appointment Governance Engine',
    });

    return apt;
  }

  // -------------------------------------------------------------------------
  // HEALTH GOALS & PERSONALIZED OBJECTIVES (Self-Managed Sovereign Wellness)
  // -------------------------------------------------------------------------
  private patientHealthGoals: HealthGoal[] = [
    {
      id: 'goal-steps-1',
      patientId: 'pat-main',
      title: 'زيادة الخطوات اليومية',
      titleEn: 'Increase Daily Steps',
      description: 'المشي بانتظام لتعزيز صحة عضلة القلب وتنشيط الدورة الدموية وفق توصيات طبيب القلب.',
      category: 'ACTIVITY',
      frequency: 'DAILY',
      targetValue: 8000,
      currentValue: 6400,
      unit: 'خطوة',
      unitEn: 'steps',
      startDate: '2026-10-01',
      targetDate: '2026-10-31',
      status: 'ACTIVE',
      streakDays: 5,
      isCustom: false,
      colorTheme: 'emerald',
      quickIncrements: [500, 1000, 2000],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T14:30:00Z',
      progressHistory: [
        { id: 'prog-1-1', date: '2026-10-04', value: 7200, note: 'مشي صباحي في الحديقة', loggedAt: '2026-10-04T18:00:00Z' },
        { id: 'prog-1-2', date: '2026-10-05', value: 8150, note: 'تم إنجاز الهدف كاملاً مع العائلة', loggedAt: '2026-10-05T19:30:00Z' },
        { id: 'prog-1-3', date: '2026-10-06', value: 7800, note: 'نشاط بدني خفيف بالمساء', loggedAt: '2026-10-06T20:15:00Z' },
        { id: 'prog-1-4', date: '2026-10-07', value: 8400, note: 'تجاوز الهدف اليومي بنجاح', loggedAt: '2026-10-07T19:00:00Z' },
        { id: 'prog-1-5', date: '2026-10-08', value: 6400, note: 'النشاط مستمر حتى نهاية اليوم', loggedAt: '2026-10-08T14:30:00Z' },
      ],
    },
    {
      id: 'goal-hydr-1',
      patientId: 'pat-main',
      title: 'الحفاظ على الترطيب اليومي',
      titleEn: 'Maintain Daily Hydration',
      description: 'شرب كميات كافية من الماء لدعم وظائف الكلى والحفاظ على سيولة الدم واستقرار الضغط.',
      category: 'HYDRATION',
      frequency: 'DAILY',
      targetValue: 2500,
      currentValue: 2000,
      unit: 'مل',
      unitEn: 'ml',
      startDate: '2026-10-01',
      targetDate: '2026-10-31',
      status: 'ACTIVE',
      streakDays: 6,
      isCustom: false,
      colorTheme: 'cyan',
      quickIncrements: [250, 500, 750],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T13:45:00Z',
      progressHistory: [
        { id: 'prog-2-1', date: '2026-10-04', value: 2500, note: 'شرب 5 أكواب كبيرة', loggedAt: '2026-10-04T20:00:00Z' },
        { id: 'prog-2-2', date: '2026-10-05', value: 2600, note: 'ترطيب ممتاز طوال اليوم', loggedAt: '2026-10-05T20:10:00Z' },
        { id: 'prog-2-3', date: '2026-10-06', value: 2400, note: 'معدل جيد جداً', loggedAt: '2026-10-06T19:40:00Z' },
        { id: 'prog-2-4', date: '2026-10-07', value: 2500, note: 'اكتمال المعدل الموصى به', loggedAt: '2026-10-07T21:00:00Z' },
        { id: 'prog-2-5', date: '2026-10-08', value: 2000, note: 'تبقى 500 مل للوصول للمستهدف', loggedAt: '2026-10-08T13:45:00Z' },
      ],
    },
    {
      id: 'goal-meds-1',
      patientId: 'pat-main',
      title: 'الالتزام بجرعات الدواء الأسبوعية',
      titleEn: 'Weekly Medication Adherence',
      description: 'تناول جميع جرعات أدوية الضغط والقلب (Concor & Lipitor) في مواعيدها المحددة.',
      category: 'MEDICATION',
      frequency: 'WEEKLY',
      targetValue: 7,
      currentValue: 6,
      unit: 'أيام التزام',
      unitEn: 'days',
      startDate: '2026-10-02',
      targetDate: '2026-10-09',
      status: 'ACTIVE',
      streakDays: 14,
      isCustom: false,
      colorTheme: 'amber',
      quickIncrements: [1],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T12:00:00Z',
      progressHistory: [
        { id: 'prog-3-1', date: '2026-10-03', value: 2, note: 'جرعات الصباح والمساء مكتملة', loggedAt: '2026-10-03T20:00:00Z' },
        { id: 'prog-3-2', date: '2026-10-05', value: 4, note: 'التزام دقيق بالأوقات المجدولة', loggedAt: '2026-10-05T20:00:00Z' },
        { id: 'prog-3-3', date: '2026-10-07', value: 5, note: 'لا توجد جرعات فائتة', loggedAt: '2026-10-07T20:00:00Z' },
        { id: 'prog-3-4', date: '2026-10-08', value: 6, note: 'جرعة اليوم تم تأكيدها في موعدها', loggedAt: '2026-10-08T12:00:00Z' },
      ],
    },
    {
      id: 'goal-sport-1',
      patientId: 'pat-main',
      title: 'تمارين اللياقة الهوائية الخفيفة',
      titleEn: 'Aerobic Exercise Session',
      description: 'ممارسة تمارين معتدلة الشدة (دراجة هوائية ثابتة أو هرولة خفيفة) 30 دقيقة يومياً.',
      category: 'ACTIVITY',
      frequency: 'DAILY',
      targetValue: 30,
      currentValue: 25,
      unit: 'دقيقة',
      unitEn: 'mins',
      startDate: '2026-10-01',
      targetDate: '2026-10-31',
      status: 'ACTIVE',
      streakDays: 4,
      isCustom: true,
      colorTheme: 'teal',
      quickIncrements: [5, 10, 15],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T10:30:00Z',
      progressHistory: [
        { id: 'prog-4-1', date: '2026-10-05', value: 20, note: 'إحماء ومشي سريع', loggedAt: '2026-10-05T17:00:00Z' },
        { id: 'prog-4-2', date: '2026-10-06', value: 30, note: 'جلسة كاملة على الدراجة الثابتة', loggedAt: '2026-10-06T17:30:00Z' },
        { id: 'prog-4-3', date: '2026-10-07', value: 30, note: 'تمارين إطالة وهوائية', loggedAt: '2026-10-07T18:00:00Z' },
        { id: 'prog-4-4', date: '2026-10-08', value: 25, note: 'تمارين صباحية خفيفة', loggedAt: '2026-10-08T10:30:00Z' },
      ],
    },
    {
      id: 'goal-sleep-1',
      patientId: 'pat-main',
      title: 'تنظيم ساعات النوم الصحي',
      titleEn: 'Consistent Restful Sleep',
      description: 'الحصول على قسط كافٍ من النوم المتواصل لتقليل مستويات هرمون الكورتيزول وإراحة القلب.',
      category: 'SLEEP',
      frequency: 'DAILY',
      targetValue: 8,
      currentValue: 7.5,
      unit: 'ساعات',
      unitEn: 'hours',
      startDate: '2026-10-01',
      targetDate: '2026-10-31',
      status: 'ACTIVE',
      streakDays: 7,
      isCustom: false,
      colorTheme: 'indigo',
      quickIncrements: [0.5, 1],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T07:15:00Z',
      progressHistory: [
        { id: 'prog-5-1', date: '2026-10-04', value: 7.5, note: 'نوم عميق دون استيقاظ مفاجئ', loggedAt: '2026-10-04T07:00:00Z' },
        { id: 'prog-5-2', date: '2026-10-05', value: 8.0, note: 'راحة كاملة لـ 8 ساعات', loggedAt: '2026-10-05T07:15:00Z' },
        { id: 'prog-5-3', date: '2026-10-06', value: 7.0, note: 'نوم هادئ', loggedAt: '2026-10-06T07:00:00Z' },
        { id: 'prog-5-4', date: '2026-10-07', value: 8.0, note: 'استيقاظ بنشاط عالي', loggedAt: '2026-10-07T07:30:00Z' },
        { id: 'prog-5-5', date: '2026-10-08', value: 7.5, note: 'تسجيل قسط نوم الليلة الماضية', loggedAt: '2026-10-08T07:15:00Z' },
      ],
    },
    {
      id: 'goal-vitals-1',
      patientId: 'pat-main',
      title: 'استقرار ضغط الدم الانقباضي',
      titleEn: 'Systolic Blood Pressure Control',
      description: 'المحافظة على قراءة ضغط الدم الانقباضي دون 125 مم زئبق عند القياس اليومي.',
      category: 'VITALS',
      frequency: 'DAILY',
      targetValue: 120,
      currentValue: 122,
      unit: 'مم زئبق',
      unitEn: 'mmHg',
      startDate: '2026-10-01',
      targetDate: '2026-10-31',
      status: 'ACTIVE',
      streakDays: 7,
      isCustom: false,
      colorTheme: 'rose',
      quickIncrements: [1, 2, 5],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-08T08:15:00Z',
      progressHistory: [
        { id: 'prog-6-1', date: '2026-10-04', value: 124, note: 'قراءة صباحية طبيعية', loggedAt: '2026-10-04T08:00:00Z' },
        { id: 'prog-6-2', date: '2026-10-05', value: 120, note: 'وصول ممتاز للمستهدف المثالي', loggedAt: '2026-10-05T08:15:00Z' },
        { id: 'prog-6-3', date: '2026-10-06', value: 121, note: 'استقرار ممتاز', loggedAt: '2026-10-06T08:20:00Z' },
        { id: 'prog-6-4', date: '2026-10-07', value: 119, note: 'قراءة نموذجية', loggedAt: '2026-10-07T08:00:00Z' },
        { id: 'prog-6-5', date: '2026-10-08', value: 122, note: 'قراءة مستقرة وضمن الحدود الآمنة', loggedAt: '2026-10-08T08:15:00Z' },
      ],
    },
  ];

  public getHealthGoals(patientId: string): HealthGoal[] {
    return this.patientHealthGoals.filter((g) => g.patientId === patientId);
  }

  public getHealthGoalStats(patientId: string): HealthGoalStats {
    const goals = this.getHealthGoals(patientId);
    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED' || g.currentValue >= g.targetValue).length;

    let totalPct = 0;
    let longestStreak = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    let todayLoggedCount = 0;

    goals.forEach((g) => {
      const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
      totalPct += pct;
      if (g.streakDays > longestStreak) longestStreak = g.streakDays;
      const hasTodayLog = g.progressHistory.some((h) => h.date === todayStr);
      if (hasTodayLog) todayLoggedCount++;
    });

    const averageProgressPct = totalGoals > 0 ? Math.round(totalPct / totalGoals) : 0;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      averageProgressPct,
      longestStreak,
      todayLoggedCount,
    };
  }

  public createHealthGoal(patientId: string, input: CreateGoalInput): HealthGoal {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const startVal = input.currentValue ?? 0;

    const newGoal: HealthGoal = {
      id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      title: input.title,
      titleEn: input.titleEn,
      description: input.description,
      category: input.category,
      frequency: input.frequency,
      targetValue: input.targetValue,
      currentValue: startVal,
      unit: input.unit,
      unitEn: input.unitEn,
      startDate: todayStr,
      targetDate: input.targetDate,
      status: 'ACTIVE',
      streakDays: startVal >= input.targetValue ? 1 : 0,
      isCustom: input.isCustom ?? true,
      colorTheme:
        input.category === 'ACTIVITY'
          ? 'emerald'
          : input.category === 'HYDRATION'
          ? 'cyan'
          : input.category === 'MEDICATION'
          ? 'amber'
          : input.category === 'VITALS'
          ? 'rose'
          : input.category === 'SLEEP'
          ? 'indigo'
          : 'teal',
      quickIncrements:
        input.quickIncrements ||
        (input.category === 'HYDRATION'
          ? [250, 500]
          : input.category === 'ACTIVITY'
          ? [500, 1000]
          : [1]),
      createdAt: nowIso,
      updatedAt: nowIso,
      progressHistory:
        startVal > 0
          ? [
              {
                id: `prog-${Date.now()}`,
                date: todayStr,
                value: startVal,
                note: 'القيمة الابتدائية عند إنشاء الهدف',
                loggedAt: nowIso,
              },
            ]
          : [],
    };

    this.patientHealthGoals.unshift(newGoal);

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: newGoal.id,
      purpose: 'CREATE_HEALTH_GOAL_OBJECTIVE',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SELF-MANAGED-GOALS',
      provenance: 'PatientPortal Health Goals Engine',
    });

    return newGoal;
  }

  public updateHealthGoalProgress(
    patientId: string,
    goalId: string,
    newValue: number,
    note?: string
  ): HealthGoal | null {
    const goal = this.patientHealthGoals.find((g) => g.id === goalId && g.patientId === patientId);
    if (!goal) return null;

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const updatedVal = Math.max(0, newValue);

    goal.currentValue = updatedVal;
    goal.updatedAt = nowIso;

    if (goal.currentValue >= goal.targetValue) {
      goal.status = 'COMPLETED';
      goal.streakDays = (goal.streakDays || 0) + 1;
    } else if (goal.status === 'COMPLETED' && goal.currentValue < goal.targetValue) {
      goal.status = 'ACTIVE';
    }

    const existingToday = goal.progressHistory.find((h) => h.date === todayStr);
    if (existingToday) {
      existingToday.value = updatedVal;
      existingToday.loggedAt = nowIso;
      if (note) existingToday.note = note;
    } else {
      goal.progressHistory.push({
        id: `prog-${Date.now()}`,
        date: todayStr,
        value: updatedVal,
        note: note || 'تسجيل تقدم يومي',
        loggedAt: nowIso,
      });
    }

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: goal.id,
      purpose: 'LOG_HEALTH_GOAL_PROGRESS',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SELF-MANAGED-GOALS',
      provenance: 'PatientPortal Health Goals Engine',
    });

    return { ...goal };
  }

  public logGoalProgressEntry(
    patientId: string,
    goalId: string,
    deltaOrValue: number,
    mode: 'set' | 'increment',
    note?: string
  ): HealthGoal | null {
    const goal = this.patientHealthGoals.find((g) => g.id === goalId && g.patientId === patientId);
    if (!goal) return null;

    const targetVal = mode === 'increment' ? goal.currentValue + deltaOrValue : deltaOrValue;
    return this.updateHealthGoalProgress(patientId, goalId, targetVal, note);
  }

  public updateHealthGoal(
    patientId: string,
    goalId: string,
    updates: Partial<HealthGoal>
  ): HealthGoal | null {
    const index = this.patientHealthGoals.findIndex((g) => g.id === goalId && g.patientId === patientId);
    if (index === -1) return null;

    const current = this.patientHealthGoals[index];
    const updated: HealthGoal = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updated.currentValue >= updated.targetValue) {
      updated.status = 'COMPLETED';
    }

    this.patientHealthGoals[index] = updated;

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: goalId,
      purpose: 'UPDATE_HEALTH_GOAL',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SELF-MANAGED-GOALS',
      provenance: 'PatientPortal Health Goals Engine',
    });

    return updated;
  }

  public toggleGoalStatus(patientId: string, goalId: string): HealthGoal | null {
    const goal = this.patientHealthGoals.find((g) => g.id === goalId && g.patientId === patientId);
    if (!goal) return null;

    goal.status = goal.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    goal.updatedAt = new Date().toISOString();
    return { ...goal };
  }

  public deleteHealthGoal(patientId: string, goalId: string): boolean {
    const prevLen = this.patientHealthGoals.length;
    this.patientHealthGoals = this.patientHealthGoals.filter(
      (g) => !(g.id === goalId && g.patientId === patientId)
    );
    const deleted = this.patientHealthGoals.length < prevLen;

    if (deleted) {
      auditService.record({
        actorId: patientId,
        actorRole: 'patient',
        actorName: 'مريض مصرح له',
        action: 'WRITE',
        resourceType: 'PATIENT_RECORD',
        resourceId: goalId,
        purpose: 'DELETE_HEALTH_GOAL',
        outcome: 'SUCCESS',
        policyApplied: 'POL-PATIENT-SELF-MANAGED-GOALS',
        provenance: 'PatientPortal Health Goals Engine',
      });
    }

    return deleted;
  }

  // -------------------------------------------------------------------------
  // PATIENT SYMPTOMS & CLINICAL OBSERVATIONS (Sovereign Patient Log)
  // -------------------------------------------------------------------------
  private patientSymptoms: PatientSymptomLog[] = [
    {
      id: 'sym-101',
      patientId: 'pat-main',
      symptomName: 'دوار خفيف صباحي عند النهوض (Morning Lightheadedness)',
      symptomNameEn: 'Mild postural dizziness upon waking',
      severity: 'MILD',
      onsetAt: '2026-10-06T07:30:00Z',
      duration: 'يستمر لبضع دقائق بعد الاستيقاظ',
      notes: 'يحدث عند النهوض السريع من الفراش، تكرر مرتين هذا الأسبوع بالتزامن مع قياس ضغط منخفض نسبياً (114/74)',
      status: 'ACTIVE',
      loggedAt: '2026-10-06T08:00:00Z',
      associatedFactors: ['بعد تناول جرعة ليسينوبريل الصباحية', 'تزامن مع قراءة ضغط 114/74 مم زئبق'],
      flaggedAlertIds: ['alert-init-1'],
    },
    {
      id: 'sym-102',
      patientId: 'pat-main',
      symptomName: 'جفاف خفيف بالحلق صباحاً (Mild Dry Throat)',
      symptomNameEn: 'Mild dry throat in the morning',
      severity: 'MILD',
      onsetAt: '2026-10-04T08:00:00Z',
      duration: 'ساعة بعد الاستيقاظ',
      notes: 'يزول بعد شرب كوبين من الماء الدافئ',
      status: 'RESOLVED',
      loggedAt: '2026-10-04T08:15:00Z',
      associatedFactors: ['قلة ترطيب ليلي'],
    },
  ];

  public getSymptoms(patientId: string = 'pat-main'): PatientSymptomLog[] {
    return this.patientSymptoms.filter((s) => s.patientId === patientId || !s.patientId);
  }

  public logSymptom(
    input: CreateSymptomInput & { patientId?: string; flaggedAlertIds?: string[] }
  ): PatientSymptomLog {
    const patientId = input.patientId || 'pat-main';
    const id = `sym-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const loggedAt = new Date().toISOString();

    const newSymptom: PatientSymptomLog = {
      id,
      patientId,
      symptomName: input.symptomName,
      symptomNameEn: input.symptomNameEn,
      severity: input.severity,
      onsetAt: input.onsetAt || loggedAt,
      duration: input.duration || 'مستمر حديثاً',
      notes: input.notes,
      status: input.status || 'ACTIVE',
      loggedAt,
      associatedFactors: input.associatedFactors || [],
      flaggedAlertIds: input.flaggedAlertIds || [],
    };

    this.patientSymptoms.unshift(newSymptom);

    // Sovereign immutable audit log
    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له (تسجيل عَرَض)',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'LOG_PATIENT_SYMPTOM',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SYMPTOM-SOVEREIGNTY',
      provenance: 'PatientPortal Symptom Tracking Engine',
    });

    return newSymptom;
  }

  public updateSymptomStatus(id: string, status: SymptomStatus): boolean {
    const item = this.patientSymptoms.find((s) => s.id === id);
    if (!item) return false;

    item.status = status;
    auditService.record({
      actorId: item.patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'UPDATE_SYMPTOM_STATUS',
      outcome: 'SUCCESS',
      policyApplied: 'POL-PATIENT-SYMPTOM-SOVEREIGNTY',
      provenance: 'PatientPortal Symptom Tracking Engine',
    });

    return true;
  }

  public deleteSymptom(id: string, patientId: string = 'pat-main'): boolean {
    const prevLen = this.patientSymptoms.length;
    this.patientSymptoms = this.patientSymptoms.filter((s) => !(s.id === id && s.patientId === patientId));
    const deleted = this.patientSymptoms.length < prevLen;

    if (deleted) {
      auditService.record({
        actorId: patientId,
        actorRole: 'patient',
        actorName: 'مريض مصرح له',
        action: 'WRITE',
        resourceType: 'PATIENT_RECORD',
        resourceId: id,
        purpose: 'DELETE_SYMPTOM',
        outcome: 'SUCCESS',
        policyApplied: 'POL-PATIENT-SYMPTOM-SOVEREIGNTY',
        provenance: 'PatientPortal Symptom Tracking Engine',
      });
    }

    return deleted;
  }

  // -------------------------------------------------------------------------
  // AI-DRIVEN SMART ALERT SYSTEM (Proactive Safety Sentinel)
  // -------------------------------------------------------------------------
  private patientSmartAlerts: SmartAlert[] = [
    {
      id: 'alert-init-1',
      patientId: 'pat-main',
      type: 'DRUG_SYMPTOM_SIDE_EFFECT',
      severity: 'WARNING',
      title: 'تنبيه دوائي ذكي: ارتباط محتمل بين الدوار الصباحي وخافض الضغط (Lisinopril)',
      titleEn: 'Smart Alert: Potential link between morning lightheadedness and Lisinopril',
      summary:
        'تم رصد شكوى دوار خفيف صباحي متزامنة مع هبوط نسبي في قراءة ضغط الدم (114/74 مم زئبق). أدوية مثبطات ACE (ليسينوبريل 10mg) قد تحفز هبوط ضغط انتصابي طفيف (Orthostatic Hypotension) عند النهوض السريع من الفراش.',
      summaryEn:
        'Mild postural dizziness correlated with lower BP reading (114/74 mmHg) and Lisinopril 10mg morning schedule, indicating potential mild orthostatic dip.',
      triggerSource: 'SYMPTOM_LOG',
      triggerDetails: {
        medicationName: 'Lisinopril (ليسينوبريل) 10mg',
        symptomName: 'دوار خفيف صباحي عند النهوض',
        relatedVitals: ['ضغط الدم 114/74 مم زئبق'],
      },
      clinicalMechanism:
        'تثبيط الأنجيوتنسين 2 يمنع التقلص الوعائي التعويضي السريع عند الانتقال من وضعية الاستلقاء إلى الوقوف، مما يقلل مؤقتاً من ضغط التروية الدماغية.',
      potentialRisk: 'احتمال الشعور بالترنح أو السقوط إذا تم الوقوف بشكل مفاجئ، خصوصاً عند نقص السوائل في الجسم.',
      recommendedAction:
        'التمهل عند النهوض من السرير والجلوس لمدة دقيقة قبل الوقوف، المحافظة على شرب كوب ماء فور الاستيقاظ، وإبلاغ الطبيب المعالج إذا زادت حدة الأعراض لمراجعة جرعة 10mg.',
      citations: [
        'AHA/ACC 2024 Clinical Guidelines on Outpatient Blood Pressure & Orthostasis',
        'FDA MedWatch Safety Alert: Antihypertensive-Induced Postural Dizziness Protocol',
      ],
      disclaimer:
        'تنبيه سريري استرشادي: هذا التنبيه تم توليده استباقياً بواسطة محرك الذكاء الاصطناعي لليقظة الدوائية ولا يُعد تشخيصاً طبياً أو أمراً بوقف الدواء. يرجى دائماً مراجعة الطبيب المختص.',
      timestamp: '2026-10-06T08:05:00Z',
      status: 'ACTIVE',
      provenance: 'Lifex-AI Proactive Sentinel Engine (Pharmacovigilance)',
      modelUsed: 'gemini-3.8-flash',
    },
  ];

  public getSmartAlerts(patientId: string = 'pat-main'): SmartAlert[] {
    return this.patientSmartAlerts.filter((a) => a.patientId === patientId || !a.patientId);
  }

  public addSmartAlert(
    alert: Omit<SmartAlert, 'id' | 'timestamp' | 'status'> & {
      id?: string;
      status?: SmartAlert['status'];
      timestamp?: string;
    }
  ): SmartAlert {
    const id = alert.id || `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = alert.timestamp || new Date().toISOString();
    const newAlert: SmartAlert = {
      ...alert,
      id,
      timestamp,
      status: alert.status || 'ACTIVE',
    };

    // Avoid duplicate alerts for same trigger
    const existingIndex = this.patientSmartAlerts.findIndex(
      (a) =>
        a.patientId === newAlert.patientId &&
        a.type === newAlert.type &&
        a.triggerDetails.medicationName === newAlert.triggerDetails.medicationName &&
        a.triggerDetails.symptomName === newAlert.triggerDetails.symptomName
    );

    if (existingIndex >= 0) {
      this.patientSmartAlerts[existingIndex] = newAlert;
    } else {
      this.patientSmartAlerts.unshift(newAlert);
    }

    auditService.record({
      actorId: newAlert.patientId,
      actorRole: 'patient',
      actorName: 'نظام Lifex-AI لليقظة الدوائية',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'CREATE_SMART_ALERT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-AI-SMART-ALERT-AUDIT',
      provenance: newAlert.provenance || 'Lifex-AI Proactive Sentinel',
    });

    return newAlert;
  }

  public acknowledgeSmartAlert(id: string): boolean {
    const alert = this.patientSmartAlerts.find((a) => a.id === id);
    if (!alert) return false;

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date().toISOString();

    auditService.record({
      actorId: alert.patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له (إقرار بالتنبيه)',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'ACKNOWLEDGE_SMART_ALERT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-AI-SMART-ALERT-AUDIT',
      provenance: 'PatientPortal Smart Alert Interface',
    });

    return true;
  }

  public dismissSmartAlert(id: string): boolean {
    const alert = this.patientSmartAlerts.find((a) => a.id === id);
    if (!alert) return false;

    alert.status = 'RESOLVED';
    auditService.record({
      actorId: alert.patientId,
      actorRole: 'patient',
      actorName: 'مريض مصرح له (إغلاق التنبيه)',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: id,
      purpose: 'DISMISS_SMART_ALERT',
      outcome: 'SUCCESS',
      policyApplied: 'POL-AI-SMART-ALERT-AUDIT',
      provenance: 'PatientPortal Smart Alert Interface',
    });

    return true;
  }

  // -------------------------------------------------------------
  // INSURANCE COVERAGE & BILLING CLAIMS ENCLAVE
  // -------------------------------------------------------------
  private patientInsurancePolicies: InsurancePolicyRecord[] = [
    {
      id: 'pol-bupa-01',
      patientId: 'pat-main',
      providerName: 'بوبا العربية للتأمين التعاوني - Bupa Arabia',
      providerCode: 'BUPA-SA',
      policyNumber: 'BUPA-VIP-98421008-KSA',
      memberId: 'MEM-8849102-01',
      networkClass: 'VIP_PLATINUM',
      networkTierName: 'شبكة النخبة البلاتينية VIP (Platinum Healthcare)',
      coPayPercentage: 10,
      maxCoPayPerVisitSar: 50,
      annualDeductibleSar: 0,
      annualCoverageLimitSar: 500000,
      annualRemainingCoverageSar: 472500,
      startDate: '2026-01-01',
      expiryDate: '2026-12-31',
      isActive: true,
      tpaName: 'منصة نفيس الوطنية للتبادل الصحي الرقمي (NPHIES Gateway)',
      nphiesIntegrated: true,
      coveredBenefits: {
        telemedicineConsultations: true,
        inPersonSpecialist: true,
        cardiologyDiagnostics: true,
        endocrineLaboratory: true,
        chronicMedications: true,
        dentalCare: true,
        opticalCare: true,
        inpatientHospitalization: true,
      },
      emergencyApprovalHelpline: '800 244 0307',
    },
    {
      id: 'pol-tawuniya-02',
      patientId: 'pat-main',
      providerName: 'التعاونية للتأمين - Tawuniya Co.',
      providerCode: 'TAWUNIYA-01',
      policyNumber: 'TAW-GOLD-3391827-KSA',
      memberId: 'MEM-3391827-02',
      networkClass: 'GOLD_COMPREHENSIVE',
      networkTierName: 'الشبكة الذهبية الشاملة (Gold Tier)',
      coPayPercentage: 15,
      maxCoPayPerVisitSar: 75,
      annualDeductibleSar: 100,
      annualCoverageLimitSar: 250000,
      annualRemainingCoverageSar: 238000,
      startDate: '2026-02-01',
      expiryDate: '2027-01-31',
      isActive: false,
      tpaName: 'منصة واصل للتأمين الصحي Waseel',
      nphiesIntegrated: true,
      coveredBenefits: {
        telemedicineConsultations: true,
        inPersonSpecialist: true,
        cardiologyDiagnostics: true,
        endocrineLaboratory: true,
        chronicMedications: true,
        dentalCare: false,
        opticalCare: false,
        inpatientHospitalization: true,
      },
      emergencyApprovalHelpline: '9200 19990',
    },
  ];

  private patientBillingClaims: AutoCompletedBillingClaim[] = [
    {
      id: 'claim-101',
      patientId: 'pat-main',
      appointmentId: 'apt-prev-001',
      policyId: 'pol-bupa-01',
      policyNumber: 'BUPA-VIP-98421008-KSA',
      providerName: 'بوبا العربية للتأمين التعاوني',
      hospitalName: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
      doctorName: 'د. طارق العلي',
      doctorSpecialty: 'طب الأسرة والأمراض الباطنية المزمنة',
      serviceDate: '2026-09-18',
      clinicalReason: 'فحص دوري لمتابعة ضغط الدم والجرعات الدوائية',
      primaryIcd10Code: 'I10',
      primaryIcd10Description: 'ارتفاع ضغط الدم الأساسي (Essential Primary Hypertension)',
      cptServiceCodes: [
        { code: '99214', description: 'كشفية عيادة طب باطني تخصصي (مستوى 4)', standardFeeSar: 350, coveredPortionSar: 315 },
        { code: '80053', description: 'لوحة الفحوصات الأيضية الشاملة CMP', standardFeeSar: 200, coveredPortionSar: 180 },
      ],
      totalClaimAmountSar: 550,
      patientCoPayShareSar: 50,
      insurancePayableShareSar: 500,
      status: 'PRE_APPROVED',
      claimSubmissionChannel: 'NPHIES_ELECTRONIC_GATEWAY',
      autoCompletedAt: '2026-09-18T10:30:00Z',
      aiAutoCompleteRationaleAr: 'تم التوليد الآلي للمطالبة استناداً إلى موعد المريض المسجل ومطابقة الأكواد السريرية لنفيس.',
      medicalNecessitySummaryAr: 'ضرورة سريرية مثبتة لمراقبة اعتلال الأوعية وضبط جرعة مثبطات الإنزيم المحول للأنجيوتنسين.',
      patientSignatureTimestamp: '2026-09-18T10:32:00Z',
    },
  ];

  public getPatientInsurancePolicies(patientId: string = 'pat-main'): InsurancePolicyRecord[] {
    return this.patientInsurancePolicies.filter((p) => p.patientId === patientId);
  }

  public getActiveInsurancePolicy(patientId: string = 'pat-main'): InsurancePolicyRecord | undefined {
    return this.patientInsurancePolicies.find((p) => p.patientId === patientId && p.isActive);
  }

  public updateInsurancePolicy(policyId: string, updates: Partial<InsurancePolicyRecord>, patientId: string = 'pat-main'): InsurancePolicyRecord | null {
    const idx = this.patientInsurancePolicies.findIndex((p) => p.id === policyId && p.patientId === patientId);
    if (idx === -1) return null;

    if (updates.isActive) {
      // Deactivate others for this patient
      this.patientInsurancePolicies.forEach((p) => {
        if (p.patientId === patientId) p.isActive = false;
      });
    }

    this.patientInsurancePolicies[idx] = {
      ...this.patientInsurancePolicies[idx],
      ...updates,
    };

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: policyId,
      purpose: 'INSURANCE_POLICY_UPDATE',
      outcome: 'SUCCESS',
      policyApplied: 'POL-INSURANCE-COVERAGE-ENCLAVE',
      provenance: 'PatientPortal Insurance Coverage Manager',
    });

    return this.patientInsurancePolicies[idx];
  }

  public getPatientBillingClaims(patientId: string = 'pat-main'): AutoCompletedBillingClaim[] {
    return this.patientBillingClaims.filter((c) => c.patientId === patientId);
  }

  public saveBillingClaim(claim: Omit<AutoCompletedBillingClaim, 'id' | 'autoCompletedAt'> & { id?: string }): AutoCompletedBillingClaim {
    const finalClaim: AutoCompletedBillingClaim = {
      ...claim,
      id: claim.id || `claim-${Date.now()}`,
      autoCompletedAt: new Date().toISOString(),
    };

    const idx = this.patientBillingClaims.findIndex((c) => c.id === finalClaim.id);
    if (idx >= 0) {
      this.patientBillingClaims[idx] = finalClaim;
    } else {
      this.patientBillingClaims.unshift(finalClaim);
    }

    auditService.record({
      actorId: finalClaim.patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: finalClaim.id,
      purpose: 'INSURANCE_CLAIM_AUTO_COMPLETION',
      outcome: 'SUCCESS',
      policyApplied: 'POL-AI-BILLING-CLAIM-GOVERNANCE',
      provenance: 'AI Automated Billing & Pre-Authorization Engine (NPHIES/FHIR Claim)',
    });

    return finalClaim;
  }

  public updateClaimStatus(claimId: string, status: ClaimStatus, patientId: string = 'pat-main'): AutoCompletedBillingClaim | null {
    const idx = this.patientBillingClaims.findIndex((c) => c.id === claimId && c.patientId === patientId);
    if (idx === -1) return null;

    this.patientBillingClaims[idx].status = status;
    if (status === 'SUBMITTED') {
      this.patientBillingClaims[idx].patientSignatureTimestamp = new Date().toISOString();
    }

    auditService.record({
      actorId: patientId,
      actorRole: 'patient',
      actorName: 'المريض المصرح',
      action: 'WRITE',
      resourceType: 'PATIENT_RECORD',
      resourceId: claimId,
      purpose: `INSURANCE_CLAIM_STATUS_${status}`,
      outcome: 'SUCCESS',
      policyApplied: 'POL-AI-BILLING-CLAIM-GOVERNANCE',
      provenance: 'PatientPortal Billing Claim Dispatcher',
    });

    return this.patientBillingClaims[idx];
  }

  public getSmartAlertStats(patientId: string = 'pat-main'): SmartAlertStats {
    const alerts = this.getSmartAlerts(patientId);
    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
    const warningCount = alerts.filter(
      (a) => (a.severity === 'WARNING' || a.severity === 'MODERATE') && a.status === 'ACTIVE'
    ).length;
    const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
    const unacknowledgedCount = alerts.filter((a) => a.status === 'ACTIVE' && !a.acknowledgedAt).length;

    return {
      totalAlerts: alerts.length,
      criticalCount,
      warningCount,
      activeCount,
      unacknowledgedCount,
    };
  }
}

export const dataService = new DataService();

