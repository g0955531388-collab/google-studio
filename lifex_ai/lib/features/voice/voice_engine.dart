/// =============================================================
/// Lifex-AI — وحدة الصوت والذكاء اللغوي
/// الملف: voice_engine.dart
/// المسار: lib/features/voice/voice_engine.dart
/// الوصف: المحرك المركزي الموجّه لكل وحدة الصوت — يوزّع المهام بين تحويل
/// الصوت لنص، النص لصوت، اكتشاف اللغة، والأوامر الصوتية، دون أن ينفذ
/// أياً منها بنفسه.
///
/// ⚠️ خصوصية إلزامية: أي تسجيل صوتي يتطلب إذن الميكروفون صراحة من
/// المستخدم (runtime permission) مع شرح واضح للسبب قبل الطلب. لا يُخزَّن
/// أو يُرسل أي مقطع صوتي لأي خادم دون موافقة صريحة ومنفصلة عن إذن النظام.
/// =============================================================

import '../../core/error_handler.dart';

/// حالة تشغيل محرك الصوت العامة.
enum VoiceEngineState { idle, listening, processing, speaking, error }

/// نتيجة عامة موحّدة لأي عملية صوتية.
class VoiceOperationResult {
  final bool success;
  final String? textResult;
  final String? errorMessageAr;

  const VoiceOperationResult.success({this.textResult})
      : success = true,
        errorMessageAr = null;

  const VoiceOperationResult.failure(this.errorMessageAr)
      : success = false,
        textResult = null;
}

/// توقيع دالة الاستماع لتغيّر حالة محرك الصوت (لتحديث الواجهة).
typedef VoiceStateListener = void Function(VoiceEngineState state);

/// المحرك المركزي لوحدة الصوت. لا يحتوي منطق تحويل فعلي؛ يُدير الحالة
/// العامة ويوجّه الطلبات للمحركات الفرعية المسجَّلة فيه.
class VoiceEngine {
  VoiceEngine._internal();
  static final VoiceEngine instance = VoiceEngine._internal();

  VoiceEngineState _state = VoiceEngineState.idle;
  final List<VoiceStateListener> _listeners = [];

  /// دوال منفَّذة من المحركات الفرعية (تُسجَّل عند التهيئة عبر
  /// voice_command_engine أو غيره) لتنفيذ العمليات الفعلية.
  Future<VoiceOperationResult> Function()? _startListeningImpl;
  Future<void> Function()? _stopListeningImpl;
  Future<VoiceOperationResult> Function(String text)? _speakImpl;

  VoiceEngineState get state => _state;

  void addStateListener(VoiceStateListener listener) =>
      _listeners.add(listener);
  void removeStateListener(VoiceStateListener listener) =>
      _listeners.remove(listener);

  void _setState(VoiceEngineState newState) {
    _state = newState;
    for (final listener in List<VoiceStateListener>.from(_listeners)) {
      listener(newState);
    }
  }

  /// ربط التنفيذ الفعلي للاستماع (يُستدعى من speech_to_text_processor.dart).
  void bindListeningImplementation(
    Future<VoiceOperationResult> Function() implementation,
  ) {
    _startListeningImpl = implementation;
  }

  /// ربط التنفيذ الفعلي لإيقاف الاستماع.
  void bindStopListeningImplementation(
    Future<void> Function() implementation,
  ) {
    _stopListeningImpl = implementation;
  }

  /// ربط التنفيذ الفعلي للنطق (يُستدعى من text_to_speech_manager.dart).
  void bindSpeakImplementation(
    Future<VoiceOperationResult> Function(String text) implementation,
  ) {
    _speakImpl = implementation;
  }

  /// بدء الاستماع لصوت المستخدم وتحويله لنص.
  Future<VoiceOperationResult> startListening() async {
    if (_startListeningImpl == null) {
      ErrorHandler.instance.report(
        'VOICE_LISTEN_NOT_BOUND',
        'لم يتم ربط منفّذ الاستماع الصوتي بعد.',
        sourceModule: 'voice_engine',
        severity: ErrorSeverity.warning,
      );
      return const VoiceOperationResult.failure(
        'ميزة التعرّف الصوتي غير جاهزة حالياً.',
      );
    }

    _setState(VoiceEngineState.listening);
    try {
      final result = await _startListeningImpl!();
      _setState(VoiceEngineState.idle);
      return result;
    } catch (e, stackTrace) {
      _setState(VoiceEngineState.error);
      ErrorHandler.instance.report(
        'VOICE_LISTEN_FAILED',
        'فشل تشغيل الاستماع الصوتي.',
        sourceModule: 'voice_engine',
        exception: e,
        stackTrace: stackTrace,
      );
      return const VoiceOperationResult.failure('حدث خطأ أثناء الاستماع.');
    }
  }

  Future<void> stopListening() async {
    await _stopListeningImpl?.call();
    _setState(VoiceEngineState.idle);
  }

  /// نطق نص معيّن بصوت مسموع (Text-to-Speech).
  Future<VoiceOperationResult> speak(String text) async {
    if (_speakImpl == null) {
      ErrorHandler.instance.report(
        'VOICE_SPEAK_NOT_BOUND',
        'لم يتم ربط منفّذ النطق الصوتي بعد.',
        sourceModule: 'voice_engine',
        severity: ErrorSeverity.warning,
      );
      return const VoiceOperationResult.failure(
        'ميزة القراءة الصوتية غير جاهزة حالياً.',
      );
    }

    _setState(VoiceEngineState.speaking);
    final result = await _speakImpl!(text);
    _setState(VoiceEngineState.idle);
    return result;
  }
}
