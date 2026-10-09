/// =============================================================
/// Lifex-AI — رعاية النساء والحمل
/// الملف: women_health_manager.dart
/// المسار: lib/features/women_health/women_health_manager.dart
/// الوصف: المدير المركزي لوحدة صحة المرأة — نقطة الدخول الموحدة التي
/// تربط بين متابعة الدورة الشهرية، الحمل، ما بعد الولادة، والتوعية،
/// وتحدد أي مرحلة من مراحل حياة المرأة صاحبة الملف نشطة حالياً.
///
/// ⚠️ خصوصية حساسة للغاية: بيانات هذه الوحدة (دورة شهرية، حمل، خصوبة)
/// من أكثر البيانات الصحية حساسية. يجب أن تكون مرئية فقط لصاحبة الملف
/// نفسها افتراضياً (عبر profile_privacy_manager.dart)، ولا تُشارك مع
/// أي طرف آخر (بما فيهم أفراد العائلة) إلا بموافقة صريحة ومنفصلة منها.
/// =============================================================

import '../../core/health_event_manager.dart';

/// المرحلة الحالية في دورة حياة المرأة الصحية داخل هذه الوحدة.
enum WomenHealthStage {
  cycleTracking, // متابعة دورة شهرية عادية (غير حامل حالياً)
  pregnant,
  postpartum, // ما بعد الولادة مباشرة
  none, // المستخدمة اختارت عدم استخدام هذه الوحدة إطلاقاً
}

/// الحالة العامة لصحة المرأة المرتبطة بملف صحي واحد.
class WomenHealthProfile {
  final String profileId;
  WomenHealthStage currentStage;

  /// معرّف سجل الحمل النشط حالياً، إن وُجد (يُدار في pregnancy_profile.dart).
  String? activePregnancyId;

  DateTime lastUpdatedAt;

  WomenHealthProfile({
    required this.profileId,
    this.currentStage = WomenHealthStage.none,
    this.activePregnancyId,
    DateTime? lastUpdatedAt,
  }) : lastUpdatedAt = lastUpdatedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'profileId': profileId,
        'currentStage': currentStage.name,
        'activePregnancyId': activePregnancyId,
        'lastUpdatedAt': lastUpdatedAt.toIso8601String(),
      };

  factory WomenHealthProfile.fromJson(Map<String, dynamic> json) =>
      WomenHealthProfile(
        profileId: json['profileId'] as String,
        currentStage: WomenHealthStage.values.firstWhere(
          (e) => e.name == json['currentStage'],
          orElse: () => WomenHealthStage.none,
        ),
        activePregnancyId: json['activePregnancyId'] as String?,
        lastUpdatedAt: DateTime.parse(json['lastUpdatedAt'] as String),
      );
}

/// المدير المركزي لوحدة صحة المرأة.
class WomenHealthManager {
  WomenHealthManager();

  final Map<String, WomenHealthProfile> _profiles = {};

  /// الحصول على حالة صحة المرأة لملف معيّن، أو إنشاء حالة افتراضية
  /// جديدة إن لم توجد بعد.
  WomenHealthProfile getOrCreate(String profileId) {
    return _profiles.putIfAbsent(
      profileId,
      () => WomenHealthProfile(profileId: profileId),
    );
  }

  /// الانتقال إلى مرحلة الحمل (يُستدعى عادة من pregnancy_profile.dart
  /// عند تسجيل حمل جديد).
  void markPregnancyStarted(String profileId, String pregnancyId) {
    final profile = getOrCreate(profileId);
    profile.currentStage = WomenHealthStage.pregnant;
    profile.activePregnancyId = pregnancyId;
    profile.lastUpdatedAt = DateTime.now();

    HealthEventManager.instance.emitQuick(
      HealthEventType.profileUpdated,
      sourceModule: 'women_health_manager',
      profileId: profileId,
      data: {'updateType': 'pregnancy_started', 'pregnancyId': pregnancyId},
    );
  }

  /// الانتقال لمرحلة ما بعد الولادة (يُستدعى من postpartum_care_manager.dart).
  void markDelivered(String profileId) {
    final profile = getOrCreate(profileId);
    profile.currentStage = WomenHealthStage.postpartum;
    profile.lastUpdatedAt = DateTime.now();

    HealthEventManager.instance.emitQuick(
      HealthEventType.pregnancyMilestoneReached,
      sourceModule: 'women_health_manager',
      profileId: profileId,
      data: {'milestone': 'delivery'},
    );
  }

  /// العودة لمتابعة الدورة الشهرية العادية بعد انتهاء فترة النفاس.
  void returnToCycleTracking(String profileId) {
    final profile = getOrCreate(profileId);
    profile.currentStage = WomenHealthStage.cycleTracking;
    profile.activePregnancyId = null;
    profile.lastUpdatedAt = DateTime.now();
  }

  /// تعطيل الوحدة بالكامل لملف معيّن بناءً على اختيار المستخدمة الصريح.
  void optOut(String profileId) {
    final profile = getOrCreate(profileId);
    profile.currentStage = WomenHealthStage.none;
    profile.activePregnancyId = null;
  }
}
