/// =============================================================
/// Lifex-AI — واجهات التطبيق ومساعدة ذوي الاحتياجات الخاصة
/// الملف: accessibility_assistant_screen.dart
/// المسار: lib/screens/accessibility_assistant_screen.dart
/// الوصف: واجهة متكاملة لمساعدة المكفوفين وضعاف البصر وذوي الاحتياجات الخاصة:
/// - دعم التباين العالي (High Contrast) والخط الكبير
/// - اهتزازات لمسية حقيقية (Haptic Feedback) عند كل ضغطة
/// - قراءة صوتية للمعلومات الطبية وبطاقة الطوارئ عبر قارئ الشاشة
/// - اختبار التنبيهات متعددة الحواس (اهتزاز + وميض)
/// - استدعاء أدوات الرؤية المساعدة (وصف المشهد، كشف العوائق، قراءة النصوص)
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../features/accessibility/assistive_vision_engine.dart';
import '../features/profile/active_profile_controller.dart';
import '../widgets/accessible_widgets.dart';

class AccessibilityAssistantScreen extends StatefulWidget {
  const AccessibilityAssistantScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<AccessibilityAssistantScreen> createState() =>
      _AccessibilityAssistantScreenState();
}

class _AccessibilityAssistantScreenState
    extends State<AccessibilityAssistantScreen> {
  bool _isProcessing = false;
  String? _lastResultAr;
  bool _isHighContrast = false;

  Future<void> _runFeature(AssistiveFeatureType type, String labelAr) async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isProcessing = true;
      _lastResultAr = null;
    });

    announceForScreenReader(context, 'جارٍ تشغيل $labelAr، يُرجى توجيه الكاميرا.');

    try {
      final picker = ImagePicker();
      final photo = await picker.pickImage(source: ImageSource.camera);

      if (photo == null) {
        setState(() {
          _isProcessing = false;
          _lastResultAr = 'لم يتم التقاط صورة.';
        });
        announceForScreenReader(context, 'تم إلغاء التقاط الصورة.');
        return;
      }

      final imageBytes = await photo.readAsBytes();
      final engine = Provider.of<AssistiveVisionEngine>(context, listen: false);

      final result = await engine.process(
        imageOrFrameInput: imageBytes,
        type: type,
        context: {'profileId': widget.profileId},
      );

      if (!mounted) return;
      setState(() {
        _isProcessing = false;
        _lastResultAr = result.spokenMessageAr;
      });

      HapticFeedback.heavyImpact();
      announceForScreenReader(context, result.spokenMessageAr);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isProcessing = false;
        _lastResultAr = 'تعذّر تشغيل "$labelAr" حالياً.';
      });
      announceForScreenReader(context, 'تعذّر تشغيل $labelAr حالياً.');
    }
  }

  void _readEmergencyCardSpoken() {
    HapticFeedback.heavyImpact();
    final profileController = Provider.of<ActiveProfileController>(context, listen: false);
    final profile = profileController.getProfileById(widget.profileId);

    if (profile == null) {
      announceForScreenReader(context, 'لا توجد بيانات مسجلة لهذا الملف الصحي.');
      return;
    }

    final allergies = profile.allergies.isEmpty
        ? 'لا توجد حساسية مسجلة'
        : 'الحساسية: ${profile.allergies.map((a) => a.substance).join('، ')}';
    final conditions = profile.chronicConditions.isEmpty
        ? 'لا توجد حالات مزمنة مسجلة'
        : 'الحالات المزمنة: ${profile.chronicConditions.map((c) => c.conditionName).join('، ')}';

    final fullMessage = 'بيانات الطوارئ: المريض ${profile.fullName}، العمر ${profile.ageInYears} سنة، فصيلة الدم ${profile.bloodType.name}، $allergies، $conditions.';

    setState(() {
      _lastResultAr = fullMessage;
    });

    announceForScreenReader(context, fullMessage);
  }

  void _testTactileAlert() {
    HapticFeedback.vibrate();
    Future.delayed(const Duration(milliseconds: 250), () => HapticFeedback.vibrate());
    Future.delayed(const Duration(milliseconds: 500), () => HapticFeedback.vibrate());

    announceForScreenReader(context, 'تم تفعيل نبضات الاهتزاز التجريبية متعددة الحواس.');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تم إرسال نبضات الاهتزاز الحسي للتحقق.'),
        backgroundColor: Colors.indigo,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _isHighContrast ? Colors.black : Theme.of(context).scaffoldBackgroundColor;
    final textColor = _isHighContrast ? Colors.yellowAccent : Colors.black87;
    final cardColor = _isHighContrast ? Colors.grey.shade900 : Colors.white;

    return Theme(
      data: _isHighContrast
          ? ThemeData.dark().copyWith(
              scaffoldBackgroundColor: Colors.black,
              cardColor: Colors.grey.shade900,
            )
          : Theme.of(context),
      child: Scaffold(
        backgroundColor: bgColor,
        appBar: AppBar(
          title: const Text('المساعد البصري وإمكانية الوصول'),
          actions: [
            IconButton(
              icon: Icon(_isHighContrast ? Icons.contrast : Icons.contrast_outlined),
              tooltip: _isHighContrast ? 'إلغاء التباين العالي' : 'تفعيل التباين العالي',
              onPressed: () {
                setState(() {
                  _isHighContrast = !_isHighContrast;
                });
                HapticFeedback.selectionClick();
                announceForScreenReader(
                  context,
                  _isHighContrast ? 'تم تفعيل وضع التباين العالي' : 'تم تفعيل الوضع العادي',
                );
              },
            ),
          ],
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Semantics(
                label: 'تنويه: هذه أداة مساعدة إضافية ولا تغني عن العصا '
                    'البيضاء أو كلب الإرشاد أو الحذر المعتاد، خصوصاً عند '
                    'عبور الطرق.',
                child: ExcludeSemantics(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isHighContrast ? Colors.grey.shade900 : Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: BorderSide(
                        color: _isHighContrast ? Colors.yellowAccent : Colors.orange,
                      ),
                    ),
                    child: Text(
                      '⚠️ أداة مساعدة إضافية للمكفوفين وضعاف البصر — متوافقة مع قارئات الشاشة والاهتزاز الحسي.',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _isHighContrast ? Colors.yellowAccent : Colors.brown.shade800,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // زر قراءة بطاقة الطوارئ صوتياً
              _AccessibleActionCard(
                icon: Icons.record_voice_over_outlined,
                title: 'قراءة بطاقة الطوارئ صوتياً',
                subtitle: 'نطق فصيلة الدم والحساسية والأمراض فوراً لقارئ الشاشة والمسعفين',
                color: Colors.red,
                isHighContrast: _isHighContrast,
                onTap: _readEmergencyCardSpoken,
              ),

              const SizedBox(height: 12),

              // زر فحص الاهتزاز الحسي
              _AccessibleActionCard(
                icon: Icons.vibration_outlined,
                title: 'اختبار الاهتزاز الحسي (Tactile Pulse)',
                subtitle: 'إطلاق نبضات لمسية لمساعدة ضعاف السمع والمكفوفين',
                color: Colors.teal,
                isHighContrast: _isHighContrast,
                onTap: _testTactileAlert,
              ),

              const SizedBox(height: 20),
              Text(
                'أدوات الرؤية وتحليل المحيط',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 12),

              _FeatureButton(
                icon: Icons.remove_red_eye_outlined,
                label: 'صف لي المكان والمحيط',
                isHighContrast: _isHighContrast,
                onTap: _isProcessing
                    ? null
                    : () => _runFeature(
                          AssistiveFeatureType.sceneDescription,
                          'وصف المشهد',
                        ),
              ),
              _FeatureButton(
                icon: Icons.warning_amber_outlined,
                label: 'هل يوجد عائق أو خطر أمامي؟',
                isHighContrast: _isHighContrast,
                onTap: _isProcessing
                    ? null
                    : () => _runFeature(
                          AssistiveFeatureType.obstacleDetection,
                          'كشف العوائق',
                        ),
              ),
              _FeatureButton(
                icon: Icons.text_fields_outlined,
                label: 'اقرأ لي هذا النص المكتوب',
                isHighContrast: _isHighContrast,
                onTap: _isProcessing
                    ? null
                    : () => _runFeature(
                          AssistiveFeatureType.textAndCurrencyReading,
                          'قراءة النص والعملة',
                        ),
              ),
              _FeatureButton(
                icon: Icons.face_outlined,
                label: 'من هذا؟ (التعرّف الشخصي)',
                isHighContrast: _isHighContrast,
                onTap: _isProcessing
                    ? null
                    : () => _runFeature(
                          AssistiveFeatureType.personalizedRecognition,
                          'التعرّف الشخصي',
                        ),
              ),

              const SizedBox(height: 20),
              if (_isProcessing)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: CircularProgressIndicator(
                      color: _isHighContrast ? Colors.yellowAccent : null,
                    ),
                  ),
                )
              else if (_lastResultAr != null)
                Card(
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: _isHighContrast ? Colors.yellowAccent : Colors.teal.shade200,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        _lastResultAr!,
                        style: TextStyle(
                          fontSize: _isHighContrast ? 18 : 16,
                          color: textColor,
                          fontWeight: _isHighContrast ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccessibleActionCard extends StatelessWidget {
  const _AccessibleActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.isHighContrast,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool isHighContrast;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Card(
        elevation: 2,
        color: isHighContrast ? Colors.grey.shade900 : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isHighContrast ? Colors.yellowAccent : color.withOpacity(0.3),
            width: isHighContrast ? 2 : 1,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: isHighContrast ? Colors.yellowAccent : color.withOpacity(0.15),
                  child: Icon(icon, color: isHighContrast ? Colors.black : color),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isHighContrast ? Colors.yellowAccent : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: isHighContrast ? Colors.white70 : Colors.black54,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FeatureButton extends StatelessWidget {
  const _FeatureButton({
    required this.icon,
    required this.label,
    required this.isHighContrast,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isHighContrast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            side: BorderSide(
              color: isHighContrast ? Colors.yellowAccent : Colors.teal.shade300,
              width: isHighContrast ? 2 : 1,
            ),
            foregroundColor: isHighContrast ? Colors.yellowAccent : null,
            backgroundColor: isHighContrast ? Colors.grey.shade900 : null,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          onPressed: onTap,
          icon: Icon(icon, size: 24),
          label: Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isHighContrast ? Colors.yellowAccent : null,
            ),
          ),
        ),
      ),
    );
  }
}
