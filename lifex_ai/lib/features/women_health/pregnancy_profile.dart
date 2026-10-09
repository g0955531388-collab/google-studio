/// =============================================================
/// Lifex-AI — رعاية النساء والحمل
/// الملف: pregnancy_profile.dart
/// المسار: lib/features/women_health/pregnancy_profile.dart
/// الوصف: نموذج بيانات حمل واحد — تاريخ آخر دورة، الأسبوع الحالي،
/// الفحوصات المجدولة، ومؤشرات الحمل الأساسية.
/// =============================================================

import 'women_health_manager.dart';

/// نوع فحص أو موعد متابعة خلال الحمل.
class PregnancyCheckup {
  final String id;
  final DateTime scheduledDate;
  final String descriptionAr;
  bool completed;

  PregnancyCheckup({
    required this.id,
    required this.scheduledDate,
    required this.descriptionAr,
    this.completed = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'scheduledDate': scheduledDate.toIso8601String(),
        'descriptionAr': descriptionAr,
        'completed': completed,
      };

  factory PregnancyCheckup.fromJson(Map<String, dynamic> json) =>
      PregnancyCheckup(
        id: json['id'] as String,
        scheduledDate: DateTime.parse(json['scheduledDate'] as String),
        descriptionAr: json['descriptionAr'] as String,
        completed: json['completed'] as bool? ?? false,
      );
}

/// سجل حمل واحد كامل.
class PregnancyRecord {
  final String pregnancyId;
  final String profileId;

  /// تاريخ أول يوم من آخر دورة شهرية — الأساس الطبي الشائع لحساب عمر
  /// الحمل (LMP - Last Menstrual Period).
  final DateTime lastMenstrualPeriodDate;

  bool isActive;
  DateTime? actualDeliveryDate;

  final List<PregnancyCheckup> checkups;

  PregnancyRecord({
    required this.pregnancyId,
    required this.profileId,
    required this.lastMenstrualPeriodDate,
    this.isActive = true,
    this.actualDeliveryDate,
    List<PregnancyCheckup>? checkups,
  }) : checkups = checkups ?? [];

  /// تاريخ الولادة المتوقع (حساب تقريبي: 280 يوماً/40 أسبوعاً من LMP —
  /// قاعدة نيغل الشائعة). هذا تقدير عام وليس دقيقاً طبياً بديلاً عن
  /// تقييم الطبيب بالسونار.
  DateTime get estimatedDueDate =>
      lastMenstrualPeriodDate.add(const Duration(days: 280));

  /// عمر الحمل التقريبي الحالي بالأسابيع.
  int get currentGestationalWeek {
    final daysSinceLmp =
        DateTime.now().difference(lastMenstrualPeriodDate).inDays;
    if (daysSinceLmp < 0) return 0;
    return (daysSinceLmp / 7).floor();
  }

  /// الثلث الحالي من الحمل (1، 2، أو 3).
  int get currentTrimester {
    final week = currentGestationalWeek;
    if (week <= 13) return 1;
    if (week <= 27) return 2;
    return 3;
  }

  Map<String, dynamic> toJson() => {
        'pregnancyId': pregnancyId,
        'profileId': profileId,
        'lastMenstrualPeriodDate': lastMenstrualPeriodDate.toIso8601String(),
        'isActive': isActive,
        'actualDeliveryDate': actualDeliveryDate?.toIso8601String(),
        'checkups': checkups.map((c) => c.toJson()).toList(),
      };

  factory PregnancyRecord.fromJson(Map<String, dynamic> json) =>
      PregnancyRecord(
        pregnancyId: json['pregnancyId'] as String,
        profileId: json['profileId'] as String,
        lastMenstrualPeriodDate:
            DateTime.parse(json['lastMenstrualPeriodDate'] as String),
        isActive: json['isActive'] as bool? ?? true,
        actualDeliveryDate: json['actualDeliveryDate'] != null
            ? DateTime.parse(json['actualDeliveryDate'] as String)
            : null,
        checkups: (json['checkups'] as List<dynamic>? ?? [])
            .map((e) => PregnancyCheckup.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// مدير سجلات الحمل — يبني سجل حمل جديد ويربطه بـ WomenHealthManager.
class PregnancyProfileManager {
  PregnancyProfileManager({required this.womenHealthManager});

  final WomenHealthManager womenHealthManager;
  final Map<String, PregnancyRecord> _records = {};

  /// بدء سجل حمل جديد لملف صحي معيّن.
  PregnancyRecord startNewPregnancy({
    required String pregnancyId,
    required String profileId,
    required DateTime lastMenstrualPeriodDate,
  }) {
    final record = PregnancyRecord(
      pregnancyId: pregnancyId,
      profileId: profileId,
      lastMenstrualPeriodDate: lastMenstrualPeriodDate,
    );
    _records[pregnancyId] = record;
    womenHealthManager.markPregnancyStarted(profileId, pregnancyId);
    return record;
  }

  PregnancyRecord? getById(String pregnancyId) => _records[pregnancyId];

  /// تسجيل انتهاء الحمل بالولادة الفعلية.
  void recordDelivery(String pregnancyId, DateTime deliveryDate) {
    final record = _records[pregnancyId];
    if (record == null) return;
    record.isActive = false;
    record.actualDeliveryDate = deliveryDate;
    womenHealthManager.markDelivered(record.profileId);
  }

  /// إضافة موعد فحص مجدول لسجل حمل قائم.
  void scheduleCheckup(String pregnancyId, PregnancyCheckup checkup) {
    _records[pregnancyId]?.checkups.add(checkup);
  }
}
