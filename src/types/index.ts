/**
 * Lifex-AI Global Health Network
 * Version: v0.1.0
 * Official Architectural Domain Contracts
 * 
 * Data Ownership Axiom:
 * Source ≠ Canonical Owner ≠ Consumer ≠ Projection
 */

export type UserRole =
  | 'patient'
  | 'family'
  | 'doctor'
  | 'nurse'
  | 'laboratory'
  | 'pharmacy'
  | 'hospital'
  | 'researcher'
  | 'educator'
  | 'administrator'
  | 'support'
  | 'organization';

export type Language = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light' | 'contrast';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  avatar?: string;
  organizationId?: string;
  is2FAVerified: boolean;
  activeDeviceId: string;
  createdAt: string;
}

// -------------------------------------------------------------
// AUDIT LOG (Immutable trail)
// -------------------------------------------------------------
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  actorName: string;
  action: 'READ' | 'WRITE' | 'EXPORT' | 'REVOKE_CONSENT' | 'EMERGENCY_ACCESS' | 'AI_QUERY' | 'LOGIN' | 'FAILED_ACCESS';
  resourceType: 'PATIENT_RECORD' | 'LAB_RESULT' | 'PRESCRIPTION' | 'IMAGING' | 'DEVICE_TELEMETRY' | 'SYSTEM_CONFIG' | 'CONSENT';
  resourceId: string;
  purpose: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  policyApplied: string;
  ipAddress?: string;
  provenance: string;
}

// -------------------------------------------------------------
// CONSENT MANAGEMENT
// -------------------------------------------------------------
export interface ConsentRecord {
  id: string;
  patientId: string;
  granteeId: string; // Doctor ID or Hospital ID
  granteeName: string;
  granteeRole: UserRole;
  scope: 'FULL_PROJECTION' | 'VITALS_ONLY' | 'LABS_ONLY' | 'EMERGENCY_ONLY' | 'MEDICATIONS_ONLY';
  purpose: 'TREATMENT' | 'SECOND_OPINION' | 'EMERGENCY' | 'RESEARCH_ANONYMIZED';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

// -------------------------------------------------------------
// PATIENT DOMAIN (Projections vs Canonical)
// -------------------------------------------------------------
export interface VitalReading {
  id: string;
  timestamp: string;
  type: 'HEART_RATE' | 'BLOOD_PRESSURE' | 'SPO2' | 'GLUCOSE' | 'TEMPERATURE' | 'RESPIRATORY_RATE';
  value: string;
  unit: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  deviceId?: string;
  isVerifiedByClinician: boolean;
}

export interface VitalTrendDataPoint {
  timestamp: string;
  label: string;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  spO2: number;
  glucose: number;
  temperature: number;
  notes?: string;
  isAnomaly?: boolean;
  anomalyType?: 'TACHYCARDIA' | 'BRADYCARDIA' | 'HYPERTENSIVE_SPIKE' | 'HYPOTENSION' | 'HYPOXIA' | 'HYPERGLYCEMIA' | 'HYPOGLYCEMIA';
  meanArterialPressure?: number;
  pulsePressure?: number;
}

export type VitalTimeRange = '24h' | '48h' | '7d' | '30d';

export type VitalSimulationScenario =
  | 'BASELINE'
  | 'HYPERTENSIVE_VARIATION'
  | 'POST_EXERCISE_RECOVERY'
  | 'NOCTURNAL_DIP'
  | 'MEDICATION_IMPACT';

export interface VitalTrendsGenerationInput {
  patientId: string;
  timeRange?: VitalTimeRange;
  scenario?: VitalSimulationScenario;
  baselineProfile?: {
    systolicTarget?: number;
    diastolicTarget?: number;
    restingHeartRate?: number;
    conditions?: string[];
    medications?: string[];
  };
}

export interface VitalTrendsGenerationResult {
  generatedAt: string;
  patientId: string;
  timeRange: VitalTimeRange;
  scenario: VitalSimulationScenario;
  dataPoints: VitalTrendDataPoint[];
  summary: {
    avgHeartRate: number;
    minHeartRate: number;
    maxHeartRate: number;
    avgSystolic: number;
    maxSystolic: number;
    minSystolic: number;
    avgDiastolic: number;
    maxDiastolic: number;
    minDiastolic: number;
    avgMeanArterialPressure: number;
    avgPulsePressure: number;
    avgGlucose: number;
    avgSpO2: number;
    stabilityIndex: number;
    anomaliesCount: number;
  };
  clinicalInterpretationAr: string;
  clinicalInterpretationEn: string;
  source: 'GEMINI_AI' | 'DETERMINISTIC_PHYSIOLOGICAL_ENGINE';
  modelUsed?: string;
}

export interface MedicationItem {
  id: string;
  prescriptionId: string;
  name: string;
  dosage: string;
  frequency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  prescribedByDoctor: string;
  prescribedAt: string;
  dispensedByPharmacy?: string;
  dispensedAt?: string;
  adherencePercentage: number;
}

export interface MedicationScheduleEntry {
  id: string;
  patientId: string;
  medicationId?: string;
  name: string;
  dosage: string;
  timeSlot: string; // e.g. "08:00", "13:30", "20:00", "22:00"
  period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
  instructions?: string;
  mealContext?: 'BEFORE_MEAL' | 'WITH_MEAL' | 'AFTER_MEAL' | 'ANY';
  reminderEnabled: boolean;
  reminderAdvanceMinutes: number; // e.g. 0, 10, 15
  daysOfWeek?: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[];
  category?: 'PRESCRIPTION' | 'SUPPLEMENT' | 'PRN_AS_NEEDED';

  // Refill Tracker fields
  currentPillCount?: number; // Remaining pills/units in current supply
  totalPillCapacity?: number; // Total units per package/bottle (e.g. 30, 60, 90)
  dosageQuantityPerIntake?: number; // Pills consumed per scheduled dose (default: 1)
  dosesPerDay?: number; // Number of intakes per day (default: 1)
  refillThresholdDays?: number; // Alert threshold in days of remaining supply (default: 5 or 7 days)
  refillThresholdPills?: number; // Alert threshold in pills (e.g. 5)
  rxNumber?: string; // Prescription reference number
  pharmacyName?: string; // Designated dispensing pharmacy
  pharmacyPhone?: string; // Pharmacy contact number
  lastRefillDate?: string; // ISO date or YYYY-MM-DD
  refillOrderPending?: boolean; // Whether an active refill request is waiting for pharmacy delivery
}

export type RefillUrgencyLevel = 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'EMPTY';

export interface MedicationRefillCalculation {
  scheduleId: string;
  medicationName: string;
  dosage: string;
  currentPillCount: number;
  totalPillCapacity: number;
  dosageQuantityPerIntake: number;
  dosesPerDay: number;
  dailyConsumption: number;
  daysRemaining: number;
  estimatedDepletionDate: string;
  refillThresholdDays: number;
  urgency: RefillUrgencyLevel;
  needsRefill: boolean;
  isOverdue: boolean;
  rxNumber?: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
  lastRefillDate?: string;
  refillOrderPending: boolean;
}

export interface RefillSummaryStats {
  totalTrackedMedications: number;
  refillsNeededCount: number;
  criticalLowCount: number;
  totalPillsInStock: number;
  averageDaysRemaining: number;
  pendingOrdersCount: number;
}

export interface MedicationLogEntry {
  id: string;
  patientId: string;
  scheduleEntryId?: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  loggedAt: string;
  status: 'TAKEN' | 'SKIPPED' | 'DELAYED';
  notes?: string;
  mealContext?: string;
  takenDoseTime?: string;
}

// -------------------------------------------------------------
// PUSH NOTIFICATION SCHEDULING SYSTEM (Medication Alerts)
// -------------------------------------------------------------
export interface ScheduledMedicationPushAlert {
  id: string;
  patientId: string;
  scheduleId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // HH:mm e.g. "08:30"
  targetTimestamp: string; // ISO string
  advanceMinutes: number;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
  instructions: string;
  mealContext: 'BEFORE_MEAL' | 'WITH_MEAL' | 'AFTER_MEAL' | 'ANY';
  status: 'PENDING' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'SNOOZED' | 'MISSED';
  channel: 'PUSH_NOTIFICATION' | 'IN_APP_BANNER' | 'AUDIO_CHIME';
  triggeredAt?: string;
  acknowledgedAt?: string;
  snoozedUntil?: string;
  doctorNotes?: string;
  adherenceImpact: 'ON_TIME' | 'DELAYED' | 'UNRECORDED';
  rxNumber?: string;
}

export interface PushNotificationSchedulerConfig {
  patientId: string;
  browserPushEnabled: boolean;
  soundChimeEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeDurationMinutes: number;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
  permissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
}

export interface MedicationAdherenceTrendPoint {
  date: string;
  dayName: string;
  scheduled: number;
  taken: number;
  skipped: number;
  adherencePct: number;
}

export interface MedicationReminderSettings {
  browserNotifications: boolean;
  audioAlerts: boolean;
  advanceMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface PatientNotificationSettings {
  patientId: string;
  channels: {
    sms: {
      enabled: boolean;
      phoneNumber: string;
      verified: boolean;
    };
    email: {
      enabled: boolean;
      emailAddress: string;
      verified: boolean;
    };
    inApp: {
      enabled: boolean;
      soundEnabled: boolean;
      browserPushEnabled: boolean;
    };
  };
  alerts: {
    criticalLabResults: {
      sms: boolean;
      email: boolean;
      inApp: boolean;
      urgentThresholdOnly: boolean;
    };
    medicationReminders: {
      sms: boolean;
      email: boolean;
      inApp: boolean;
      advanceMinutes: number;
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
    };
    emergencyEscalation: {
      sms: boolean;
      email: boolean;
      inApp: boolean;
      notifyCaregiver: boolean;
      caregiverPhone: string;
    };
  };
  lastUpdated: string;
}

export interface AllergyItem {
  id: string;
  allergen: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  reaction: string;
  diagnosedDate: string;
}

export interface ChronicCondition {
  id: string;
  name: string;
  icdCode?: string;
  status: 'MANAGED' | 'UNCONTROLLED' | 'REMISSION';
  diagnosedYear: string;
}

export interface HealthTimelineEvent {
  id: string;
  timestamp: string;
  type: 'ENCOUNTER' | 'LAB_RESULT' | 'PRESCRIPTION' | 'IMAGING' | 'EMERGENCY' | 'VITAL_ALERT';
  title: string;
  summary: string;
  providerName: string;
  location: string;
  sourceDomain: 'HOSPITAL' | 'LAB' | 'PHARMACY' | 'CLINIC' | 'PATIENT_DEVICE';
  isCanonicalRecordOriginal: boolean;
}

// -------------------------------------------------------------
// CLINICAL DOMAINS (Doctor, Hospital, Laboratory, Pharmacy)
// -------------------------------------------------------------
export interface ClinicalEncounter {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  reasonForVisit: string;
  subjectiveAssessment: string;
  objectiveFindings: string;
  assessmentPlan: string;
  consentToken: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface LabResultRecord {
  id: string;
  testCode: string;
  testName: string;
  patientId: string;
  orderedByDoctorId: string;
  specimenType: string;
  collectedAt: string;
  reportedAt: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';
  canonicalLabOwner: string;
  hl7FhirIdentifier: string;
}

export interface PharmacyDispenseRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  medicationName: string;
  batchLotNumber: string;
  expiryDate: string;
  quantityDispensed: number;
  dispensingPharmacistId: string;
  dispensedAt: string;
  isRecalled: boolean;
  canonicalPharmacyOwner: string;
}

export interface MedicalDeviceInstance {
  id: string;
  serialNumber: string;
  deviceModel: string;
  deviceCategory: 'ECG_MONITOR' | 'PULSE_OXIMETER' | 'CONTINUOUS_GLUCOSE' | 'BLOOD_PRESSURE_CUFF' | 'VENTILATOR';
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'BATTERY_LOW' | 'CALIBRATING';
  batteryPercentage: number;
  firmwareVersion: string;
  lastTelemetryAt: string;
  assignedPatientId: string;
  latestReading: string;
}

// -------------------------------------------------------------
// AI INTELLIGENCE SPECIFICATION
// Rule: AI ≠ Doctor | AI ≠ Diagnosis | AI ≠ Authority
// -------------------------------------------------------------
export interface AiQueryResponse {
  queryId: string;
  timestamp: string;
  model: string;
  modelVersion: string;
  category: 'INFORMATION_ASSIST' | 'LITERATURE_SEARCH' | 'DOCUMENT_SUMMARY' | 'TRIAGE_PRECHECK';
  responseContent: string;
  confidenceScore: number; // 0.0 to 1.0
  uncertaintyScore: number; // 0.0 to 1.0
  sources: Array<{ title: string; url?: string; pmid?: string }>;
  limitations: string[];
  provenance: string;
  medicalDisclaimer: string;
}

// -------------------------------------------------------------
// EMERGENCY DOMAIN
// -------------------------------------------------------------
export interface EmergencyIncident {
  id: string;
  patientId: string;
  patientName: string;
  status: 'ACTIVE_DISPATCH' | 'HOSPITAL_COORDINATION' | 'PARAMEDICS_ON_SCENE' | 'RESOLVED';
  severity: 'CRITICAL_CODE_RED' | 'URGENT_YELLOW' | 'EVALUATION_GREEN';
  initiatedAt: string;
  locationCoordinates: { lat: number; lng: number; address: string };
  assignedHospitalId: string;
  assignedHospitalName: string;
  ambulanceUnitId: string;
  etaMinutes: number;
  vitalsAtDispatch: string;
}

// -------------------------------------------------------------
// GLOBAL SEARCH
// -------------------------------------------------------------
export interface SearchResultItem {
  id: string;
  category: 'DOCTOR' | 'HOSPITAL' | 'LAB' | 'PHARMACY' | 'CLINICAL_GUIDELINE' | 'RESEARCH_PAPER';
  title: string;
  subtitle: string;
  rating?: number;
  location?: string;
  tags: string[];
  authorizedRoles: UserRole[];
}

// -------------------------------------------------------------
// TELEMEDICINE DOMAIN
// -------------------------------------------------------------
export interface TelemedicineDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  avatarUrl?: string;
  rating: number;
  consultationFee: string;
  status: 'ONLINE' | 'IN_CONSULTATION' | 'OFFLINE';
  languages: string[];
}

export interface TelemedicineChatMessage {
  id: string;
  sender: 'PATIENT' | 'DOCTOR' | 'SYSTEM';
  text: string;
  timestamp: string;
  type?: 'TEXT' | 'VITALS_SHARE' | 'PRESCRIPTION_ATTACHED';
  metadata?: Record<string, any>;
}

export interface TelemedicineConsultationRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  scheduledAt: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED';
  chiefComplaint: string;
  clinicalSummary: string;
  prescriptions: string[];
  followUpDate?: string;
}

// -------------------------------------------------------------
// APPOINTMENT SCHEDULING DOMAIN (AI-Optimized Slots)
// -------------------------------------------------------------
export interface PhysicianSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string; // HH:mm e.g. "09:30"
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  consultationType: 'IN_PERSON' | 'TELEMEDICINE' | 'BOTH';
  isAvailable: boolean;
  aiSuggested?: boolean;
  aiOptimalityScore?: number; // 0 - 100
  aiRecommendationReasonAr?: string;
  aiRecommendationReasonEn?: string;
  clinicalUrgencyMatch?: 'HIGH' | 'MEDIUM' | 'ROUTINE';
}

export interface PatientAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  consultationType: 'IN_PERSON' | 'TELEMEDICINE';
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  reasonForVisit: string;
  clinicalNotes?: string;
  aiSuggestedSlot: boolean;
  aiCompatibilityScore?: number;
  preparationInstructions?: string[];
  reminderEnabled: boolean;
  bookedAt: string;
}

export interface AppointmentSuggestionRequest {
  patientId: string;
  preferredDoctorId?: string;
  specialty?: string;
  consultationType?: 'IN_PERSON' | 'TELEMEDICINE' | 'ANY';
  reasonForVisit?: string;
  patientHistoryContext?: {
    conditions?: string[];
    recentVitalsSummary?: string;
    recentSymptoms?: string[];
    medications?: string[];
    lastVisitDate?: string;
    urgencyLevel?: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  };
}

export interface AppointmentSuggestionResult {
  suggestedSlots: PhysicianSlot[];
  patientClinicalProfileSummaryAr: string;
  optimalCareStrategyAr: string;
  recommendedPreparationAr: string[];
  suggestedUrgency: 'IMMEDIATE' | 'WITHIN_48H' | 'THIS_WEEK' | 'ROUTINE';
  modelUsed?: string;
}

// -------------------------------------------------------------
// CLINICAL CONTEXT CHAT (AI-Powered Patient Consultation)
// -------------------------------------------------------------
export interface ClinicalChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  confidenceScore?: number;
  sources?: Array<{ title: string; url?: string; pmid?: string }>;
  suggestedFollowUps?: string[];
  clinicalFocus?: 'VITALS' | 'MEDICATION' | 'ADHERENCE' | 'INTERACTION' | 'LIFESTYLE' | 'GENERAL';
  hasWarningAlert?: boolean;
  warningAlertMessage?: string;
}

export interface ClinicalPatientContextSummary {
  patientId: string;
  patientName: string;
  bloodType?: string;
  conditions: Array<{ name: string; icdCode?: string; status: string }>;
  allergies: Array<{ allergen: string; reaction: string; severity: string }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    status: string;
    adherencePercentage: number;
  }>;
  recentVitalsSummary: {
    latestBloodPressure?: string;
    systolicAvg?: number;
    diastolicAvg?: number;
    latestHeartRate?: number;
    heartRateAvg?: number;
    latestGlucose?: number;
    glucoseAvg?: number;
    latestSpO2?: number;
    spO2Avg?: number;
    summaryText: string;
  };
  medicationSchedules: Array<{
    name: string;
    dosage: string;
    timeSlot: string;
    period: string;
    instructions?: string;
    mealContext?: string;
    reminderEnabled: boolean;
  }>;
  recentMedicationLogs: Array<{
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    status: string;
    loggedAt: string;
    notes?: string;
  }>;
  overallAdherencePct: number;
}

// -------------------------------------------------------------
// HEALTH GOALS & PERSONALIZED OBJECTIVES
// -------------------------------------------------------------
export type HealthGoalCategory =
  | 'ACTIVITY'
  | 'HYDRATION'
  | 'MEDICATION'
  | 'VITALS'
  | 'NUTRITION'
  | 'SLEEP'
  | 'MINDFULNESS';

export type HealthGoalFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface GoalProgressEntry {
  id: string;
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
  loggedAt: string; // ISO string
}

export interface HealthGoal {
  id: string;
  patientId: string;
  title: string;
  titleEn?: string;
  description?: string;
  category: HealthGoalCategory;
  frequency: HealthGoalFrequency;
  targetValue: number;
  currentValue: number;
  unit: string;
  unitEn?: string;
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED';
  streakDays: number;
  isCustom: boolean;
  colorTheme?: string;
  quickIncrements?: number[];
  createdAt: string;
  updatedAt: string;
  progressHistory: GoalProgressEntry[];
}

export interface HealthGoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgressPct: number;
  longestStreak: number;
  todayLoggedCount: number;
}

export interface CreateGoalInput {
  title: string;
  titleEn?: string;
  description?: string;
  category: HealthGoalCategory;
  frequency: HealthGoalFrequency;
  targetValue: number;
  currentValue?: number;
  unit: string;
  unitEn?: string;
  targetDate?: string;
  quickIncrements?: number[];
  isCustom?: boolean;
}

// -------------------------------------------------------------
// WEEKLY HEALTH SUMMARY (AI GENERATED)
// -------------------------------------------------------------
export interface WeeklyHealthSummaryMetrics {
  weeklyAdherencePct: number;
  streakDays: number;
  totalDosesScheduled: number;
  totalDosesTaken: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgBloodPressure: string;
  avgHeartRate: number;
  avgGlucose: number;
  avgSpO2: number;
  status: 'EXCELLENT' | 'STABLE' | 'NEEDS_ATTENTION';
  vitalStabilityScore: number; // 0 - 100
}

export interface WeeklyHealthSummaryResponse {
  id: string;
  patientId: string;
  patientName: string;
  generatedAt: string;
  summary: string;
  model: string;
  metrics: WeeklyHealthSummaryMetrics;
  keyTakeaways: string[];
  disclaimer: string;
}

// -------------------------------------------------------------
// PATIENT SYMPTOMS & LOGGING
// -------------------------------------------------------------
export type SymptomSeverity = 'MILD' | 'MODERATE' | 'SEVERE';
export type SymptomStatus = 'ACTIVE' | 'RESOLVED' | 'IMPROVING' | 'WORSENING';

export interface PatientSymptomLog {
  id: string;
  patientId: string;
  symptomName: string;
  symptomNameEn?: string;
  severity: SymptomSeverity;
  onsetAt: string;
  duration?: string;
  notes?: string;
  status: SymptomStatus;
  loggedAt: string;
  associatedFactors?: string[];
  flaggedAlertIds?: string[];
}

export interface CreateSymptomInput {
  symptomName: string;
  symptomNameEn?: string;
  severity: SymptomSeverity;
  onsetAt?: string;
  duration?: string;
  notes?: string;
  status?: SymptomStatus;
  associatedFactors?: string[];
}

// -------------------------------------------------------------
// INTERACTIVE SYMPTOM ASSESSMENT & GEMINI CLINICAL TRIAGE
// -------------------------------------------------------------
export type TriageUrgencyLevel =
  | 'EMERGENCY'
  | 'URGENT'
  | 'SEMI_URGENT'
  | 'NON_URGENT_HOME_CARE';

export type TriageCareSetting =
  | 'EMERGENCY_ROOM'
  | 'URGENT_CARE'
  | 'PRIMARY_CLINIC'
  | 'TELEHEALTH'
  | 'HOME_CARE';

export interface SymptomAssessmentInput {
  patientId: string;
  primarySymptom: string;
  primarySymptomEn?: string;
  secondarySymptoms?: string[];
  severityLevel: 'MILD' | 'MODERATE' | 'SEVERE' | 'INCAPACITATING';
  painScale?: number; // 1 - 10
  onset: string;
  progression: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'FLUCTUATING';
  bodyRegion?: string;
  notes?: string;
  redFlagsIdentified?: string[];
  vitalContext?: {
    bloodPressure?: string;
    heartRate?: number;
    glucose?: number;
    spO2?: number;
    temperature?: number;
  };
  relevantMedications?: string[];
  relevantConditions?: string[];
}

export interface SymptomDifferential {
  conditionName: string;
  conditionNameEn?: string;
  likelihood: 'HIGH' | 'POSSIBLE' | 'LOW';
  rationale: string;
}

export interface SymptomTriageResult {
  assessmentId: string;
  patientId: string;
  timestamp: string;
  urgencyLevel: TriageUrgencyLevel;
  urgencyBadgeText: string;
  urgencyBadgeTextEn: string;
  estimatedActionTimeframe: string;
  recommendedCareSetting: TriageCareSetting;
  chiefComplaintSummary: string;
  clinicalTriageAdvice: string;
  clinicalReasoning: string;
  differentialConsiderations: SymptomDifferential[];
  redFlagWarnings: string[];
  immediateActionSteps: string[];
  questionsForDoctor: string[];
  medicationSafetyImpact?: {
    alertPresent: boolean;
    relatedMedications: string[];
    clinicalNote: string;
  };
  homeCareGuidelines?: string[];
  modelUsed: string;
  confidenceScore: number;
  citations: Array<{ title: string; source?: string; pmid?: string }>;
  disclaimer: string;
  telehealthRecommended: boolean;
  rawAiText?: string;
}

// -------------------------------------------------------------
// AI-DRIVEN SMART ALERT SYSTEM (Proactive Pharmacovigilance)
// -------------------------------------------------------------
export type SmartAlertSeverity = 'CRITICAL' | 'WARNING' | 'MODERATE' | 'INFO' | 'SAFE';

export type SmartAlertType =
  | 'DRUG_DRUG_INTERACTION'
  | 'ADVERSE_TREND'
  | 'DRUG_SYMPTOM_SIDE_EFFECT'
  | 'CONTRAINDICATION'
  | 'ALLERGY_CONFLICT'
  | 'VITAL_DRIFT';

export interface SmartAlert {
  id: string;
  patientId: string;
  type: SmartAlertType;
  severity: SmartAlertSeverity;
  title: string;
  titleEn?: string;
  summary: string;
  summaryEn?: string;
  triggerSource: 'NEW_MEDICATION' | 'SYMPTOM_LOG' | 'VITALS_TREND' | 'PROACTIVE_SCAN';
  triggerDetails: {
    medicationName?: string;
    symptomName?: string;
    interactingWith?: string[];
    relatedVitals?: string[];
  };
  clinicalMechanism: string;
  potentialRisk: string;
  recommendedAction: string;
  citations?: string[];
  disclaimer: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedAt?: string;
  provenance: string;
  modelUsed?: string;
}

export interface SmartAlertAnalysisRequest {
  patientId: string;
  triggerType: 'NEW_MEDICATION' | 'SYMPTOM_LOG' | 'FULL_SCAN';
  newMedication?: {
    name: string;
    dosage?: string;
    category?: string;
    instructions?: string;
  };
  symptom?: {
    name: string;
    severity: SymptomSeverity;
    onsetAt?: string;
    duration?: string;
    notes?: string;
    associatedFactors?: string[];
  };
}

export interface SmartAlertAnalysisResult {
  alerts: SmartAlert[];
  hasCriticalAlert: boolean;
  hasWarningAlert: boolean;
  evaluatedAt: string;
  modelUsed: string;
  summaryMessage: string;
  summaryMessageEn?: string;
  disclaimer: string;
  auditLogId?: string;
}

export interface SmartAlertStats {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  activeCount: number;
  unacknowledgedCount: number;
}

// -------------------------------------------------------------
// ADMIN ACTIVITY LOG, SYSTEM EVENTS & DIAGNOSTIC ALERTS
// -------------------------------------------------------------
export type ActivityLogCategory = 'PORTAL_ACCESS' | 'SYSTEM_EVENT' | 'DEVICE_DIAGNOSTIC';
export type ActivityLogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  category: ActivityLogCategory;
  level: ActivityLogLevel;
  title: string;
  description: string;
  actor?: {
    id: string;
    name: string;
    role: string;
    ip?: string;
    portal?: string;
  };
  device?: {
    id: string;
    model: string;
    category: string;
    serialNumber: string;
    batteryPercentage?: number;
    firmware?: string;
    latestReading?: string;
  };
  systemContext?: {
    nodeName: string;
    action: string;
    latencyMs?: number;
    policyApplied?: string;
    status: string;
  };
  diagnosticAlert?: {
    alertType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    parameter: string;
    threshold: string;
    actualValue: string;
    recommendedAction: string;
    acknowledged?: boolean;
  };
  provenance: string;
}

// -------------------------------------------------------------
// SYSTEM HEALTH & ADMINISTRATIVE REPORT GENERATOR
// -------------------------------------------------------------
export interface SystemHealthNode {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latency: string;
  latencyMs: number;
  uptime: string;
  throughput: string;
  lastPing: string;
  type: 'GATEWAY' | 'ENGINE' | 'LEDGER' | 'BROKER' | 'SANDBOX';
}

export interface SystemHealthReportData {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  scope: string;
  overallHealthScore: number;
  nodes: SystemHealthNode[];
  devicesSummary: {
    totalDevices: number;
    onlineDevices: number;
    activeAlerts: number;
    avgBattery: number;
  };
  securitySummary: {
    e2eeCompliancePct: number;
    zeroTrustDenials: number;
    totalAuditsLogged: number;
    activePolicyRules: number;
  };
  diagnosticEfficiency: {
    avgLabTATMinutes: number;
    avgTelemetryLatencyMs: number;
    aiConcordancePct: number;
    criticalAlertResolutionMinutes: number;
  };
  recentIncidents: ActivityLogEntry[];
  recommendations: string[];
}

// -------------------------------------------------------------
// CLINICAL INSIGHTS & POPULATION HEALTH METRICS
// -------------------------------------------------------------
export interface PopulationConditionTrend {
  condition: string;
  conditionAr: string;
  prevalencePct: number;
  patientCount: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  color: string;
}

export interface PopulationVitalMonthlyBenchmark {
  month: string;
  avgSystolicBP: number;
  avgDiastolicBP: number;
  avgHeartRate: number;
  avgGlucose: number;
  targetSystolic: number;
  targetGlucose: number;
}

export interface LabTurnaroundMetric {
  testName: string;
  testCode: string;
  actualTATMinutes: number;
  targetTATMinutes: number;
  volume: number;
  efficiencyPct: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'DELAYED';
}

export interface TelemetryThroughputPoint {
  time: string;
  messagesPerSec: number;
  latencyMs: number;
  activeStreams: number;
}

export interface ClinicalInsightsOverview {
  totalPopulationMonitored: number;
  averageDiagnosticTATMinutes: number;
  telemetryIngestReliabilityPct: number;
  aiDiagnosticConcordancePct: number;
  activeChronicRiskWatchCount: number;
  conditionDistribution: PopulationConditionTrend[];
  monthlyVitalBenchmarks: PopulationVitalMonthlyBenchmark[];
  labTurnaroundMetrics: LabTurnaroundMetric[];
  telemetryThroughput: TelemetryThroughputPoint[];
}

// -------------------------------------------------------------
// BIOMETRIC AUTHENTICATION & HARDWARE ENCLAVE
// -------------------------------------------------------------
export type BiometricAuthMethod = 'FINGERPRINT' | 'FACE_ID' | 'PIN';

export interface BiometricAuthState {
  isVerified: boolean;
  verifiedAt: string | null;
  method: BiometricAuthMethod | null;
  expiresAt: string | null;
  deviceId: string;
}

// -------------------------------------------------------------
// PHARMACY AI DRUG-DRUG INTERACTION CROSS-REFERENCE
// -------------------------------------------------------------
export type InteractionSeverity = 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'SAFE';

export interface DrugDrugInteractionPair {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  interactionTitle: string;
  interactionTitleEn?: string;
  mechanism: string;
  clinicalImpact: string;
  managementRecommendation: string;
  evidenceLevel: 'HIGH' | 'MODERATE' | 'THEORETICAL';
  citations: string[];
}

export interface DrugInteractionAnalysisResult {
  analysisId: string;
  timestamp: string;
  analyzedMedications: string[];
  overallRiskLevel: InteractionSeverity;
  totalInteractionsFound: number;
  hasCriticalInteraction: boolean;
  interactions: DrugDrugInteractionPair[];
  specialClinicalPrecautions: string[];
  summary: string;
  summaryEn?: string;
  provenance: string;
  modelUsed: string;
  medicalDisclaimer: string;
}

// -------------------------------------------------------------
// REAL-TIME BIOMETRIC ANOMALY NOTIFICATION SYSTEM FOR DOCTOR PORTAL
// -------------------------------------------------------------
export type BiometricAnomalySeverity = 'CRITICAL' | 'WARNING' | 'ATTENTION';
export type BiometricAnomalyStatus = 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'TRIAGED' | 'DISMISSED';

export type BiometricAnomalyType =
  | 'ARRHYTHMIA_TACHYCARDIA'
  | 'ARRHYTHMIA_BRADYCARDIA'
  | 'HYPERTENSIVE_CRISIS'
  | 'HYPOXEMIA_DESATURATION'
  | 'SEVERE_HYPOGLYCEMIA'
  | 'ACUTE_HYPERGLYCEMIA'
  | 'FEBRILE_SPIKE'
  | 'RESPIRATORY_DEPRESSION';

export interface PhysiologicalTelemetryPoint {
  timestamp: string;
  value: number;
}

export interface BiometricAnomalyAlert {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  consentToken: string;
  deviceSource: {
    deviceId: string;
    model: string;
    category: string;
    batteryPercentage?: number;
    signalQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  anomalyType: BiometricAnomalyType;
  title: string;
  titleEn: string;
  severity: BiometricAnomalySeverity;
  status: BiometricAnomalyStatus;
  detectedAt: string; // ISO timestamp
  parameter: string; // e.g. "معدل ضربات القلب (Heart Rate)"
  unit: string; // e.g. "bpm"
  observedValue: number | string; // e.g. 142
  baselineRange: {
    min: number | string;
    max: number | string;
    targetText: string;
  };
  deviationPercentage?: number; // e.g. +42%
  physiologicalTrace?: PhysiologicalTelemetryPoint[];
  clinicalMechanism: string;
  urgencyProtocol: string;
  recommendedAction: string;
  clinicalNotes?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  triagedActionTaken?: string;
  provenance: string;
}

export interface BiometricAnomalySummaryStats {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  attentionCount: number;
  unacknowledgedCount: number;
  triagedCount: number;
  activeMonitoredPatients: number;
  telemetryIngestRateMsgSec: number;
}

// -------------------------------------------------------------
// MEDICAL HISTORY SUMMARY & OFFLINE EXTERNAL PHYSICIAN REVIEW EXPORT
// -------------------------------------------------------------
export type MedicalHistorySection =
  | 'demographics'
  | 'allergies'
  | 'conditions'
  | 'medications'
  | 'vitals'
  | 'labResults'
  | 'encounters'
  | 'timeline';

export type MedicalReviewPurpose =
  | 'GENERAL_REFERRAL'
  | 'SECOND_OPINION'
  | 'HOSPITAL_ADMISSION'
  | 'TRAVEL_EMERGENCY'
  | 'PRE_OPERATIVE'
  | 'CARDIOLOGY_REVIEW'
  | 'SPECIALIST_CONSULTATION';

export interface MedicalHistoryExportOptions {
  patientId: string;
  patientName: string;
  externalPhysicianName?: string;
  externalClinicOrHospital?: string;
  reviewPurpose?: MedicalReviewPurpose;
  customClinicalNotes?: string;
  includedSections: {
    demographics: boolean;
    allergies: boolean;
    conditions: boolean;
    medications: boolean;
    vitals: boolean;
    labResults: boolean;
    encounters: boolean;
    timeline: boolean;
  };
  includeDoctorCertificationBlock?: boolean;
}

export interface ComprehensiveMedicalHistory {
  patientId: string;
  patientName: string;
  nationalId?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  primaryCareDoctor?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  generatedAt: string;
  documentTrackingHash: string;
  conditions: ChronicCondition[];
  allergies: AllergyItem[];
  medications: MedicationItem[];
  vitals: VitalReading[];
  vitalTrends: VitalTrendDataPoint[];
  labResults: LabResultRecord[];
  encounters: ClinicalEncounter[];
  timeline: HealthTimelineEvent[];
  dispenses?: PharmacyDispenseRecord[];
  disclaimer: string;
}

// -------------------------------------------------------------
// INSURANCE COVERAGE & BILLING CLAIM AUTOMATION (AI Eligibility)
// -------------------------------------------------------------
export type InsurancePlanTier = 'VIP_PLATINUM' | 'GOLD_COMPREHENSIVE' | 'SILVER_STANDARD' | 'BRONZE_BASIC';
export type ClaimStatus = 'DRAFT' | 'READY_FOR_SUBMISSION' | 'SUBMITTED' | 'PRE_APPROVED' | 'REQUIRES_PRIOR_AUTH' | 'REJECTED';

export interface InsurancePolicyRecord {
  id: string;
  patientId: string;
  providerName: string; // e.g. "بوبا العربية للتأمين التعاوني - Bupa Arabia", "التعاونية للتأمين - Tawuniya", "ميدغلف - MedGulf"
  providerCode: string; // e.g. "BUPA-SA", "TAWUNIYA-01", "MEDGULF-99"
  policyNumber: string; // e.g. "POL-98421008-KSA"
  memberId: string; // e.g. "MEM-7749210-01"
  networkClass: InsurancePlanTier;
  networkTierName: string; // e.g. "شبكة النخبة الذهبية VIP"
  coPayPercentage: number; // e.g. 10 (10%)
  maxCoPayPerVisitSar: number; // e.g. 50 SAR
  annualDeductibleSar: number;
  annualCoverageLimitSar: number;
  annualRemainingCoverageSar: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  tpaName?: string; // Third Party Administrator e.g. "Waseel NPHIES Platform"
  nphiesIntegrated: boolean; // Saudi National Platform for Health and Information Exchange
  coveredBenefits: {
    telemedicineConsultations: boolean;
    inPersonSpecialist: boolean;
    cardiologyDiagnostics: boolean;
    endocrineLaboratory: boolean;
    chronicMedications: boolean;
    dentalCare: boolean;
    opticalCare: boolean;
    inpatientHospitalization: boolean;
  };
  emergencyApprovalHelpline: string;
}

export interface InsuranceEligibilityVerificationRequest {
  patientId: string;
  policyId?: string;
  appointmentId?: string;
  serviceType: 'CARDIOLOGY_CONSULTATION' | 'ENDOCRINOLOGY_CONSULTATION' | 'FAMILY_MEDICINE' | 'TELEMEDICINE' | 'LAB_WORK' | 'CHRONIC_PRESCRIPTION';
  doctorId?: string;
  hospital?: string;
  reasonForVisit?: string;
  patientClinicalProfile?: {
    chronicConditions?: string[];
    medications?: string[];
    recentVitalsSummary?: string;
  };
}

export interface InsuranceEligibilityVerificationResult {
  eligibilityStatus: 'ELIGIBLE' | 'ELIGIBLE_WITH_COPAY' | 'REQUIRES_PRE_AUTH' | 'INELIGIBLE';
  isCovered: boolean;
  coPayAmountSar: number;
  coveredAmountSar: number;
  estimatedTotalFeeSar: number;
  priorAuthorizationRequired: boolean;
  priorAuthReasonAr?: string;
  coverageDetailsAr: string;
  clinicalMedicalNecessityAr: string;
  recommendedCptCodes: Array<{ code: string; description: string; feeSar: number }>;
  icd10DiagnosticCodes: Array<{ code: string; description: string }>;
  verificationReferenceNumber: string;
  verifiedAt: string;
  nphiesTransactionId: string;
  aiVerificationConfidence: number;
  actionablePatientGuidanceAr: string[];
}

export interface AutoCompletedBillingClaim {
  id: string;
  patientId: string;
  appointmentId?: string;
  policyId: string;
  policyNumber: string;
  providerName: string;
  hospitalName: string;
  doctorName: string;
  doctorSpecialty: string;
  serviceDate: string;
  clinicalReason: string;
  primaryIcd10Code: string;
  primaryIcd10Description: string;
  secondaryIcd10Codes?: string[];
  cptServiceCodes: Array<{ code: string; description: string; standardFeeSar: number; coveredPortionSar: number }>;
  totalClaimAmountSar: number;
  patientCoPayShareSar: number;
  insurancePayableShareSar: number;
  priorAuthNumber?: string;
  status: ClaimStatus;
  claimSubmissionChannel: 'NPHIES_ELECTRONIC_GATEWAY' | 'DIRECT_BILLING' | 'REIMBURSEMENT';
  autoCompletedAt: string;
  aiAutoCompleteRationaleAr: string;
  medicalNecessitySummaryAr: string;
  patientSignatureTimestamp?: string;
}



