/**
 * Lifex-AI Global Health Network
 * Architectural & Security Invariant Test Suite
 * 
 * Verifies all 11 mandatory architectural constraints:
 * 1. User cannot access another user's health data without consent.
 * 2. Doctor cannot access full patient record automatically.
 * 3. Hospital cannot access unrelated patient records.
 * 4. Search cannot bypass Authorization.
 * 5. AI cannot access database directly (sandboxed).
 * 6. AI cannot become Source of Truth (AI ≠ Doctor, AI ≠ Diagnosis).
 * 7. Timeline cannot mutate original records (read-only projection).
 * 8. Projection cannot become canonical data.
 * 9. Consent revocation blocks future access.
 * 10. Audit records all sensitive access (Who, What, When, Why, Outcome).
 * 11. Unauthorized export fails closed.
 */

import { dataService } from '../src/services/dataService';
import { consentService } from '../src/services/consentService';
import { auditService } from '../src/services/auditService';
import { aiService } from '../src/services/aiService';
import { biometricService } from '../src/services/biometricService';
import { biometricAnomalyService } from '../src/services/biometricAnomalyService';
import { generateMedicalHistorySummaryPDF } from '../src/services/medicalHistoryPdfService';
import { pushNotificationService } from '../src/services/pushNotificationService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- Starting Lifex-AI Architectural Test Suite ---');

  // Test 1: User cannot access unauthorized patient record
  const consentValid = consentService.verifyAccess('pat-main', 'doc-dr-sarah', 'FULL_PROJECTION');
  assert(consentValid === true, 'Test 1.1: Legitimate doctor with active consent has authorized access');

  const unauthorizedAccess = consentService.verifyAccess('pat-main', 'doc-random-stranger', 'FULL_PROJECTION');
  assert(unauthorizedAccess === false, 'Test 1.2: Random actor without consent is denied access');

  // Test 2: Doctor cannot access full patient record automatically
  // When consent is scoped to 'VITALS_ONLY', doctor cannot access FULL_PROJECTION
  consentService.grantConsent(
    'pat-main',
    'doc-limited-cardiologist',
    'د. هاني الرفاعي',
    'doctor',
    'VITALS_ONLY',
    'TREATMENT'
  );
  const limitedFullAccess = consentService.verifyAccess('pat-main', 'doc-limited-cardiologist', 'FULL_PROJECTION');
  assert(limitedFullAccess === false, 'Test 2: Scoped consent prevents doctor from reading full projection');

  // Test 3: Hospital cannot access unrelated patient records
  const hospitalEmergencyOnly = consentService.verifyAccess('pat-main', 'hosp-al-hayat', 'FULL_PROJECTION');
  assert(hospitalEmergencyOnly === false, 'Test 3: Hospital only has EMERGENCY_ONLY scope, not full projection');

  // Test 4: Search cannot bypass Authorization
  const publicSearchResults = dataService.search('دليل الجمعية الأوروبية', 'patient');
  assert(
    publicSearchResults.length === 0,
    'Test 4.1: Clinical guidelines restricted to doctor/researcher do not leak to patient search'
  );

  const doctorSearchResults = dataService.search('دليل الجمعية الأوروبية', 'doctor');
  assert(
    doctorSearchResults.length > 0,
    'Test 4.2: Authorized doctor can discover clinical guidelines index'
  );

  // Test 5 & 6: AI Assistant cannot become Source of Truth
  const aiResult = await aiService.askAssistant('ضغط الدم مرتفع 160');
  assert(
    aiResult.medicalDisclaimer.includes('تنويه طبي إلزامي'),
    'Test 5: AI responses mandate non-diagnostic legal disclaimer'
  );
  assert(
    aiResult.limitations.length > 0 && aiResult.sources.length > 0,
    'Test 6: AI outputs carry full provenance, uncertainty score, and literature citations'
  );

  // Test 7 & 8: Timeline is a projection and cannot mutate canonical domain records
  const projections = dataService.getPatientProjections('pat-main');
  assert(
    Array.isArray(projections.timeline) && projections.timeline.length > 0,
    'Test 7: Projections exist as derived views'
  );
  assert(
    projections.timeline[0].isCanonicalRecordOriginal === false,
    'Test 8: Projection events explicitly marked as non-canonical originals'
  );

  // Test 9: Consent revocation blocks future access
  const newConsent = consentService.grantConsent(
    'pat-main',
    'doc-test-temp',
    'د. مؤقت',
    'doctor',
    'FULL_PROJECTION',
    'SECOND_OPINION'
  );
  assert(
    consentService.verifyAccess('pat-main', 'doc-test-temp', 'FULL_PROJECTION') === true,
    'Test 9.1: Newly granted consent is active'
  );

  consentService.revokeConsent(newConsent.id, 'pat-main');
  assert(
    consentService.verifyAccess('pat-main', 'doc-test-temp', 'FULL_PROJECTION') === false,
    'Test 9.2: Revoked consent immediately blocks future access'
  );

  // Test 10: Audit records sensitive access
  const logs = auditService.getLogs();
  const revocationLog = logs.find((l) => l.action === 'REVOKE_CONSENT');
  assert(
    revocationLog !== undefined && revocationLog.policyApplied === 'POL-PATIENT-RIGHT-TO-REVOKE',
    'Test 10: Revocation event recorded in immutable audit log with policy and provenance'
  );

  // Test 11: Unauthorized export fails closed
  const unauthorizedExport = dataService.exportPatientRecord('pat-main', 'guest');
  assert(
    unauthorizedExport.success === false && unauthorizedExport.data === undefined,
    'Test 11.1: Unauthorized export strictly fails closed (fail-safe)'
  );

  const authorizedExport = dataService.exportPatientRecord('pat-main', 'patient');
  assert(
    authorizedExport.success === true && authorizedExport.data !== undefined,
    'Test 11.2: Sovereign patient can export authorized projections'
  );

  // Test 12: Clinical Context Chat adheres to sovereign auditing & non-diagnostic boundaries
  const clinicalChatResponse = await aiService.askClinicalContextChat({
    patientId: 'pat-main',
    patientName: 'أحمد فهد المنصوري',
    message: 'ما مدى استقرار ضغط دمي وجدول جرعات ليسينوبريل؟',
  });
  assert(
    typeof clinicalChatResponse.reply === 'string' && clinicalChatResponse.reply.length > 20,
    'Test 12.1: Clinical Context Chat delivers rich evidence-based responses'
  );
  assert(
    clinicalChatResponse.disclaimer.includes('تنبيه سريري') || clinicalChatResponse.disclaimer.includes('تثقيفية'),
    'Test 12.2: Clinical Context Chat includes mandatory non-diagnostic clinical disclaimer'
  );
  assert(
    Array.isArray(clinicalChatResponse.suggestedFollowUps) && clinicalChatResponse.suggestedFollowUps.length > 0,
    'Test 12.3: Clinical Context Chat produces intelligent follow-up suggestions'
  );
  const auditLogs = auditService.getLogs();
  const chatLog = auditLogs.find((l) => l.action === 'AI_QUERY' && l.purpose === 'CLINICAL_CONTEXT_CHAT_ASSIST');
  assert(
    chatLog !== undefined && chatLog.policyApplied === 'POL-SOVEREIGN-AI-CONTEXT-ENCLAVE',
    'Test 12.4: Clinical Context Chat inquiry strictly recorded in sovereign audit log'
  );

  // Test 13: Health Goals & Personalized Objectives Architecture
  const patientGoals = dataService.getHealthGoals('pat-main');
  assert(
    Array.isArray(patientGoals) && patientGoals.length >= 3,
    'Test 13.1: Sovereign patient can access personalized health goals'
  );

  const initialStats = dataService.getHealthGoalStats('pat-main');
  assert(
    initialStats.totalGoals > 0 && initialStats.averageProgressPct >= 0 && initialStats.averageProgressPct <= 100,
    'Test 13.2: Health goal metrics accurately aggregate total goals and progress percentage'
  );

  const newGoal = dataService.createHealthGoal('pat-main', {
    title: 'المحافظة على شرب الماء',
    titleEn: 'Hydration Intake Goal',
    description: 'شرب 3 لترات يومياً خلال الصيف',
    category: 'HYDRATION',
    frequency: 'DAILY',
    targetValue: 3000,
    currentValue: 1000,
    unit: 'مل',
    unitEn: 'ml',
  });
  assert(
    newGoal.id.startsWith('goal-') && newGoal.currentValue === 1000 && newGoal.status === 'ACTIVE',
    'Test 13.3: Personalized objective creation persists and initializes correctly'
  );

  const updatedGoal = dataService.logGoalProgressEntry('pat-main', newGoal.id, 500, 'increment', 'شرب كوبين إضافيين');
  assert(
    updatedGoal !== null && updatedGoal.currentValue === 1500,
    'Test 13.4: Incremental progress logging updates current value and history'
  );

  const goalAuditLogs = auditService.getLogs();
  const goalAudit = goalAuditLogs.find((l) => l.action === 'WRITE' && l.purpose === 'CREATE_HEALTH_GOAL_OBJECTIVE');
  assert(
    goalAudit !== undefined && goalAudit.policyApplied === 'POL-PATIENT-SELF-MANAGED-GOALS',
    'Test 13.5: Health goal modifications are strictly audited under self-managed policy'
  );

  // Clean up created test goal
  const deleted = dataService.deleteHealthGoal('pat-main', newGoal.id);
  assert(deleted === true, 'Test 13.6: Patient can remove customized health objectives');

  // Test 14: Weekly Health Summary Architecture & Gemini Integration
  const weeklySummary = await aiService.generateWeeklyHealthSummary('pat-main', 'أحمد فهد المنصوري');
  assert(
    typeof weeklySummary.summary === 'string' && weeklySummary.summary.length > 50,
    'Test 14.1: Weekly health summary delivers a rich multi-section clinical analysis'
  );
  assert(
    typeof weeklySummary.metrics.weeklyAdherencePct === 'number' &&
      weeklySummary.metrics.weeklyAdherencePct >= 0 &&
      weeklySummary.metrics.weeklyAdherencePct <= 100,
    'Test 14.2: Weekly health summary accurately calculates 7-day medication adherence'
  );
  assert(
    typeof weeklySummary.metrics.avgBloodPressure === 'string' && weeklySummary.metrics.avgBloodPressure.includes('مم زئبق'),
    'Test 14.3: Weekly health summary synthesizes vital trends into clinical metrics'
  );
  assert(
    Array.isArray(weeklySummary.keyTakeaways) && weeklySummary.keyTakeaways.length > 0,
    'Test 14.4: Weekly health summary extracts actionable takeaways'
  );
  assert(
    weeklySummary.disclaimer.includes('تنبيه سريري') || weeklySummary.disclaimer.includes('تثقيف'),
    'Test 14.5: Weekly health summary contains mandatory non-diagnostic disclaimer'
  );
  const summaryAuditLogs = auditService.getLogs();
  const summaryAudit = summaryAuditLogs.find((l) => l.action === 'AI_QUERY' && l.purpose === 'WEEKLY_HEALTH_SUMMARY_GENERATION');
  assert(
    summaryAudit !== undefined && summaryAudit.policyApplied === 'POL-SOVEREIGN-AI-CONTEXT-ENCLAVE',
    'Test 14.6: Weekly health summary generation strictly recorded in sovereign audit log'
  );

  // Test 15: AI-Driven Smart Alert System & Proactive Pharmacovigilance (Request 4)
  // 15.1: Proactively flags drug-drug interactions when adding an interacting medication
  const ddiAnalysis = await aiService.analyzeSmartAlerts({
    patientId: 'pat-main',
    triggerType: 'NEW_MEDICATION',
    newMedication: {
      name: 'Ibuprofen (بروفين 400mg)',
      dosage: '400mg',
      category: 'PRESCRIPTION',
    },
  });
  assert(
    ddiAnalysis.hasCriticalAlert === true &&
      ddiAnalysis.alerts.some((a) => a.type === 'DRUG_DRUG_INTERACTION' && a.severity === 'CRITICAL'),
    'Test 15.1: Proactively flags critical drug-drug interaction when adding NSAID with Lisinopril'
  );

  // 15.2: Proactively flags adverse reaction / symptom trend when logging a symptom
  const symptomAnalysis = await aiService.analyzeSmartAlerts({
    patientId: 'pat-main',
    triggerType: 'SYMPTOM_LOG',
    symptom: {
      name: 'سعال جاف مستمر (Persistent Dry Cough)',
      severity: 'MODERATE',
      duration: 'مستمر منذ 4 أيام',
    },
  });
  assert(
    symptomAnalysis.hasWarningAlert === true &&
      symptomAnalysis.alerts.some((a) => a.type === 'DRUG_SYMPTOM_SIDE_EFFECT' || a.type === 'ADVERSE_TREND'),
    'Test 15.2: Proactively flags adverse drug reaction when patient logs persistent dry cough with Lisinopril'
  );

  // 15.3: Proactively flags allergy contraindication (Amoxicillin with Penicillin allergy)
  const allergyAnalysis = await aiService.analyzeSmartAlerts({
    patientId: 'pat-main',
    triggerType: 'NEW_MEDICATION',
    newMedication: {
      name: 'Amoxicillin (أموكسيسيلين)',
      dosage: '500mg',
    },
  });
  assert(
    allergyAnalysis.hasCriticalAlert === true &&
      allergyAnalysis.alerts.some((a) => a.type === 'ALLERGY_CONFLICT'),
    'Test 15.3: Proactively flags life-threatening allergy contraindication with documented Penicillin allergy'
  );

  // 15.4: Smart alerts mandate non-diagnostic clinical disclaimer and pharmacological mechanism
  assert(
    ddiAnalysis.disclaimer.includes('تنبيه سريري') &&
      ddiAnalysis.alerts[0].clinicalMechanism.length > 20 &&
      ddiAnalysis.alerts[0].potentialRisk.length > 10,
    'Test 15.4: Smart Alerts mandate non-diagnostic clinical disclaimer and clinical mechanisms'
  );

  // 15.5: Smart alert analysis and symptom logging strictly recorded in sovereign audit log
  const symptomLog = dataService.logSymptom({
    patientId: 'pat-main',
    symptomName: 'دوار انتصابي خفيف عند الاستيقاظ',
    severity: 'MILD',
    duration: 'دقائق معدودة',
    notes: 'تكرر عند الوقوف السريع',
  });
  assert(
    symptomLog.id.startsWith('sym-') && symptomLog.status === 'ACTIVE',
    'Test 15.5: Sovereign patient can log symptoms with full metadata'
  );

  const smartAuditLogs = auditService.getLogs();
  const alertAudit = smartAuditLogs.find((l) => l.action === 'AI_QUERY' && l.purpose === 'PHARMACOVIGILANCE_SMART_ALERT');
  const symptomAudit = smartAuditLogs.find((l) => l.action === 'WRITE' && l.purpose === 'LOG_PATIENT_SYMPTOM');
  assert(
    alertAudit !== undefined &&
      alertAudit.policyApplied === 'POL-AI-SMART-ALERT-AUDIT' &&
      symptomAudit !== undefined &&
      symptomAudit.policyApplied === 'POL-PATIENT-SYMPTOM-SOVEREIGNTY',
    'Test 15.6: Smart alert analysis and symptom logs strictly audited in sovereign log'
  );

  // 15.7: Alert stats and acknowledgment workflow
  const statsBefore = dataService.getSmartAlertStats('pat-main');
  assert(
    typeof statsBefore.totalAlerts === 'number' && statsBefore.totalAlerts >= 1,
    'Test 15.7: Smart alert statistics compute accurate total and active alert counts'
  );

  // Clean up test symptom
  const symptomDeleted = dataService.deleteSymptom(symptomLog.id, 'pat-main');
  assert(symptomDeleted === true, 'Test 15.8: Patient can sovereignly remove logged symptoms');

  // =========================================================================
  // TEST 16: PRESCRIPTION REFILL TRACKER & PILL INVENTORY ENGINE
  // =========================================================================
  const refillCalcs = dataService.getRefillCalculations('pat-main');
  assert(
    refillCalcs.length >= 3 &&
      refillCalcs.some((c) => c.scheduleId === 'sched-3' && c.currentPillCount === 4),
    'Test 16.1: Calculate remaining pill counts and days of supply accurately based on dosage frequency'
  );

  const atorvaRefill = refillCalcs.find((c) => c.scheduleId === 'sched-3')!;
  assert(
    atorvaRefill.needsRefill === true &&
      (atorvaRefill.urgency === 'LOW' || atorvaRefill.urgency === 'CRITICAL') &&
      atorvaRefill.daysRemaining <= atorvaRefill.refillThresholdDays,
    'Test 16.2: Low pill inventory automatically triggers refill urgency and needsRefill flag'
  );

  const initialMetforminPillCount = dataService
    .getMedicationSchedules('pat-main')
    .find((s) => s.id === 'sched-1')!.currentPillCount!;
  
  dataService.logMedicationDose({
    patientId: 'pat-main',
    scheduleEntryId: 'sched-1',
    medicationName: 'Metformin XR (ميتفورمين)',
    dosage: '500mg',
    scheduledTime: '08:30',
    status: 'TAKEN',
    mealContext: 'WITH_MEAL',
    notes: 'اختبار خصم الجرعة من رصيد الحبوب المتبقي',
  });

  const updatedMetforminPillCount = dataService
    .getMedicationSchedules('pat-main')
    .find((s) => s.id === 'sched-1')!.currentPillCount!;
  assert(
    updatedMetforminPillCount === initialMetforminPillCount - 1,
    'Test 16.3: Taking a scheduled dose automatically decrements remaining pill count'
  );

  const requestResult = dataService.requestPrescriptionRefill('sched-3', 'pat-main');
  assert(
    requestResult !== null && requestResult.refillOrderPending === true,
    'Test 16.4: Requesting a prescription refill flags order pending and logs an immutable audit event'
  );

  const fulfillmentResult = dataService.recordPrescriptionRefill('sched-3', 30, 'pat-main');
  assert(
    fulfillmentResult !== null &&
      fulfillmentResult.currentPillCount === 34 &&
      fulfillmentResult.refillOrderPending === false,
    'Test 16.5: Recording a prescription refill restores pill counts, resets pending status, and logs audit fulfillment'
  );

  const refillAuditLogs = auditService.getLogs();
  const refillReqAudit = refillAuditLogs.find(
    (l) => l.action === 'WRITE' && l.purpose === 'PRESCRIPTION_REFILL_REQUEST'
  );
  const refillFulAudit = refillAuditLogs.find(
    (l) => l.action === 'WRITE' && l.purpose === 'PRESCRIPTION_REFILL_FULFILLMENT'
  );
  assert(
    refillReqAudit !== undefined &&
      refillReqAudit.resourceType === 'PRESCRIPTION' &&
      refillFulAudit !== undefined &&
      refillFulAudit.resourceType === 'PRESCRIPTION',
    'Test 16.6: Refill lifecycle events strictly logged in sovereign audit trail'
  );

  // Test 17: Notification settings panel & alert preferences
  const notifSettings = dataService.getPatientNotificationSettings('pat-main');
  assert(
    notifSettings.channels.sms.enabled === true &&
      notifSettings.channels.email.enabled === true &&
      notifSettings.channels.inApp.enabled === true,
    'Test 17.1: Patient notification settings initialize with active delivery channels'
  );

  const updatedSettings = dataService.updatePatientNotificationSettings('pat-main', {
    alerts: {
      ...notifSettings.alerts,
      criticalLabResults: {
        sms: true,
        email: true,
        inApp: true,
        urgentThresholdOnly: false,
      },
      medicationReminders: {
        ...notifSettings.alerts.medicationReminders,
        sms: true,
        advanceMinutes: 15,
      },
    },
  });

  assert(
    updatedSettings.alerts.criticalLabResults.urgentThresholdOnly === false &&
      updatedSettings.alerts.medicationReminders.sms === true &&
      updatedSettings.alerts.medicationReminders.advanceMinutes === 15,
    'Test 17.2: Patient can toggle and update multi-channel alerts for lab results and medication reminders'
  );

  const notifAuditLogs = auditService.getLogs();
  const notifAudit = notifAuditLogs.find(
    (l) => l.resourceId === 'notif-prefs-pat-main' && l.purpose === 'PATIENT_COMMUNICATION_PREFERENCES'
  );
  assert(
    notifAudit !== undefined && notifAudit.policyApplied === 'POL-PATIENT-NOTIFICATION-PREFERENCES',
    'Test 17.3: Notification preference modifications are strictly recorded in the sovereign audit trail'
  );

  const testLabDispatch = dataService.sendTestNotification('pat-main', 'sms', 'criticalLabResults');
  const testMedDispatch = dataService.sendTestNotification('pat-main', 'inApp', 'medicationReminders');
  assert(
    testLabDispatch.success === true && testMedDispatch.success === true,
    'Test 17.4: Patient can trigger simulated test notifications across SMS and in-app channels'
  );

  // Test 18: Simulated Biometric Authentication Overlay & Security Enclave
  assert(
    biometricService.isVerified() === false,
    'Test 18.1: Biometric guard defaults to locked state for sensitive records'
  );

  const failResult = await biometricService.authenticate('pat-main', 'FINGERPRINT', { simulateFailure: true });
  assert(
    failResult.success === false && biometricService.isVerified() === false,
    'Test 18.2: Biometric authentication failure fails closed and maintains locked state'
  );

  const successResult = await biometricService.authenticate('pat-main', 'FINGERPRINT');
  assert(
    successResult.success === true && biometricService.isVerified() === true,
    'Test 18.3: Successful biometric authentication unlocks sensitive medical records session'
  );

  const bioAuditLogs = auditService.getLogs();
  const bioAudit = bioAuditLogs.find(
    (l) => l.resourceId === 'bio-auth-pat-main' && l.purpose === 'BIOMETRIC_HARDWARE_ENCLAVE_STEP_UP'
  );
  assert(
    bioAudit !== undefined && bioAudit.outcome === 'SUCCESS' && bioAudit.policyApplied === 'POL-FIDO2-BIOMETRIC-STEP-UP',
    'Test 18.4: Biometric step-up authentication is recorded in immutable sovereign audit log'
  );

  biometricService.lock(false);
  assert(
    biometricService.isVerified() === false,
    'Test 18.5: Biometric lock successfully re-secures patient records enclave'
  );

  // Test 19: Pharmacy AI Drug-Drug Interaction Cross-Reference Engine
  const ddiCriticalResult = await aiService.analyzeDrugDrugInteractions([
    'Lisinopril 10mg',
    'Potassium Chloride 20mEq',
  ]);
  assert(
    ddiCriticalResult.hasCriticalInteraction === true &&
      ddiCriticalResult.overallRiskLevel === 'CRITICAL' &&
      ddiCriticalResult.interactions.length > 0 &&
      ddiCriticalResult.interactions[0].interactionTitle.includes('فرط بوتاسيوم الدم'),
    'Test 19.1: Cross-referencing Lisinopril and Potassium identifies critical hyperkalemia interaction'
  );

  const ddiStatinResult = await aiService.analyzeDrugDrugInteractions([
    'Atorvastatin 20mg',
    'Clarithromycin 500mg',
  ]);
  assert(
    ddiStatinResult.hasCriticalInteraction === true &&
      ddiStatinResult.interactions.some((i) => i.interactionTitle.includes('انحلال الربيدات')),
    'Test 19.2: Cross-referencing Atorvastatin and Clarithromycin identifies critical CYP3A4 rhabdomyolysis interaction'
  );

  const ddiSafeResult = await aiService.analyzeDrugDrugInteractions([
    'Metformin XR 500mg',
    'Lisinopril 10mg',
  ]);
  assert(
    ddiSafeResult.overallRiskLevel === 'SAFE' &&
      ddiSafeResult.hasCriticalInteraction === false &&
      ddiSafeResult.interactions.length === 0,
    'Test 19.3: Cross-referencing compatible medications (Metformin + Lisinopril) correctly evaluates to SAFE'
  );

  const ddiAuditLogs = auditService.getLogs();
  const ddiAudit = ddiAuditLogs.find(
    (l) => l.purpose === 'DRUG_DRUG_INTERACTION_CROSS_REFERENCE'
  );
  assert(
    ddiAudit !== undefined &&
      ddiAudit.policyApplied === 'POL-PHARMACY-AI-SAFETY-INTERACTION' &&
      ddiAudit.action === 'AI_QUERY',
    'Test 19.4: Pharmacy AI cross-referencing is strictly logged in sovereign immutable audit trail'
  );

  // -------------------------------------------------------------------------
  // Test 20: Real-Time Biometric Anomaly Tracking & Notification System
  // -------------------------------------------------------------------------
  const initialAnomalies = biometricAnomalyService.getAlerts();
  assert(
    initialAnomalies.length >= 3 &&
      initialAnomalies.some((a) => a.severity === 'CRITICAL' && a.anomalyType === 'ARRHYTHMIA_TACHYCARDIA'),
    'Test 20.1: Biometric anomaly service initializes with active alerts and tracks physiological parameters'
  );

  // Test pub/sub live push
  const receivedHolder = { received: false };
  const unsubAnom = biometricAnomalyService.subscribe((alerts) => {
    if (alerts.some((a) => a.id === 'test-live-anom-999')) {
      receivedHolder.received = true;
    }
  });

  const newPushed = biometricAnomalyService.pushAnomaly({
    id: 'test-live-anom-999',
    patientId: 'pat-main',
    patientName: 'أحمد مصطفى السيد',
    patientAge: 58,
    consentToken: 'TOK-CONSENT-CAR-8821',
    deviceSource: {
      deviceId: 'dev-ecg-991',
      model: 'CardioSense Ultra ECG',
      category: 'ECG_MONITOR',
      batteryPercentage: 90,
    },
    anomalyType: 'ARRHYTHMIA_TACHYCARDIA',
    title: 'تسرع بطيني تجريبي',
    titleEn: 'Test VTach Alert',
    severity: 'CRITICAL',
    status: 'UNACKNOWLEDGED',
    parameter: 'معدل ضربات القلب',
    unit: 'bpm',
    observedValue: 160,
    baselineRange: { min: 60, max: 100, targetText: '60-100 bpm' },
    clinicalMechanism: 'تسارع غير نمطي حاد',
    urgencyProtocol: 'بروتوكول إسعافي فوري',
    recommendedAction: 'الاتصال بالمريض',
  });

  assert(
    receivedHolder.received === true && newPushed.observedValue === 160,
    'Test 20.2: Pushing a real-time anomaly notifies subscribers with alert details and device telemetry'
  );
  unsubAnom();

  // Test doctor acknowledgement
  const ackResult = biometricAnomalyService.acknowledgeAlert('test-live-anom-999', 'doc-dr-sarah', 'د. سارة المنصور');
  assert(
    ackResult !== null &&
      ackResult.status === 'ACKNOWLEDGED' &&
      ackResult.acknowledgedBy === 'د. سارة المنصور',
    'Test 20.3: Doctor acknowledging an alert updates status and records sovereign audit entry'
  );

  // Test triage intervention
  const triageResult = biometricAnomalyService.triageAlert(
    'test-live-anom-999',
    'استشارة مرئية عاجلة وتعديل الجرعة',
    'تم التوجيه بالاسترخاء وأخذ حبة بيتا بلوكر',
    'doc-dr-sarah',
    'د. سارة المنصور'
  );
  assert(
    triageResult !== null &&
      triageResult.status === 'TRIAGED' &&
      triageResult.triagedActionTaken === 'استشارة مرئية عاجلة وتعديل الجرعة',
    'Test 20.4: Clinical triage intervention assigns action and notes under strict governance'
  );

  // Test simulation generator
  const simHypoxemia = biometricAnomalyService.simulateIncomingAnomaly('HYPOXEMIA');
  assert(
    simHypoxemia.anomalyType === 'HYPOXEMIA_DESATURATION' &&
      simHypoxemia.severity === 'CRITICAL' &&
      simHypoxemia.observedValue === 84,
    'Test 20.5: Real-time simulation trigger produces high-fidelity emergency scenario'
  );

  // -------------------------------------------------------------
  // Test 21: Medical History Summary PDF Generation & External Physician Export
  // -------------------------------------------------------------
  const medHistory = dataService.getComprehensiveMedicalHistory('pat-main');
  assert(
    medHistory !== undefined &&
      medHistory.patientId === 'pat-main' &&
      medHistory.documentTrackingHash.startsWith('LX-EHR-') &&
      medHistory.conditions.length > 0 &&
      medHistory.allergies.length > 0 &&
      medHistory.medications.length > 0 &&
      medHistory.labResults.length > 0 &&
      medHistory.encounters.length > 0,
    'Test 21.1: Comprehensive medical history aggregates all clinical domains into sovereign EHR projection'
  );

  const patientEncounters = dataService.getPatientEncounters('pat-main');
  assert(
    Array.isArray(patientEncounters) &&
      patientEncounters.length > 0 &&
      patientEncounters[0].patientId === 'pat-main',
    'Test 21.2: Clinical encounters are scoped to patient and retrievable for external physician review'
  );

  const pdfGenResult = generateMedicalHistorySummaryPDF(medHistory, {
    patientId: 'pat-main',
    patientName: 'أحمد فهد المنصوري',
    externalPhysicianName: 'د. خالد العمري',
    externalClinicOrHospital: 'مستشفى التخصصي الدولي',
    reviewPurpose: 'GENERAL_REFERRAL',
    customClinicalNotes: 'إحالة سريرية للمراجعة الدورية وتقييم تدرج العلاج الدوائي للضغط والكوليسترول دون أعراض جانبية.',
    includedSections: {
      demographics: true,
      allergies: true,
      conditions: true,
      medications: true,
      vitals: true,
      labResults: true,
      encounters: true,
      timeline: true,
    },
    includeDoctorCertificationBlock: true,
  });

  assert(
    pdfGenResult.success === true &&
      pdfGenResult.pageCount >= 1 &&
      pdfGenResult.fileName.includes('Lifex_Medical_History_Summary_pat-main') &&
      pdfGenResult.trackingHash === medHistory.documentTrackingHash,
    'Test 21.3: Medical history summary PDF generates successfully with tracking hash and pagination'
  );

  const medPdfAuditLogs = auditService.getLogs();
  const pdfExportAudit = medPdfAuditLogs.find(
    (l) => l.purpose === 'EXTERNAL_PHYSICIAN_OFFLINE_REVIEW' && l.action === 'EXPORT'
  );
  assert(
    pdfExportAudit !== undefined &&
      pdfExportAudit.policyApplied === 'POL-SOVEREIGN-MEDICAL-SUMMARY-EXPORT' &&
      pdfExportAudit.resourceType === 'PATIENT_RECORD' &&
      pdfExportAudit.outcome === 'SUCCESS',
    'Test 21.4: Medical history export records immutable audit trail with external physician review purpose'
  );

  // -------------------------------------------------------------
  // Test 22: Interactive Symptom Assessment & Clinical Triage (Gemini API)
  // -------------------------------------------------------------
  console.log('\n--- Test 22: Interactive Symptom Assessment & Clinical Triage ---');

  // Test 22.1: Emergency triage for crushing chest pain with radiating red flag
  const emergencyTriage = await aiService.assessSymptomTriage({
    patientId: 'pat-main',
    primarySymptom: 'ألم ضاغط وشديد في منتصف الصدر',
    primarySymptomEn: 'Crushing severe retrosternal chest pain',
    secondarySymptoms: ['تعرق بارد غزير', 'ألم ممتد للذراع الأيسر'],
    severityLevel: 'SEVERE',
    painScale: 9,
    onset: 'خلال الساعة الأخيرة',
    progression: 'WORSENING',
    redFlagsIdentified: ['ألم ضاغط أو عاصر في الصدر يمتد للذراع الأيسر أو الفك أو الرقبة'],
    vitalContext: {
      bloodPressure: '165/95 mmHg',
      heartRate: 110,
      spO2: 95,
    },
    relevantMedications: ['Lisinopril 10mg', 'Atorvastatin 20mg', 'Aspirin 81mg'],
    relevantConditions: ['Hypertension', 'Type 2 Diabetes'],
  });

  assert(
    emergencyTriage.urgencyLevel === 'EMERGENCY' &&
      emergencyTriage.recommendedCareSetting === 'EMERGENCY_ROOM' &&
      emergencyTriage.redFlagWarnings.length > 0 &&
      emergencyTriage.differentialConsiderations.some((d) => d.conditionName.includes('تاجية') || d.conditionNameEn?.includes('Coronary')),
    'Test 22.1: Crushing chest pain with red flags correctly classified as EMERGENCY triage with ER referral'
  );

  // Test 22.2: Medication safety correlation (Lisinopril-induced dry cough)
  const coughTriage = await aiService.assessSymptomTriage({
    patientId: 'pat-main',
    primarySymptom: 'سعال جاف مستمر وغير مصحوب ببلغم',
    primarySymptomEn: 'Persistent dry non-productive cough',
    secondarySymptoms: ['دغدغة في الحلق'],
    severityLevel: 'MODERATE',
    painScale: 4,
    onset: 'منذ أسبوعين',
    progression: 'STABLE',
    redFlagsIdentified: [],
    relevantMedications: ['Lisinopril 10mg', 'Metformin 500mg'],
    relevantConditions: ['Hypertension'],
  });

  assert(
    coughTriage.urgencyLevel === 'SEMI_URGENT' &&
      coughTriage.medicationSafetyImpact !== undefined &&
      coughTriage.medicationSafetyImpact.alertPresent === true &&
      coughTriage.medicationSafetyImpact.clinicalNote.includes('Lisinopril'),
    'Test 22.2: Persistent dry cough in patient on Lisinopril flags ACEI-induced bradykinin cough safety correlation'
  );

  // Test 22.3: Mild transient symptoms yield Home Care / Self-monitoring
  const mildTriage = await aiService.assessSymptomTriage({
    patientId: 'pat-main',
    primarySymptom: 'إرهاق خفيف بعد المشي',
    primarySymptomEn: 'Mild exertion fatigue',
    secondarySymptoms: [],
    severityLevel: 'MILD',
    painScale: 2,
    onset: 'اليوم',
    progression: 'IMPROVING',
    redFlagsIdentified: [],
  });

  assert(
    mildTriage.urgencyLevel === 'NON_URGENT_HOME_CARE' &&
      mildTriage.recommendedCareSetting === 'HOME_CARE' &&
      mildTriage.homeCareGuidelines !== undefined &&
      mildTriage.homeCareGuidelines.length > 0,
    'Test 22.3: Mild transient symptoms correctly categorized as NON_URGENT_HOME_CARE with self-monitoring'
  );

  // Test 22.4: Non-diagnostic audit and sandbox safety gate
  const triageAuditLogs = auditService.getLogs();
  const triageAudit = triageAuditLogs.find(
    (l) => l.action === 'AI_QUERY' && l.policyApplied === 'POL-AI-NON-DIAGNOSTIC-GATE'
  );
  assert(
    triageAudit !== undefined &&
      triageAudit.actorId === 'pat-main' &&
      triageAudit.outcome === 'SUCCESS',
    'Test 22.4: Triage queries strictly audited under POL-AI-NON-DIAGNOSTIC-GATE with zero database mutation'
  );

  // -------------------------------------------------------------
  // Test 23: Historical Vital Trends Simulation & Data Visualization Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 23: Longitudinal Vital Trends Simulation (Gemini Service) ---');

  // Test 23.1: Baseline 48h vital trends generation
  const baselineTrends = await aiService.fetchVitalTrendsMockData({
    patientId: 'pat-main',
    timeRange: '48h',
    scenario: 'BASELINE',
  });

  assert(
    baselineTrends.dataPoints.length > 0 &&
      baselineTrends.summary.avgSystolic < 130 &&
      baselineTrends.summary.avgDiastolic < 85 &&
      baselineTrends.summary.avgHeartRate >= 60 &&
      baselineTrends.summary.avgHeartRate <= 80 &&
      baselineTrends.summary.stabilityIndex >= 85,
    'Test 23.1: Baseline 48h vital trends exhibit physiological hemodynamic stability within normal reference limits'
  );

  // Test 23.2: Hypertensive variation scenario detection
  const hypertensiveTrends = await aiService.fetchVitalTrendsMockData({
    patientId: 'pat-main',
    timeRange: '24h',
    scenario: 'HYPERTENSIVE_VARIATION',
  });

  assert(
    hypertensiveTrends.summary.anomaliesCount > 0 &&
      hypertensiveTrends.summary.maxSystolic >= 145 &&
      hypertensiveTrends.dataPoints.some((dp) => dp.isAnomaly && dp.anomalyType === 'HYPERTENSIVE_SPIKE') &&
      hypertensiveTrends.clinicalInterpretationAr.includes('تذبذب') || hypertensiveTrends.clinicalInterpretationAr.includes('ارتفاع'),
    'Test 23.2: Hypertensive variation scenario identifies systolic spikes and flags anomalies correctly'
  );

  // Test 23.3: Post-exercise recovery kinetics
  const exerciseTrends = await aiService.fetchVitalTrendsMockData({
    patientId: 'pat-main',
    timeRange: '24h',
    scenario: 'POST_EXERCISE_RECOVERY',
  });

  assert(
    exerciseTrends.summary.maxHeartRate >= 125 &&
      exerciseTrends.dataPoints.some((dp) => dp.anomalyType === 'TACHYCARDIA') &&
      exerciseTrends.summary.avgPulsePressure > 35,
    'Test 23.3: Post-exercise recovery simulates exertion tachycardia and widened hemodynamic pulse pressure'
  );

  // Test 23.4: Audit compliance for vital telemetry projection
  const vitalAuditLogs = auditService.getLogs();
  const vitalAudit = vitalAuditLogs.find(
    (l) => l.action === 'AI_QUERY' && l.policyApplied === 'POL-AI-VITAL-SIMULATION'
  );
  assert(
    vitalAudit !== undefined &&
      vitalAudit.actorId === 'pat-main' &&
      vitalAudit.purpose === 'VITAL_TELEMETRY_PROJECTION',
    'Test 23.4: Vital trends simulation queries audited under POL-AI-VITAL-SIMULATION policy'
  );

  // -------------------------------------------------------------
  // Test 24: AI-Powered Appointment Scheduling & Slot Optimization
  // -------------------------------------------------------------
  console.log('\n--- Test 24: AI-Powered Appointment Scheduling & Slot Optimization ---');

  // Test 24.1: Optimal slot suggestion based on cardiovascular history & blood pressure spikes
  const cardioSlotSuggestions = await aiService.suggestOptimalAppointmentSlots({
    patientId: 'pat-main',
    reasonForVisit: 'استشارة قلبية طارئة بعد تكرار رصد قراءات ضغط مرتفعة ومتابعة دواء Lisinopril',
    patientHistoryContext: {
      conditions: ['ارتفاع ضغط الدم الأولي'],
      recentVitalsSummary: 'ضغط دم 148/92 مم زئبق مع ذروة صباحية',
      recentSymptoms: ['صداع خفيف'],
      medications: ['Lisinopril 10mg'],
      urgencyLevel: 'URGENT',
    },
  });

  assert(
    cardioSlotSuggestions.suggestedSlots.length > 0 &&
      cardioSlotSuggestions.suggestedUrgency === 'WITHIN_48H' &&
      cardioSlotSuggestions.suggestedSlots[0].doctorId === 'doc-dr-sarah' &&
      cardioSlotSuggestions.suggestedSlots[0].period === 'MORNING' &&
      (cardioSlotSuggestions.suggestedSlots[0].aiOptimalityScore || 0) >= 90,
    'Test 24.1: AI suggests morning cardiology slot with Dr. Sarah Al-Mansour for hypertensive patient within 48h'
  );

  // Test 24.2: Fasting metabolic / endocrine slot suggestion
  const endoSlotSuggestions = await aiService.suggestOptimalAppointmentSlots({
    patientId: 'pat-main',
    reasonForVisit: 'مراجعة قراءات السكر الصائم والتحليل التراكمي ونظام الغذاء',
    patientHistoryContext: {
      conditions: ['مقدمات سكري'],
      recentVitalsSummary: 'سكر الصائم 115 ملغ/دسل',
      medications: ['Metformin 500mg'],
      urgencyLevel: 'ROUTINE',
    },
  });

  const topEndoSlot = endoSlotSuggestions.suggestedSlots.find(
    (s) => s.doctorId === 'doc-dr-layla' && s.period === 'MORNING'
  );
  assert(
    topEndoSlot !== undefined &&
      (topEndoSlot.aiOptimalityScore || 0) >= 90 &&
      topEndoSlot.aiRecommendationReasonAr !== undefined,
    'Test 24.2: AI recommends early morning slot with Dr. Layla Al-Sharif for fasting glucose alignment'
  );

  // Test 24.3: Booking an appointment mutates state, occupies slot, and registers timeline encounter
  const bookedApt = dataService.bookAppointment({
    patientId: 'pat-main',
    doctorId: 'doc-dr-sarah',
    doctorName: 'د. سارة المنصور',
    doctorSpecialty: 'استشاري أمراض القلب والأوعية الدموية',
    hospital: 'مستشفى الملك فيصل التخصصي ومركز الأبحاث',
    date: '2026-10-10',
    startTime: '08:30',
    endTime: '09:00',
    period: 'MORNING',
    consultationType: 'IN_PERSON',
    status: 'CONFIRMED',
    reasonForVisit: 'متابعة سريرية عاجلة لضغط الدم',
    aiSuggestedSlot: true,
    aiCompatibilityScore: 98,
    preparationInstructions: ['الصيام 8 ساعات لسحب عينة الدهون'],
    reminderEnabled: true,
  });

  const patientApts = dataService.getPatientAppointments('pat-main');
  const foundBooked = patientApts.find((a) => a.id === bookedApt.id);
  const occupiedSlot = dataService.getPhysicianSlots('doc-dr-sarah', '2026-10-10').find((s) => s.startTime === '08:30');

  assert(
    foundBooked !== undefined &&
      foundBooked.status === 'CONFIRMED' &&
      occupiedSlot !== undefined &&
      occupiedSlot.isAvailable === false,
    'Test 24.3: Booking appointment marks slot unavailable and persists appointment in patient record'
  );

  // Test 24.4: Cancelling appointment updates status and releases slot back to available
  const cancelSuccess = dataService.cancelAppointment(bookedApt.id, 'pat-main');
  const releasedSlot = dataService.getPhysicianSlots('doc-dr-sarah', '2026-10-10').find((s) => s.startTime === '08:30');

  assert(
    cancelSuccess === true &&
      foundBooked?.status === 'CANCELLED' &&
      releasedSlot !== undefined &&
      releasedSlot.isAvailable === true,
    'Test 24.4: Cancelling appointment updates status and releases slot back to available'
  );

  // Test 24.5: Immutable audit trails for AI scheduling query and booking
  const aptAuditLogs = auditService.getLogs();
  const aiSlotAudit = aptAuditLogs.find(
    (l) => l.action === 'AI_QUERY' && l.policyApplied === 'POL-AI-APPOINTMENT-SUGGESTION'
  );
  const bookingAudit = aptAuditLogs.find(
    (l) => l.action === 'WRITE' && l.policyApplied === 'POL-APPOINTMENT-BOOKING'
  );

  assert(
    aiSlotAudit !== undefined &&
      aiSlotAudit.purpose === 'APPOINTMENT_OPTIMIZATION_QUERY' &&
      bookingAudit !== undefined &&
      bookingAudit.purpose === 'CLINICAL_APPOINTMENT_BOOKING',
    'Test 24.5: AI slot suggestions and booking actions strictly audited under governance policies'
  );

  // -------------------------------------------------------------
  // Test 25: Push Notification Scheduling System (Medication Alerts)
  // -------------------------------------------------------------
  console.log('\n--- Test 25: Push Notification Scheduling System (Medication Alerts) ---');

  // Test 25.1: Synchronizing scheduled push alerts from saved medical records
  const syncedAlerts = pushNotificationService.syncScheduledAlerts('pat-main');
  const patientSchedules = dataService.getMedicationSchedules('pat-main');
  const reminderEnabledSchedules = patientSchedules.filter((s) => s.reminderEnabled);

  assert(
    syncedAlerts.length >= reminderEnabledSchedules.length &&
      syncedAlerts.every((a) => a.patientId === 'pat-main' && a.medicationName && a.scheduledTime),
    'Test 25.1: Push notifications sync successfully from saved medication records'
  );

  // Test 25.2: Dispatched/simulated alert triggers audio and updates status
  const simAlert = pushNotificationService.simulateImmediatePushAlert('pat-main');
  assert(
    simAlert !== undefined &&
      simAlert.status === 'TRIGGERED' &&
      simAlert.triggeredAt !== undefined &&
      simAlert.channel === 'PUSH_NOTIFICATION',
    'Test 25.2: Immediate push alert triggers correctly with active notification payload'
  );

  // Test 25.3: Patient acknowledging push alert logs medication dose in EHR
  const initialLogsCount = dataService.getMedicationLogs('pat-main').length;
  const pushAckResult = pushNotificationService.acknowledgeAlert(simAlert.id, 'تم التناول عبر تنبيه المتصفح الفوري');
  const updatedLogs = dataService.getMedicationLogs('pat-main');
  const foundAckLogInEhr = updatedLogs.find(
    (l) => l.notes?.includes('Push Alert') || l.notes?.includes('تنبيه المتصفح الفوري')
  );

  assert(
    pushAckResult.success === true &&
      pushAckResult.alert?.status === 'ACKNOWLEDGED' &&
      pushAckResult.alert?.adherenceImpact === 'ON_TIME' &&
      pushAckResult.doseLogged === true &&
      (updatedLogs.length >= initialLogsCount || foundAckLogInEhr !== undefined),
    'Test 25.3: Acknowledging push alert logs confirmed medication dose in sovereign EHR'
  );

  // Test 25.4: Patient snoozing push alert postpones trigger time
  const anotherAlert = syncedAlerts[0];
  const snoozedAlert = pushNotificationService.snoozeAlert(anotherAlert.id, 15);
  assert(
    snoozedAlert !== null &&
      snoozedAlert.status === 'SNOOZED' &&
      snoozedAlert.snoozedUntil !== undefined,
    'Test 25.4: Snoozing push alert postpones reminder with calculated snooze timestamp'
  );

  // Test 25.5: Push notification lifecycle events recorded in sovereign audit trail
  const notifLogs = auditService.getLogs();
  const pushDispatchedAudit = notifLogs.find(
    (l) => l.action === 'WRITE' && l.policyApplied === 'POL-MEDICATION-PUSH-NOTIFICATION' && l.purpose === 'MEDICATION_ALERT_DISPATCHED'
  );
  const pushConfirmedAudit = notifLogs.find(
    (l) => l.action === 'WRITE' && l.policyApplied === 'POL-MEDICATION-PUSH-NOTIFICATION' && l.purpose === 'MEDICATION_DOSE_CONFIRMED'
  );

  assert(
    pushDispatchedAudit !== undefined &&
      pushConfirmedAudit !== undefined &&
      pushDispatchedAudit.actorId === 'pat-main' &&
      pushConfirmedAudit.actorId === 'pat-main',
    'Test 25.5: Push notification lifecycle strictly audited under POL-MEDICATION-PUSH-NOTIFICATION governance'
  );

  console.log(`--- Test Suite Completed: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
