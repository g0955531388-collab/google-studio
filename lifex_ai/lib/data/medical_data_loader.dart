/// =============================================================
/// Lifex-AI Global Health Network
/// الملف: medical_data_loader.dart
/// المسار: lib/data/medical_data_loader.dart
/// الوصف: يبني الخرائط الجاهزة التي يحتاجها AiBridge من محتوى
/// symptoms_database.json وmedical_knowledge.json، بعد قراءتهما عبر
/// MedicalDatabaseManager — وليس مباشرة من rootBundle — حتى يستفيد
/// الذكاء الاصطناعي تلقائياً من أي تحديث للحزمة الطبية يُنزَّل من
/// الخادم، دون أي تغيير في هذا الملف.
/// =============================================================

import 'medical_database_manager.dart';

/// نتيجة تحميل كل البيانات الطبية اللازمة لتهيئة محركات الذكاء
/// الاصطناعي عبر AiBridge.initialize().
class LoadedMedicalKnowledge {
  final Map<String, String> symptomKeywordMap;
  final Set<String> emergencySymptomIds;
  final Map<String, String> symptomBodySystemMap;

  const LoadedMedicalKnowledge({
    required this.symptomKeywordMap,
    required this.emergencySymptomIds,
    required this.symptomBodySystemMap,
  });
}

/// محمّل البيانات الطبية — يبني الخرائط النهائية فوق ما يُرجعه
/// MedicalDatabaseManager (سواء كانت نسخة الأصول الافتراضية أو نسخة
/// محدَّثة من الخادم).
class MedicalDataLoader {
  MedicalDataLoader._();

  /// تحميل وبناء كل الخرائط اللازمة لتهيئة الذكاء الاصطناعي الصحي
  /// دفعة واحدة عند إقلاع التطبيق.
  static Future<LoadedMedicalKnowledge> loadAll(
    MedicalDatabaseManager databaseManager,
  ) async {
    final symptomsJson = await databaseManager.readBundleFile(
      MedicalBundleFiles.symptoms,
    );
    final knowledgeJson = await databaseManager.readBundleFile(
      MedicalBundleFiles.knowledge,
    );

    final symptomKeywordMap = _buildSymptomKeywordMap(symptomsJson);
    final symptomBodySystemMap = _buildSymptomBodySystemMap(symptomsJson);
    final emergencySymptomIds = _buildEmergencySymptomIds(knowledgeJson);

    return LoadedMedicalKnowledge(
      symptomKeywordMap: symptomKeywordMap,
      emergencySymptomIds: emergencySymptomIds,
      symptomBodySystemMap: symptomBodySystemMap,
    );
  }

  /// بناء خريطة: الاسم العربي للعرض → معرّف العرض. تُستخدم من
  /// HealthAnalysisEngine لمطابقة كلمات المستخدم بمعرّفات ثابتة.
  static Map<String, String> _buildSymptomKeywordMap(
    Map<String, dynamic> symptomsJson,
  ) {
    final symptoms = symptomsJson['symptoms'] as List<dynamic>? ?? [];
    final map = <String, String>{};

    for (final entry in symptoms) {
      final symptom = entry as Map<String, dynamic>;
      final nameAr = symptom['nameAr'] as String?;
      final id = symptom['id'] as String?;
      if (nameAr != null && id != null) {
        map[nameAr] = id;
      }
    }
    return map;
  }

  /// بناء خريطة: معرّف العرض → النظام الجسدي (bodySystem)، تُستخدم من
  /// DoctorGuidanceEngine لتحديد التخصص المناسب.
  static Map<String, String> _buildSymptomBodySystemMap(
    Map<String, dynamic> symptomsJson,
  ) {
    final symptoms = symptomsJson['symptoms'] as List<dynamic>? ?? [];
    final map = <String, String>{};

    for (final entry in symptoms) {
      final symptom = entry as Map<String, dynamic>;
      final id = symptom['id'] as String?;
      final bodySystem = symptom['bodySystem'] as String?;
      if (id != null && bodySystem != null) {
        map[id] = bodySystem;
      }
    }
    return map;
  }

  /// استخراج معرّفات الأعراض الحرجة من قواعد التصعيد الموجودة في
  /// medical_knowledge.json (emergencyEscalationRules).
  static Set<String> _buildEmergencySymptomIds(
    Map<String, dynamic> knowledgeJson,
  ) {
    final rules =
        knowledgeJson['emergencyEscalationRules'] as List<dynamic>? ?? [];
    final ids = <String>{};

    for (final entry in rules) {
      final rule = entry as Map<String, dynamic>;
      final triggerIds = rule['triggerSymptomIds'] as List<dynamic>? ?? [];
      for (final id in triggerIds) {
        ids.add(id as String);
      }
    }
    return ids;
  }
}
