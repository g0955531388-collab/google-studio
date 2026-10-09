/// =============================================================
/// Lifex-AI — شبكة التبرع بالدم
/// الملف: flash_alert_notifier.dart
/// المسار: lib/features/blood_network/flash_alert_notifier.dart
/// الوصف: إرسال إشعار فوري "استغاثة دم" لمتبرع مؤهل، بأولوية عالية في
/// نظام الإشعارات (لا تندرج ضمن الإشعارات العادية القابلة للتأجيل).
/// =============================================================

import 'blood_request_engine.dart';

typedef FlashAlertSendFunction = Future<bool> Function(
  String recipientLifexId,
  String messageAr,
);

class FlashAlertRecord {
  final String recipientLifexId;
  final String requestId;
  final DateTime sentAt;

  FlashAlertRecord({
    required this.recipientLifexId,
    required this.requestId,
    DateTime? sentAt,
  }) : sentAt = sentAt ?? DateTime.now();
}

/// موزّع إشعارات استغاثة الدم الفورية.
class FlashAlertNotifier {
  FlashAlertNotifier({this.sendFunction});

  final FlashAlertSendFunction? sendFunction;
  final List<FlashAlertRecord> _log = [];

  Future<void> sendAlert(String recipientLifexId, BloodRequest request) async {
    _log.add(FlashAlertRecord(
      recipientLifexId: recipientLifexId,
      requestId: request.requestId,
    ));

    final urgencyLabel = request.urgency == BloodRequestUrgency.critical
        ? '🚨 عاجل جداً'
        : '⚠️ عاجل';

    final message = '$urgencyLabel: حالة قريبة منك تحتاج تبرعاً بفصيلة دم '
        'تطابق فصيلتك. هل يمكنك المساعدة؟';

    await sendFunction?.call(recipientLifexId, message);
  }

  List<FlashAlertRecord> get log => List.unmodifiable(_log);
}
