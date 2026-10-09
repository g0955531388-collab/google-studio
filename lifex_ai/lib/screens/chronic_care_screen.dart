/// =============================================================
/// Lifex-AI — متابعة الحالات المزمنة والمؤشرات الحيوية
/// الملف: chronic_care_screen.dart
/// المسار: lib/screens/chronic_care_screen.dart
/// الوصف: شاشة متخصصة لمرضى الحالات المزمنة (السكري، الضغط، القلب، الجهاز التنفسي)
/// تتيح تسجيل القياسات الحيوية، فحص استقرارها مقارنة بالمعدلات الآمنة،
/// وتنبيه المريض ومرافقه عند تجاوز الحدود الحرجة.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/profile/active_profile_controller.dart';
import '../widgets/accessible_widgets.dart';

enum VitalType { bloodPressure, bloodGlucose, heartRate, oxygenSaturation, bodyTemperature }

class VitalReading {
  final String id;
  final VitalType type;
  final double primaryValue;
  final double? secondaryValue; // مثل الضغط الانبساطي
  final DateTime recordedAt;
  final String notes;

  VitalReading({
    required this.id,
    required this.type,
    required this.primaryValue,
    this.secondaryValue,
    required this.recordedAt,
    this.notes = '',
  });

  String get labelAr {
    switch (type) {
      case VitalType.bloodPressure:
        return 'ضغط الدم (ملم زئبق)';
      case VitalType.bloodGlucose:
        return 'سكر الدم (ملغ/ديسيلتر)';
      case VitalType.heartRate:
        return 'نبض القلب (نبضة/د)';
      case VitalType.oxygenSaturation:
        return 'تشبع الأكسجين (SpO2 %)';
      case VitalType.bodyTemperature:
        return 'درجة الحرارة (مئوية)';
    }
  }

  String get displayValue {
    switch (type) {
      case VitalType.bloodPressure:
        return '${primaryValue.toInt()} / ${secondaryValue?.toInt() ?? 80} mmHg';
      case VitalType.bloodGlucose:
        return '${primaryValue.toInt()} mg/dL';
      case VitalType.heartRate:
        return '${primaryValue.toInt()} bpm';
      case VitalType.oxygenSaturation:
        return '${primaryValue.toInt()} %';
      case VitalType.bodyTemperature:
        return '${primaryValue.toStringAsFixed(1)} °C';
    }
  }

  bool get isAbnormal {
    switch (type) {
      case VitalType.bloodPressure:
        return primaryValue > 140 || primaryValue < 90 || (secondaryValue != null && secondaryValue! > 90);
      case VitalType.bloodGlucose:
        return primaryValue > 180 || primaryValue < 70;
      case VitalType.heartRate:
        return primaryValue > 100 || primaryValue < 55;
      case VitalType.oxygenSaturation:
        return primaryValue < 94;
      case VitalType.bodyTemperature:
        return primaryValue > 38.0 || primaryValue < 35.5;
    }
  }

  String get statusDescriptionAr {
    if (!isAbnormal) return 'ضمن المعدل الطبيعي والمستقر';
    switch (type) {
      case VitalType.bloodPressure:
        return primaryValue > 140 ? 'ضغط دم مرتفع - يُرجى الراحة وإعادة القياس' : 'ضغط دم منخفض';
      case VitalType.bloodGlucose:
        return primaryValue > 180 ? 'سكر دم مرتفع - راجع الخطة العلاجية والجرعة' : 'هبوط في سكر الدم - تناول سكريات سريعة';
      case VitalType.heartRate:
        return primaryValue > 100 ? 'تسارع في ضربات القلب' : 'تباطؤ في ضربات القلب';
      case VitalType.oxygenSaturation:
        return 'انخفاض في نسبة الأكسجين - استشر الطبيب فوراً';
      case VitalType.bodyTemperature:
        return primaryValue > 38.0 ? 'ارتفاع في درجة الحرارة (حمى)' : 'انخفاض في حرارة الجسم';
    }
  }
}

class ChronicCareScreen extends StatefulWidget {
  const ChronicCareScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<ChronicCareScreen> createState() => _ChronicCareScreenState();
}

class _ChronicCareScreenState extends State<ChronicCareScreen> {
  final List<VitalReading> _readings = [
    VitalReading(
      id: 'v-1',
      type: VitalType.bloodPressure,
      primaryValue: 125,
      secondaryValue: 82,
      recordedAt: DateTime.now().subtract(const Duration(hours: 3)),
      notes: 'قياس صباحي بعد الاستيقاظ',
    ),
    VitalReading(
      id: 'v-2',
      type: VitalType.bloodGlucose,
      primaryValue: 110,
      recordedAt: DateTime.now().subtract(const Duration(hours: 5)),
      notes: 'صائم قبل الإفطار',
    ),
    VitalReading(
      id: 'v-3',
      type: VitalType.oxygenSaturation,
      primaryValue: 98,
      recordedAt: DateTime.now().subtract(const Duration(hours: 6)),
    ),
  ];

  VitalType _selectedType = VitalType.bloodPressure;
  final _primaryController = TextEditingController();
  final _secondaryController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _primaryController.dispose();
    _secondaryController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addReadingDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('تسجيل قياس حيوي جديد'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<VitalType>(
                  value: _selectedType,
                  decoration: const InputDecoration(labelText: 'نوع المؤشر الحيوي'),
                  items: const [
                    DropdownMenuItem(
                      value: VitalType.bloodPressure,
                      child: Text('ضغط الدم (انقباضي / انبساطي)'),
                    ),
                    DropdownMenuItem(
                      value: VitalType.bloodGlucose,
                      child: Text('سكر الدم (mg/dL)'),
                    ),
                    DropdownMenuItem(
                      value: VitalType.heartRate,
                      child: Text('نبض القلب (bpm)'),
                    ),
                    DropdownMenuItem(
                      value: VitalType.oxygenSaturation,
                      child: Text('تشبع الأكسجين (SpO2 %)'),
                    ),
                    DropdownMenuItem(
                      value: VitalType.bodyTemperature,
                      child: Text('درجة الحرارة (°C)'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() {
                        _selectedType = val;
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _primaryController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: _selectedType == VitalType.bloodPressure
                        ? 'الضغط الانقباضي (مثال: 120)'
                        : 'القيمة المقاسة',
                  ),
                ),
                if (_selectedType == VitalType.bloodPressure) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _secondaryController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'الضغط الانبساطي (مثال: 80)',
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: _notesController,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات (اختياري)',
                    hintText: 'مثال: بعد تناول الغداء',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () {
                final prim = double.tryParse(_primaryController.text.trim());
                if (prim == null) return;
                final sec = _selectedType == VitalType.bloodPressure
                    ? double.tryParse(_secondaryController.text.trim())
                    : null;

                final reading = VitalReading(
                  id: 'v-${DateTime.now().millisecondsSinceEpoch}',
                  type: _selectedType,
                  primaryValue: prim,
                  secondaryValue: sec,
                  recordedAt: DateTime.now(),
                  notes: _notesController.text.trim(),
                );

                setState(() {
                  _readings.insert(0, reading);
                });

                // اهتزاز تأكيدي حسي
                HapticFeedback.mediumImpact();

                HealthEventManager.instance.emitQuick(
                  HealthEventType.profileUpdated,
                  sourceModule: 'chronic_care_screen',
                  profileId: widget.profileId,
                  data: {
                    'vitalType': reading.type.name,
                    'value': reading.primaryValue,
                    'isAbnormal': reading.isAbnormal,
                  },
                );

                _primaryController.clear();
                _secondaryController.clear();
                _notesController.clear();
                Navigator.of(dialogContext).pop();

                if (reading.isAbnormal) {
                  // تنبيه فوري
                  HapticFeedback.heavyImpact();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('تنبيه: ${reading.statusDescriptionAr}'),
                      backgroundColor: Colors.deepOrange,
                      duration: const Duration(seconds: 4),
                    ),
                  );
                }
              },
              child: const Text('حفظ القياس'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'المريض';

    return Scaffold(
      appBar: AppBar(
        title: Text('رعاية الحالات المزمنة ($profileName)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addReadingDialog,
        icon: const Icon(Icons.add_chart),
        label: const Text('تسجيل قياس'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Semantics(
              header: true,
              child: Card(
                color: Colors.teal.shade50,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.teal.shade200),
                ),
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.health_and_safety, color: Colors.teal, size: 36),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'نظام المتابعة الحيوية المستمرة',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'تسجيل المؤشرات ومقارنتها بالحدود الآمنة لضمان الاستقرار الصحي والتنبيه عند أي اضطراب مفاجئ.',
                              style: TextStyle(fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'سجل القياسات الحيوية الأخيرة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (_readings.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text('لم يتم تسجيل أي قياسات حتى الآن.'),
                ),
              )
            else
              ..._readings.map((reading) {
                final isWarn = reading.isAbnormal;
                final badgeColor = isWarn ? Colors.red : Colors.teal;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                reading.labelAr,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: badgeColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                reading.displayValue,
                                style: TextStyle(
                                  color: badgeColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              isWarn ? Icons.warning_amber_rounded : Icons.check_circle_outline,
                              size: 18,
                              color: badgeColor,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                reading.statusDescriptionAr,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isWarn ? Colors.red.shade800 : Colors.black87,
                                  fontWeight: isWarn ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (reading.notes.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            'ملاحظة: ${reading.notes}',
                            style: const TextStyle(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                        const SizedBox(height: 6),
                        Text(
                          'التاريخ: ${reading.recordedAt.year}-${reading.recordedAt.month.toString().padLeft(2, '0')}-${reading.recordedAt.day.toString().padLeft(2, '0')} الساعة ${reading.recordedAt.hour.toString().padLeft(2, '0')}:${reading.recordedAt.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
