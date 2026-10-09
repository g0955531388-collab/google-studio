/// =============================================================
/// Lifex-AI — الطوارئ
/// الملف: emergency_message_manager.dart
/// المسار: lib/features/emergency/emergency_message_manager.dart
/// الوصف: تجهيز وإرسال رسائل الاستغاثة الفعلية لجهات الثقة والطوارئ
/// الرسمية، بمحتوى واضح ومباشر حسب مستوى الخطورة.
/// =============================================================

import '../../core/app_constants.dart';

/// توقيع دالة الإرسال الفعلي (سيُربط لاحقاً بـ SMS/Push/مكالمة فعلية).
typedef EmergencySendFunction = Future<bool> Function(
  String recipientContact,
  String messageAr,
);

class EmergencyDispatchRecord {
  final String caseId;
  final String profileId;
  final String riskLevel;
  final DateTime dispatchedAt;

  EmergencyDispatchRecord({
    required this.caseId,
    required this.profileId,
    required this.riskLevel,
    DateTime? dispatchedAt,
  }) : dispatchedAt = dispatchedAt ?? DateTime.now();
}

/// مدير إرسال رسائل الاستغاثة.
class EmergencyMessageManager {
  EmergencyMessageManager({this.sendFunction});

  final EmergencySendFunction? sendFunction;
  final List<EmergencyDispatchRecord> _log = [];

  /// بناء نص الرسالة حسب مستوى الخطورة وإرسالها (التسجيل يتم دائماً
  /// حتى لو فشل الإرسال الفعلي، لأغراض التدقيق).
  Future<void> dispatchEmergencyMessage({
    required String profileId,
    required String caseId,
    required String riskLevel,
    required String reasonAr,
  }) async {
    _log.add(EmergencyDispatchRecord(
      caseId: caseId,
      profileId: profileId,
      riskLevel: riskLevel,
    ));

    final message = _buildMessage(riskLevel, reasonAr);

    if (sendFunction != null) {
      await sendFunction!('trusted_contacts_and_emergency_services', message);
    }
  }

  String _buildMessage(String riskLevel, String reasonAr) {
    final urgencyPrefix = riskLevel == 'critical'
        ? '🚨 حالة طوارئ حرجة'
        : '⚠️ تنبيه صحي';
    // ملاحظة تصميم متعمَّدة: نستخدم نص الإسناد المختصر (وليس الكامل)
    // في رسائل الطوارئ تحديداً، لأن الرسالة يجب أن تبقى قصيرة ومباشرة
    // قدر الإمكان في حالة قد تكون فيها حياة إنسان على المحك؛ النص
    // الإسنادي الكامل يظهر في شاشة "حول التطبيق" والشاشة الافتتاحية.
    return '$urgencyPrefix: $reasonAr. يُرجى التواصل الفوري أو التوجه '
        'للموقع إن أمكن.\n\n${AppConstants.ownershipStatementShort}';
  }

  List<EmergencyDispatchRecord> get log => List.unmodifiable(_log);
}
