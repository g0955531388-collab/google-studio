/// =============================================================
/// Lifex-AI — الطاقة والاستدامة
/// الملف: survival_energy_mode.dart
/// المسار: lib/features/energy/survival_energy_mode.dart
/// الوصف: "وضع البقاء" — عند انخفاض البطارية بشدة، يُعطَّل مؤقتاً كل ما
/// ليس ضرورياً (كاميرا ذكية، صوت مستمر...) مع إبقاء الطوارئ والتراسل
/// الأساسي فعّالين دائماً بأي ثمن.
/// =============================================================

/// الميزات التي يجب أن تبقى فعّالة دائماً حتى في أحرج ظروف البطارية —
/// قائمة صريحة وثابتة، لا يجوز أن يُدرَج فيها أي وحدة طوارئ أو تراسل
/// أساسي كي لا تُعطَّل بالخطأ.
const List<String> alwaysActiveFeatures = [
  'emergency_manager',
  'sms_fallback_channel',
  'health_alert_dispatcher',
];

/// وضع البقاء بالطاقة.
class SurvivalEnergyMode {
  SurvivalEnergyMode({
    this.activationThresholdPercent = 15,
    this.deactivationThresholdPercent = 25,
    List<String>? restrictedFeatures,
  }) : restrictedFeatures = restrictedFeatures ??
            const [
              'smart_vision_engine',
              'voice_engine',
              'remote_health_monitor',
              'background_sync',
            ];

  final int activationThresholdPercent;
  final int deactivationThresholdPercent;

  /// الميزات التي تُعطَّل أو تُخفَّف عند تفعيل وضع البقاء. هذه القائمة
  /// لا يجوز أن تحتوي أي عنصر من [alwaysActiveFeatures] — يُتحقق من
  /// ذلك صراحة عند الإنشاء لمنع خطأ برمجي خطير مستقبلاً.
  final List<String> restrictedFeatures;

  bool _isActive = false;
  bool get isActive => _isActive;

  void activate() {
    assert(
      restrictedFeatures.every((f) => !alwaysActiveFeatures.contains(f)),
      'خطأ إعداد: لا يجوز تقييد ميزة أساسية دائمة التفعيل مثل الطوارئ.',
    );
    _isActive = true;
  }

  void deactivate() {
    _isActive = false;
  }
}
