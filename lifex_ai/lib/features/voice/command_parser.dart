/// =============================================================
/// Lifex-AI — وحدة الصوت والذكاء اللغوي
/// الملف: command_parser.dart
/// المسار: lib/features/voice/command_parser.dart
/// الوصف: محلل الأوامر — يحوّل نص المستخدم الخام (بعد تحويله من صوت)
/// إلى "نيّة" (Intent) واضحة يفهمها voice_command_engine.dart، عبر
/// مطابقة كلمات مفتاحية بسيطة (Rule-based)، قابل للاستبدال لاحقاً
/// بمحرك NLU أكثر تطوراً دون تغيير الواجهة العامة.
/// =============================================================

/// النيّات (Intents) المدعومة حالياً للأوامر الصوتية.
enum VoiceCommandIntent {
  openHealthProfile,
  openMedications,
  openAppointments,
  callEmergency,
  addSymptom,
  readLastLabResult,
  switchProfile,
  unknown,
}

/// نتيجة تفسير أمر صوتي واحد.
class ParsedVoiceCommand {
  final VoiceCommandIntent intent;
  final Map<String, String> parameters;
  final String originalText;

  const ParsedVoiceCommand({
    required this.intent,
    this.parameters = const {},
    required this.originalText,
  });
}

/// قاعدة مطابقة واحدة: مجموعة كلمات مفتاحية → نيّة محددة.
class _CommandRule {
  final VoiceCommandIntent intent;
  final List<String> keywords;

  const _CommandRule(this.intent, this.keywords);
}

/// محلل الأوامر الصوتية بنمط قائم على القواعد (Rule-based). بسيط
/// ومباشر ومناسب للمرحلة الأولى؛ يمكن استبداله لاحقاً بمحرك فهم لغة
/// طبيعية أكثر تطوراً طالما يُعيد نفس نوع [ParsedVoiceCommand].
class CommandParser {
  CommandParser();

  final List<_CommandRule> _rules = const [
    _CommandRule(VoiceCommandIntent.openHealthProfile, [
      'ملفي الصحي',
      'الملف الصحي',
      'صحتي',
    ]),
    _CommandRule(VoiceCommandIntent.openMedications, [
      'أدويتي',
      'الأدوية',
      'دوائي',
    ]),
    _CommandRule(VoiceCommandIntent.openAppointments, [
      'مواعيدي',
      'المواعيد',
      'حجز موعد',
    ]),
    _CommandRule(VoiceCommandIntent.callEmergency, [
      'طوارئ',
      'إسعاف',
      'ساعدوني',
      'نجدة',
    ]),
    _CommandRule(VoiceCommandIntent.addSymptom, [
      'سجل عرض',
      'أضف عرض',
      'عندي عرض',
    ]),
    _CommandRule(VoiceCommandIntent.readLastLabResult, [
      'نتيجة التحليل',
      'آخر تحليل',
      'اقرأ نتيجتي',
    ]),
    _CommandRule(VoiceCommandIntent.switchProfile, [
      'بدّل الملف',
      'غيّر الحساب',
      'ملف آخر',
    ]),
  ];

  /// تفسير نص خام إلى أمر مفسَّر. أوامر "الطوارئ" لها أولوية مطلقة في
  /// المطابقة لأنها الأكثر حساسية من ناحية السلامة.
  ParsedVoiceCommand parse(String rawText) {
    final normalized = rawText.trim();

    final emergencyRule = _rules.firstWhere(
      (r) => r.intent == VoiceCommandIntent.callEmergency,
    );
    if (emergencyRule.keywords.any((k) => normalized.contains(k))) {
      return ParsedVoiceCommand(
        intent: VoiceCommandIntent.callEmergency,
        originalText: rawText,
      );
    }

    for (final rule in _rules) {
      if (rule.intent == VoiceCommandIntent.callEmergency) continue;
      if (rule.keywords.any((k) => normalized.contains(k))) {
        return ParsedVoiceCommand(
          intent: rule.intent,
          originalText: rawText,
        );
      }
    }

    return ParsedVoiceCommand(
      intent: VoiceCommandIntent.unknown,
      originalText: rawText,
    );
  }
}
