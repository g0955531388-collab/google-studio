/// =============================================================
/// Lifex-AI — وحدة الصوت والذكاء اللغوي
/// الملف: speech_to_text_processor.dart
/// المسار: lib/features/voice/speech_to_text_processor.dart
/// الوصف: معالج تحويل الصوت إلى نص. هذا الملف يوفر البنية والعقد
/// (Interface) الذي سيُنفَّذ لاحقاً عبر مكتبة تعرّف صوتي حقيقية
/// (مثل speech_to_text على Flutter)، دون ربط هذا الملف بمكتبة محددة الآن.
/// =============================================================

import 'voice_engine.dart';

/// حالة نتيجة التعرّف الصوتي.
enum SpeechRecognitionStatus { success, noSpeechDetected, permissionDenied, error }

class SpeechRecognitionResult {
  final SpeechRecognitionStatus status;
  final String? recognizedText;
  final double? confidence;

  const SpeechRecognitionResult({
    required this.status,
    this.recognizedText,
    this.confidence,
  });
}

/// عقد أي مزوّد تعرّف صوتي فعلي (Speech-to-Text provider). يُنفَّذ هذا
/// العقد لاحقاً بواسطة حزمة خارجية معينة، بينما بقية النظام يتعامل مع
/// هذا العقد المجرّد فقط.
abstract class SpeechToTextProvider {
  Future<bool> requestMicrophonePermission();
  Future<SpeechRecognitionResult> listenOnce({String localeCode = 'ar'});
  Future<void> stop();
}

/// معالج تحويل الصوت إلى نص — يربط بين VoiceEngine المركزي وأي مزوّد
/// تعرّف صوتي فعلي عبر SpeechToTextProvider.
class SpeechToTextProcessor {
  SpeechToTextProcessor({required this.provider});

  final SpeechToTextProvider provider;

  /// تسجيل هذا المعالج كمنفّذ فعلي داخل VoiceEngine المركزي. يُستدعى
  /// مرة واحدة عند تهيئة التطبيق.
  void registerWithVoiceEngine(VoiceEngine engine) {
    engine.bindListeningImplementation(_listenAndConvert);
    engine.bindStopListeningImplementation(provider.stop);
  }

  Future<VoiceOperationResult> _listenAndConvert() async {
    final hasPermission = await provider.requestMicrophonePermission();
    if (!hasPermission) {
      return const VoiceOperationResult.failure(
        'لم يتم منح إذن الميكروفون. لا يمكن استخدام الأوامر الصوتية بدونه.',
      );
    }

    final result = await provider.listenOnce();

    switch (result.status) {
      case SpeechRecognitionStatus.success:
        return VoiceOperationResult.success(textResult: result.recognizedText);
      case SpeechRecognitionStatus.noSpeechDetected:
        return const VoiceOperationResult.failure(
          'لم يتم رصد أي كلام. حاول التحدث بوضوح أكثر بالقرب من الميكروفون.',
        );
      case SpeechRecognitionStatus.permissionDenied:
        return const VoiceOperationResult.failure(
          'إذن الميكروفون مرفوض. يمكنك تفعيله من إعدادات الجهاز.',
        );
      case SpeechRecognitionStatus.error:
        return const VoiceOperationResult.failure(
          'حدث خطأ أثناء معالجة الصوت. حاول مرة أخرى.',
        );
    }
  }
}
