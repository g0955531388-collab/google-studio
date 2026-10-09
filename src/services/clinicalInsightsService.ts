import {
  ClinicalInsightsOverview,
  PopulationConditionTrend,
  PopulationVitalMonthlyBenchmark,
  LabTurnaroundMetric,
  TelemetryThroughputPoint,
} from '../types';

export class ClinicalInsightsService {
  public getOverviewData(): ClinicalInsightsOverview {
    const conditionDistribution: PopulationConditionTrend[] = [
      { condition: 'Hypertension (ارتفاع ضغط الدم)', conditionAr: 'ارتفاع ضغط الدم', prevalencePct: 34.5, patientCount: 1663, riskLevel: 'HIGH', color: '#ef4444' },
      { condition: 'Type 2 Diabetes (السكري النوع الثاني)', conditionAr: 'السكري النوع الثاني', prevalencePct: 26.2, patientCount: 1262, riskLevel: 'HIGH', color: '#f59e0b' },
      { condition: 'Dyslipidemia (اضطراب شحوم الدم)', conditionAr: 'اضطراب شحوم الدم', prevalencePct: 21.8, patientCount: 1050, riskLevel: 'MODERATE', color: '#0d9488' },
      { condition: 'Ischemic Heart Disease (اعتلال قلبي إقفاري)', conditionAr: 'اعتلال قلبي وعائي', prevalencePct: 11.5, patientCount: 554, riskLevel: 'HIGH', color: '#8b5cf6' },
      { condition: 'Asthma / COPD (الربو والانسداد الرئوي)', conditionAr: 'أمراض صدرية تنفسية', prevalencePct: 6.0, patientCount: 291, riskLevel: 'MODERATE', color: '#06b6d4' },
    ];

    const monthlyVitalBenchmarks: PopulationVitalMonthlyBenchmark[] = [
      { month: 'مايو (May)', avgSystolicBP: 134, avgDiastolicBP: 86, avgHeartRate: 78, avgGlucose: 128, targetSystolic: 120, targetGlucose: 100 },
      { month: 'يونيو (Jun)', avgSystolicBP: 131, avgDiastolicBP: 84, avgHeartRate: 76, avgGlucose: 122, targetSystolic: 120, targetGlucose: 100 },
      { month: 'يوليو (Jul)', avgSystolicBP: 128, avgDiastolicBP: 83, avgHeartRate: 75, avgGlucose: 118, targetSystolic: 120, targetGlucose: 100 },
      { month: 'أغسطس (Aug)', avgSystolicBP: 125, avgDiastolicBP: 81, avgHeartRate: 73, avgGlucose: 114, targetSystolic: 120, targetGlucose: 100 },
      { month: 'سبتمبر (Sep)', avgSystolicBP: 123, avgDiastolicBP: 80, avgHeartRate: 72, avgGlucose: 111, targetSystolic: 120, targetGlucose: 100 },
      { month: 'أكتوبر (Oct)', avgSystolicBP: 121, avgDiastolicBP: 79, avgHeartRate: 71, avgGlucose: 108, targetSystolic: 120, targetGlucose: 100 },
    ];

    const labTurnaroundMetrics: LabTurnaroundMetric[] = [
      { testName: 'Cardiac Troponin T (تروبونين طوارئ القلب)', testCode: 'TROP-T-STAT', actualTATMinutes: 18, targetTATMinutes: 30, volume: 412, efficiencyPct: 96, status: 'OPTIMAL' },
      { testName: 'Comprehensive Lipid Panel (شحوم الدم)', testCode: 'LIPID-FULL', actualTATMinutes: 42, targetTATMinutes: 60, volume: 1240, efficiencyPct: 92, status: 'OPTIMAL' },
      { testName: 'Glycated Hemoglobin (HbA1c السكر التراكمي)', testCode: 'HBA1C-FAST', actualTATMinutes: 35, targetTATMinutes: 45, volume: 1680, efficiencyPct: 94, status: 'OPTIMAL' },
      { testName: 'Serum Electrolytes / Potassium (شوارد الدم)', testCode: 'ELEC-K-NA', actualTATMinutes: 24, targetTATMinutes: 30, volume: 920, efficiencyPct: 91, status: 'OPTIMAL' },
      { testName: 'Complete Blood Count (CBC تعداد الدم الكامل)', testCode: 'CBC-AUTO', actualTATMinutes: 28, targetTATMinutes: 40, volume: 2150, efficiencyPct: 95, status: 'OPTIMAL' },
      { testName: 'Molecular PCR Diagnostic (فحص جزيئي)', testCode: 'PCR-MOL', actualTATMinutes: 78, targetTATMinutes: 90, volume: 380, efficiencyPct: 88, status: 'ACCEPTABLE' },
    ];

    const telemetryThroughput: TelemetryThroughputPoint[] = [
      { time: '00:00', messagesPerSec: 2100, latencyMs: 7, activeStreams: 340 },
      { time: '04:00', messagesPerSec: 1800, latencyMs: 6, activeStreams: 310 },
      { time: '08:00', messagesPerSec: 4200, latencyMs: 11, activeStreams: 620 },
      { time: '12:00', messagesPerSec: 5100, latencyMs: 14, activeStreams: 840 },
      { time: '16:00', messagesPerSec: 4850, latencyMs: 12, activeStreams: 790 },
      { time: '20:00', messagesPerSec: 4600, latencyMs: 9, activeStreams: 710 },
      { time: '23:59', messagesPerSec: 3200, latencyMs: 8, activeStreams: 510 },
    ];

    return {
      totalPopulationMonitored: 4820,
      averageDiagnosticTATMinutes: 37.5,
      telemetryIngestReliabilityPct: 99.98,
      aiDiagnosticConcordancePct: 98.4,
      activeChronicRiskWatchCount: 724,
      conditionDistribution,
      monthlyVitalBenchmarks,
      labTurnaroundMetrics,
      telemetryThroughput,
    };
  }
}

export const clinicalInsightsService = new ClinicalInsightsService();
