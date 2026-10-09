/// =============================================================
/// Lifex-AI — رعاية النساء والحمل
/// الملف: women_lifecycle_education_engine.dart
/// المسار: lib/features/women_health/women_lifecycle_education_engine.dart
/// الوصف: محتوى توعوي عام مصنَّف حسب المراحل العمرية لصحة المرأة
/// (المراهقة، سن الإنجاب، ما حول سن اليأس، وما بعده)، مستقل عن حالة
/// حمل أو دورة معينة — توعية عامة دائمة الإتاحة.
/// =============================================================

/// المراحل العمرية الأساسية لتصنيف المحتوى التوعوي.
enum WomenLifeStage {
  adolescence, // المراهقة وبداية الدورة الشهرية
  reproductiveAge, // سن الإنجاب
  perimenopause, // ما حول سن اليأس
  postmenopause, // ما بعد سن اليأس
}

/// عنصر محتوى توعوي واحد.
class EducationalTopic {
  final String id;
  final String titleAr;
  final String bodyAr;
  final WomenLifeStage stage;

  const EducationalTopic({
    required this.id,
    required this.titleAr,
    required this.bodyAr,
    required this.stage,
  });
}

/// محتوى توعوي عام ثابت (Static content) لكل مرحلة عمرية. هذا محتوى
/// تثقيفي مُعَد مسبقاً وليس تحليلاً آلياً، ما يقلل مخاطر الخطأ الطبي
/// ويسهّل مراجعته من مختص طبي قبل النشر الفعلي داخل المتجر.
const List<EducationalTopic> _educationalTopics = [
  EducationalTopic(
    id: 'edu_001',
    titleAr: 'بداية الدورة الشهرية: ما الطبيعي وما يستدعي استشارة طبيب',
    bodyAr:
        'يختلف عمر بداية الدورة الشهرية بين الفتيات، وتختلف انتظامها في '
        'السنوات الأولى. عدم الانتظام في البداية أمر شائع، لكن الألم '
        'الشديد جداً أو الغياب التام لفترة طويلة يستحقان استشارة طبيبة.',
    stage: WomenLifeStage.adolescence,
  ),
  EducationalTopic(
    id: 'edu_002',
    titleAr: 'أهمية الفحوصات الدورية في سن الإنجاب',
    bodyAr:
        'تُنصح النساء في سن الإنجاب بمتابعة الفحوصات الدورية النسائية '
        'حسب توصية الطبيبة، بما يشمل فحوصات الكشف المبكر المناسبة للعمر.',
    stage: WomenLifeStage.reproductiveAge,
  ),
  EducationalTopic(
    id: 'edu_003',
    titleAr: 'التغيرات الشائعة في مرحلة ما حول سن اليأس',
    bodyAr:
        'قد تشمل هذه المرحلة تغيّرات في انتظام الدورة، وهبات ساخنة، '
        'واضطرابات نوم أو مزاج. هذه تغيّرات شائعة، ويمكن لطبيبة أن تناقش '
        'خيارات إدارتها إن كانت مزعجة.',
    stage: WomenLifeStage.perimenopause,
  ),
  EducationalTopic(
    id: 'edu_004',
    titleAr: 'العناية بصحة العظام والقلب بعد سن اليأس',
    bodyAr:
        'تزداد أهمية متابعة صحة العظام والقلب بعد سن اليأس نتيجة التغيّر '
        'الهرموني الطبيعي. يُنصح بمناقشة خطة متابعة مناسبة مع الطبيب.',
    stage: WomenLifeStage.postmenopause,
  ),
];

/// محرك التوعية الصحية النسائية حسب المرحلة العمرية.
class WomenLifecycleEducationEngine {
  WomenLifecycleEducationEngine();

  /// كل المواضيع التوعوية الخاصة بمرحلة عمرية معيّنة.
  List<EducationalTopic> topicsFor(WomenLifeStage stage) {
    return _educationalTopics.where((t) => t.stage == stage).toList();
  }

  /// تحديد المرحلة العمرية الأنسب تلقائياً بناءً على العمر (تصنيف عام
  /// تقريبي فقط، وليس قاعدة طبية صارمة؛ يمكن للمستخدمة تغييره يدوياً).
  WomenLifeStage stageForAge(int age) {
    if (age < 18) return WomenLifeStage.adolescence;
    if (age < 45) return WomenLifeStage.reproductiveAge;
    if (age < 55) return WomenLifeStage.perimenopause;
    return WomenLifeStage.postmenopause;
  }

  /// المواضيع التوعوية المقترحة مباشرة بناءً على عمر المستخدمة.
  List<EducationalTopic> suggestedTopicsForAge(int age) {
    return topicsFor(stageForAge(age));
  }

  EducationalTopic? getTopicById(String id) {
    try {
      return _educationalTopics.firstWhere((t) => t.id == id);
    } catch (_) {
      return null;
    }
  }
}
