/// =============================================================
/// Lifex-AI — الهوية الصحية والملفات الشخصية
/// الملف: health_profile.dart
/// المسار: lib/features/profile/health_profile.dart
/// الوصف: نموذج "الملف الصحي الشخصي" (Smart Health CV) — هوية صحية حيّة
/// لكل مستخدم، تتغير مع الزمن وتجمع البيانات الأساسية، الحيوية، الطبية،
/// والسلوكية، وترتبط بجميع وحدات Lifex-AI حسب الصلاحيات الممنوحة.
/// =============================================================

import '../../core/health_event_manager.dart';

/// الجنس البيولوجي — يُستخدم لأغراض طبية بحتة (حسابات الجرعات، القيم
/// المرجعية للتحاليل، ربط وحدة رعاية النساء).
enum BiologicalSex { male, female, unspecified }

/// فصيلة الدم.
enum BloodType { aPositive, aNegative, bPositive, bNegative, abPositive, abNegative, oPositive, oNegative, unknown }

/// عنصر واحد في تاريخ الحساسية.
class AllergyRecord {
  final String substance;
  final String? reaction;
  final String severity; // uses AppConstants.riskLevel*
  final DateTime recordedAt;

  AllergyRecord({
    required this.substance,
    this.reaction,
    required this.severity,
    DateTime? recordedAt,
  }) : recordedAt = recordedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'substance': substance,
        'reaction': reaction,
        'severity': severity,
        'recordedAt': recordedAt.toIso8601String(),
      };

  factory AllergyRecord.fromJson(Map<String, dynamic> json) => AllergyRecord(
        substance: json['substance'] as String,
        reaction: json['reaction'] as String?,
        severity: json['severity'] as String,
        recordedAt: DateTime.parse(json['recordedAt'] as String),
      );
}

/// عنصر واحد في تاريخ الأمراض المزمنة أو الحالات الصحية المستمرة.
class ChronicConditionRecord {
  final String conditionName;
  final DateTime diagnosedAt;
  final bool isActive;
  final String? notes;

  ChronicConditionRecord({
    required this.conditionName,
    required this.diagnosedAt,
    this.isActive = true,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'conditionName': conditionName,
        'diagnosedAt': diagnosedAt.toIso8601String(),
        'isActive': isActive,
        'notes': notes,
      };

  factory ChronicConditionRecord.fromJson(Map<String, dynamic> json) =>
      ChronicConditionRecord(
        conditionName: json['conditionName'] as String,
        diagnosedAt: DateTime.parse(json['diagnosedAt'] as String),
        isActive: json['isActive'] as bool? ?? true,
        notes: json['notes'] as String?,
      );
}

/// الملف الصحي الشخصي الكامل — النموذج المركزي الذي تعتمد عليه كل
/// الوحدات الأخرى تقريباً (طوارئ، أطباء، صيدلية، تبرعات...).
class HealthProfile {
  final String profileId;

  /// الاسم الحقيقي — يخضع لصلاحيات profile_privacy_manager.dart عند العرض.
  String fullName;

  DateTime dateOfBirth;
  BiologicalSex biologicalSex;
  BloodType bloodType;

  double? heightCm;
  double? weightKg;

  List<AllergyRecord> allergies;
  List<ChronicConditionRecord> chronicConditions;

  /// معرّفات ملفات أفراد العائلة المرتبطين (يُستخدم مع
  /// family_genetic_engine.dart) — تخزّن كمعرفات فقط، البيانات نفسها
  /// تبقى في ملفاتهم المستقلة احتراماً للخصوصية.
  List<String> linkedFamilyProfileIds;

  DateTime lastUpdatedAt;

  HealthProfile({
    required this.profileId,
    required this.fullName,
    required this.dateOfBirth,
    this.biologicalSex = BiologicalSex.unspecified,
    this.bloodType = BloodType.unknown,
    this.heightCm,
    this.weightKg,
    List<AllergyRecord>? allergies,
    List<ChronicConditionRecord>? chronicConditions,
    List<String>? linkedFamilyProfileIds,
    DateTime? lastUpdatedAt,
  })  : allergies = allergies ?? [],
        chronicConditions = chronicConditions ?? [],
        linkedFamilyProfileIds = linkedFamilyProfileIds ?? [],
        lastUpdatedAt = lastUpdatedAt ?? DateTime.now();

  /// العمر الحالي بالسنوات، محسوب من تاريخ الميلاد.
  int get ageInYears {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month ||
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }

  /// مؤشر كتلة الجسم (BMI) — يُحسب فقط إذا توفر الطول والوزن.
  double? get bodyMassIndex {
    if (heightCm == null || weightKg == null || heightCm == 0) return null;
    final heightM = heightCm! / 100;
    return weightKg! / (heightM * heightM);
  }

  /// إضافة سجل حساسية جديد، مع إصدار حدث صحي لإعلام بقية النظام
  /// (مثلاً وحدة الصيدلية أو الذكاء الاصطناعي عند التحقق من دواء).
  void addAllergy(AllergyRecord allergy) {
    allergies.add(allergy);
    lastUpdatedAt = DateTime.now();
    HealthEventManager.instance.emitQuick(
      HealthEventType.profileUpdated,
      sourceModule: 'health_profile',
      profileId: profileId,
      data: {'updateType': 'allergy_added', 'substance': allergy.substance},
    );
  }

  /// إضافة حالة مزمنة جديدة.
  void addChronicCondition(ChronicConditionRecord condition) {
    chronicConditions.add(condition);
    lastUpdatedAt = DateTime.now();
    HealthEventManager.instance.emitQuick(
      HealthEventType.profileUpdated,
      sourceModule: 'health_profile',
      profileId: profileId,
      data: {
        'updateType': 'chronic_condition_added',
        'condition': condition.conditionName,
      },
    );
  }

  /// هل يحمل المستخدم حساسية معروفة تجاه مادة معينة؟ (يُستخدم من وحدة
  /// الصيدلية والذكاء الاصطناعي قبل التوصية بأي دواء).
  bool hasAllergyTo(String substance) {
    return allergies.any(
      (a) => a.substance.toLowerCase() == substance.toLowerCase(),
    );
  }

  Map<String, dynamic> toJson() => {
        'profileId': profileId,
        'fullName': fullName,
        'dateOfBirth': dateOfBirth.toIso8601String(),
        'biologicalSex': biologicalSex.name,
        'bloodType': bloodType.name,
        'heightCm': heightCm,
        'weightKg': weightKg,
        'allergies': allergies.map((a) => a.toJson()).toList(),
        'chronicConditions':
            chronicConditions.map((c) => c.toJson()).toList(),
        'linkedFamilyProfileIds': linkedFamilyProfileIds,
        'lastUpdatedAt': lastUpdatedAt.toIso8601String(),
      };

  factory HealthProfile.fromJson(Map<String, dynamic> json) => HealthProfile(
        profileId: json['profileId'] as String,
        fullName: json['fullName'] as String,
        dateOfBirth: DateTime.parse(json['dateOfBirth'] as String),
        biologicalSex: BiologicalSex.values.firstWhere(
          (e) => e.name == json['biologicalSex'],
          orElse: () => BiologicalSex.unspecified,
        ),
        bloodType: BloodType.values.firstWhere(
          (e) => e.name == json['bloodType'],
          orElse: () => BloodType.unknown,
        ),
        heightCm: (json['heightCm'] as num?)?.toDouble(),
        weightKg: (json['weightKg'] as num?)?.toDouble(),
        allergies: (json['allergies'] as List<dynamic>? ?? [])
            .map((e) => AllergyRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
        chronicConditions: (json['chronicConditions'] as List<dynamic>? ?? [])
            .map((e) =>
                ChronicConditionRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
        linkedFamilyProfileIds:
            (json['linkedFamilyProfileIds'] as List<dynamic>? ?? [])
                .map((e) => e as String)
                .toList(),
        lastUpdatedAt: DateTime.parse(json['lastUpdatedAt'] as String),
      );
}
