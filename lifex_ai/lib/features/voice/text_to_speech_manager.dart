/// =============================================================
/// Lifex-AI — وحدة الصوت والذكاء اللغوي
/// الملف: text_to_speech_manager.dart
/// المسار: lib/features/voice/text_to_speech_manager.dart
/// الوصف: مدير تحويل النص إلى صوت (Text-to-Speech) — يوفر عقداً مجرداً
/// لأي مزوّد TTS فعلي، ويربطه بـ VoiceEngine المركزي.
/// =============================================================

import 'voice_engine.dart';

/// إعدادات النطق (سرعة، طبقة صوت، لغة) القابلة للتخصيص من المستخدم.
class SpeechSettings {
  final double speechRate; // 0.0 (بطيء جداً) إلى 1.0 (سريع جداً)
  final double pitch; // 0.5 (منخفض) إلى 2.0 (عالٍ)
  final String localeCode;

  const SpeechSettings({
    this.speechRate = 0.5,
    this.pitch = 1.0,
    this.localeCode = 'ar',
  });
}

/// عقد أي مزوّد نطق فعلي (Text-to-Speech provider).
abstract class TextToSpeechProvider {
  Future<bool> speak(String text, SpeechSettings settings);
  Future<void> stop();
  Future<bool> get isLanguageSupported;
}

/// مدير النطق — يربط بين VoiceEngine المركزي وأي مزوّد TTS فعلي.
class TextToSpeechManager {
  TextToSpeechManager({
    required this.provider,
    SpeechSettings? defaultSettings,
  }) : defaultSettings = defaultSettings ?? const SpeechSettings();

  final TextToSpeechProvider provider;
  SpeechSettings defaultSettings;

  void registerWithVoiceEngine(VoiceEngine engine) {
    engine.bindSpeakImplementation(_speak);
  }

  Future<VoiceOperationResult> _speak(String text) async {
    if (text.trim().isEmpty) {
      return const VoiceOperationResult.failure('لا يوجد نص لنطقه.');
    }

    final supported = await provider.isLanguageSupported;
    if (!supported) {
      return const VoiceOperationResult.failure(
        'اللغة الحالية غير مدعومة للقراءة الصوتية على هذا الجهاز.',
      );
    }

    final success = await provider.speak(text, defaultSettings);
    if (!success) {
      return const VoiceOperationResult.failure(
        'تعذّرت القراءة الصوتية للنص. حاول مرة أخرى.',
      );
    }
    return VoiceOperationResult.success(textResult: text);
  }

  /// تحديث إعدادات النطق الافتراضية (مثلاً من شاشة الإعدادات).
  void updateDefaultSettings(SpeechSettings settings) {
    defaultSettings = settings;
  }

  Future<void> stopSpeaking() => provider.stop();
}
