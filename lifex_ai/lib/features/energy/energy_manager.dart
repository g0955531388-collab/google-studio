/// =============================================================
/// Lifex-AI — الطاقة والاستدامة
/// الملف: energy_manager.dart
/// المسار: lib/features/energy/energy_manager.dart
/// الوصف: المدير المركزي لسياسات استهلاك الطاقة داخل التطبيق — يقرر
/// أي ميزات تُخفَّف أو تُعطَّل مؤقتاً بناءً على حالة البطارية.
/// =============================================================

import 'battery_monitor.dart';
import 'survival_energy_mode.dart';

/// المدير المركزي للطاقة.
class EnergyManager {
  EnergyManager({
    required this.batteryMonitor,
    required this.survivalMode,
  }) {
    batteryMonitor.addListener(_onBatteryChanged);
  }

  final BatteryMonitor batteryMonitor;
  final SurvivalEnergyMode survivalMode;

  void _onBatteryChanged(BatteryStatus status) {
    if (status.level <= survivalMode.activationThresholdPercent &&
        !status.isCharging) {
      survivalMode.activate();
    } else if (survivalMode.isActive &&
        (status.isCharging || status.level > survivalMode.deactivationThresholdPercent)) {
      survivalMode.deactivate();
    }
  }

  /// هل ميزة معيّنة (بالاسم) يجب أن تعمل بكامل طاقتها حالياً، أم يجب
  /// تخفيفها بسبب وضع البقاء؟
  bool isFeatureFullyEnabled(String featureName) {
    if (!survivalMode.isActive) return true;
    return !survivalMode.restrictedFeatures.contains(featureName);
  }
}
