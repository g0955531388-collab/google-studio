/// =============================================================
/// Lifex-AI — رعاية النساء والحمل
/// الملف: pregnancy_monitor.dart
/// المسار: lib/features/women_health/pregnancy_monitor.dart
/// الوصف: مراقبة القراءات الحيوية والأعراض اليومية خلال فترة الحمل
/// (وزن، ضغط دم، حركة الجنين المُدرَكة) ورصد أي مؤشر يستدعي انتباهاً.
///
/// ⚠️ أي مؤشر خطر هنا (نزيف، ألم حاد، غياب حركة الجنين) يجب أن يُصعَّد
/// فوراً لوحدة الطوارئ الحقيقية، وليس أن يُترك القرار للذكاء الاصطناعي.
/// =============================================================

import '../../core/health_event_manager.dart';
import 'pregnancy_profile.dart';

/// قراءة يومية واحدة مسجَّلة خلال الحمل.
class PregnancyDailyLog {
  final DateTime recordedAt;
  final double? weightKg;
  final int? systolicBp;
  final int? diastolicBp;

  /// هل شعرت الحامل بحركة الجنين اليوم؟ (مهم خصوصاً بعد الأسبوع 28).
  final bool? fetalMovementFelt;

  final List<String> reportedSymptoms;

  const PregnancyDailyLog({
    required this.recordedAt,
    this.weightKg,
    this.systolicBp,
    this.diastolicBp,
    this.fetalMovementFelt,
    this.reportedSymptoms = const [],
  });
}

/// أعراض تستدعي تصعيداً فورياً لوحدة الطوارئ أثناء الحمل — قائمة صريحة
/// وثابتة، ولا يُسمح بتعديلها عبر الذكاء الاصطناعي أو أي منطق احتمالي.
const List<String> criticalPregnancySymptoms = [
  'نزيف مهبلي',
  'ألم بطن حاد',
  'صداع شديد مع اضطراب رؤية',
  'غياب حركة الجنين',
  'تقلصات مبكرة منتظمة',
];

/// نتيجة تقييم سجل يومي واحد.
class PregnancyMonitorAssessment {
  final bool isCritical;
  final String messageAr;
  final List<String> matchedCriticalSymptoms;

  const PregnancyMonitorAssessment({
    required this.isCritical,
    required this.messageAr,
    this.matchedCriticalSymptoms = const [],
  });
}

/// مراقب الحمل اليومي.
class PregnancyMonitor {
  PregnancyMonitor();

  final Map<String, List<PregnancyDailyLog>> _logsByPregnancyId = {};

  /// تسجيل قراءة يومية جديدة وتقييمها فوراً.
  PregnancyMonitorAssessment recordDailyLog({
    required String pregnancyId,
    required PregnancyRecord pregnancyRecord,
    required PregnancyDailyLog log,
  }) {
    _logsByPregnancyId.putIfAbsent(pregnancyId, () => []).add(log);

    final matchedCritical = log.reportedSymptoms
        .where((symptom) => criticalPregnancySymptoms.contains(symptom))
        .toList();

    final noFetalMovementConcern = pregnancyRecord.currentGestationalWeek >= 28 &&
        log.fetalMovementFelt == false;

    if (matchedCritical.isNotEmpty || noFetalMovementConcern) {
      HealthEventManager.instance.emitQuick(
        HealthEventType.emergencyTriggered,
        sourceModule: 'pregnancy_monitor',
        profileId: pregnancyRecord.profileId,
        data: {
          'reason': 'critical_pregnancy_symptom',
          'symptoms': matchedCritical,
          'noFetalMovement': noFetalMovementConcern,
        },
      );

      return PregnancyMonitorAssessment(
        isCritical: true,
        messageAr: '⚠️ الأعراض المسجَّلة قد تستدعي تدخلاً طبياً فورياً. '
            'يُرجى التواصل مع طبيبتك المتابعة أو التوجه لأقرب طوارئ حالاً.',
        matchedCriticalSymptoms: matchedCritical,
      );
    }

    return const PregnancyMonitorAssessment(
      isCritical: false,
      messageAr: 'تم تسجيل بيانات اليوم. استمري بالمتابعة الدورية المعتادة.',
    );
  }

  List<PregnancyDailyLog> historyFor(String pregnancyId) =>
      List.unmodifiable(_logsByPregnancyId[pregnancyId] ?? const []);
}
