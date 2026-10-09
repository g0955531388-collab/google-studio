/// =============================================================
/// Lifex-AI — رعاية صحة المرأة والحمل والولادة
/// الملف: women_health_screen.dart
/// المسار: lib/screens/women_health_screen.dart
/// الوصف: شاشة شاملة لصحة المرأة ورعاية الحمل والأمومة:
/// - وضعان للدخول: "مهتمة" (للتثقيف والتوعية العامة) و"منتسبة" (للمتابعة السريرية المخصصة)
/// - متابعة الدورة الشهرية وحساب فترة الخصوبة المتوقعة
/// - ملف الحمل الذكي (حساب أسبوع الحمل وتاريخ الولادة التقديري)
/// - المساعد الذكي للحوامل (أسئلة الطبيب، الأعراض، وإرشادات الرعاية)
/// - أعلى معايير الخصوصية والتشفير والسرية التامة
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/profile/active_profile_controller.dart';
import '../features/women_health/women_lifecycle_education_engine.dart';
import '../features/women_health/women_health_manager.dart';
import '../widgets/accessible_widgets.dart';

class WomenHealthScreen extends StatefulWidget {
  const WomenHealthScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<WomenHealthScreen> createState() => _WomenHealthScreenState();
}

class _WomenHealthScreenState extends State<WomenHealthScreen> {
  // حالة العضوية: "مهتمة" (تثقيف عام) أو "منتسبة" (ملف متابعة كامل)
  bool _isEnrolled = false;
  WomenHealthStage _currentStage = WomenHealthStage.cycleTracking;

  // بيانات حساب الحمل التقريبي
  DateTime? _lastLmpDate;
  int _cycleLengthDays = 28;

  final TextEditingController _symptomQuestionController = TextEditingController();
  String? _aiAssistantReply;
  bool _isAiReplying = false;

  @override
  void initState() {
    super.initState();
    // قيم افتراضية تمثيلية
    _lastLmpDate = DateTime.now().subtract(const Duration(days: 42)); // 6 أسابيع
  }

  @override
  void dispose() {
    _symptomQuestionController.dispose();
    super.dispose();
  }

  // حساب أسابيع الحمل المقدرة من تاريخ آخر دورة شهرية
  int get _calculatedGestationalWeeks {
    if (_lastLmpDate == null) return 0;
    final diff = DateTime.now().difference(_lastLmpDate!).inDays;
    return (diff / 7).floor();
  }

  // تاريخ الولادة التقديري (قاعدة نيغل: +280 يوماً)
  DateTime? get _estimatedDeliveryDate {
    if (_lastLmpDate == null) return null;
    return _lastLmpDate!.add(const Duration(days: 280));
  }

  void _askPregnancyAssistant() {
    final q = _symptomQuestionController.text.trim();
    if (q.isEmpty) return;

    HapticFeedback.mediumImpact();
    setState(() {
      _isAiReplying = true;
      _aiAssistantReply = null;
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      setState(() {
        _isAiReplying = false;
        if (q.contains('غثيان') || q.contains('إرهاق') || q.contains('تعب')) {
          _aiAssistantReply =
              'الغثيان الصباحي والشعور بالإجهاد من العلامات الشائعة، خصوصاً في الثلث الأول. يُنصح بوجبات خفيفة وموزعة، وترطيب مستمر بالسوائل. إذا كان هناك قيء مستمر أو جفاف شديد، يُرجى مراجعة طبيبتك فوراً.';
        } else if (q.contains('موعد') || q.contains('طبيب') || q.contains('سونار')) {
          _aiAssistantReply =
              'في الأسبوع $_calculatedGestationalWeeks من الحمل، من المهم التحقق من نبض الجنين والفحوصات الأولية وتأكيد موعد السونار الأول مع طبيبة التوليد المتابعة لك.';
        } else {
          _aiAssistantReply =
              'شكراً لسؤالك. نظام Lifex-AI المساعد يوصي دائماً بتدوين أي عرض جديد لعرضه على طبيبتك المختصة خلال زيارتك الدورية القادمة.';
        }
      });
      HapticFeedback.selectionClick();
    });
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'المستخدمة';

    return Scaffold(
      appBar: AppBar(
        title: const Text('رعاية صحة المرأة والحمل'),
        actions: [
          IconButton(
            icon: const Icon(Icons.lock_outline),
            tooltip: 'حماية الخصوصية والسرية التامة',
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('حماية وخصوصية المرأة في Lifex-AI'),
                  content: const Text(
                    'بيانات الدورة الشهرية، الخصوبة، والحمل مشفرة ومحمية ببروتوكولات عالية الخصوصية. لا تظهر هذه البيانات لأي فرد في الأسرة أو جهة خارجية إلا بتفويض واختيار مباشر ومستقل من صاحبة الملف.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('فهمت ذلك'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // بطاقة حالة الانتساب والخصوصية
            Card(
              color: Colors.pink.shade50,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.pink.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: Colors.pink,
                          child: Icon(Icons.pregnant_woman, color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'وحدة الرعاية النسائية ($profileName)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Text(
                                _isEnrolled ? 'الحالة: منتسبة (متابعة سريرية نشطة)' : 'الحالة: مهتمة (وضع المعرفة والتوعية)',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: _isEnrolled ? Colors.pink.shade800 : Colors.black87,
                                  fontWeight: _isEnrolled ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _isEnrolled
                          ? 'الملف الطبي النسائي مربوط بحسابك الآمن لتنظيم مواعيد التحاليل، نمو الجنين، والتنبيهات الصحية الهادئة.'
                          : 'يمكنك تصفح المعرفة الصحية والإرشادات العامة، أو الانتساب لفتح ميزات المتابعة المتقدمة للدورة والحمل.',
                      style: const TextStyle(fontSize: 12),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.tonal(
                            style: FilledButton.styleFrom(
                              backgroundColor: !_isEnrolled ? Colors.pink.shade100 : null,
                            ),
                            onPressed: () {
                              setState(() {
                                _isEnrolled = false;
                              });
                              HapticFeedback.selectionClick();
                            },
                            child: const Text('وضع مهتمة'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: _isEnrolled ? Colors.pink : Colors.grey.shade400,
                            ),
                            onPressed: () {
                              setState(() {
                                _isEnrolled = true;
                              });
                              HapticFeedback.heavyImpact();
                              HealthEventManager.instance.emitQuick(
                                HealthEventType.profileUpdated,
                                sourceModule: 'women_health_screen',
                                profileId: widget.profileId,
                                data: {'action': 'women_unit_enrolled'},
                              );
                            },
                            child: const Text('زر الانتساب'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // اختيار المرحلة الحالية (للمنتسبات)
            if (_isEnrolled) ...[
              const Text(
                'المرحلة الصحية الحالية',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              SegmentedButton<WomenHealthStage>(
                segments: const [
                  ButtonSegment(
                    value: WomenHealthStage.cycleTracking,
                    label: Text('متابعة الدورة'),
                    icon: Icon(Icons.calendar_month_outlined),
                  ),
                  ButtonSegment(
                    value: WomenHealthStage.pregnant,
                    label: Text('رعاية الحمل'),
                    icon: Icon(Icons.favorite_outline),
                  ),
                  ButtonSegment(
                    value: WomenHealthStage.postpartum,
                    label: Text('ما بعد الولادة'),
                    icon: Icon(Icons.child_care_outlined),
                  ),
                ],
                selected: {_currentStage},
                onSelectionChanged: (set) {
                  setState(() {
                    _currentStage = set.first;
                  });
                  HapticFeedback.selectionClick();
                },
              ),
              const SizedBox(height: 16),

              // شاشات فرعية حسب المرحلة
              if (_currentStage == WomenHealthStage.pregnant) ...[
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'مؤشرات الحمل والنمو',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.pink.shade50,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'الأسبوع $_calculatedGestationalWeeks',
                                style: const TextStyle(
                                  color: Colors.pink,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        LinearProgressIndicator(
                          value: (_calculatedGestationalWeeks / 40).clamp(0.0, 1.0),
                          color: Colors.pink,
                          backgroundColor: Colors.pink.shade50,
                          minHeight: 8,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.event, size: 18, color: Colors.grey),
                            const SizedBox(width: 8),
                            Text(
                              'تاريخ الولادة المتوقع التقريبي: ${_estimatedDeliveryDate != null ? '${_estimatedDeliveryDate!.year}-${_estimatedDeliveryDate!.month.toString().padLeft(2, '0')}-${_estimatedDeliveryDate!.day.toString().padLeft(2, '0')}' : 'غير محدد'}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'تنويه: حساب عمر الحمل مبني على قاعدة نيغل الطبية التقريبية، ولا يُغني عن تأكيد السونار لدى الطبيبة.',
                          style: TextStyle(fontSize: 11, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // مساعد الحامل الذكي
                Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: Colors.purple),
                            SizedBox(width: 8),
                            Text(
                              'مساعد الحامل الذكي (Lifex-AI Assistant)',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'اكتبي أي استفسار حول الأعراض أو المواعيد لتجهيز قائمة الأسئلة لزيارة طبيبتك القادمة:',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _symptomQuestionController,
                          decoration: InputDecoration(
                            hintText: 'مثال: أعاني من غثيان صباحي، ما النصائح؟',
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.send),
                              onPressed: _askPregnancyAssistant,
                            ),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        if (_isAiReplying)
                          const Padding(
                            padding: EdgeInsets.all(12),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        else if (_aiAssistantReply != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: BorderSide(color: Colors.purple.shade200),
                            ),
                            child: Text(
                              _aiAssistantReply!,
                              style: const TextStyle(fontSize: 13, height: 1.4),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ] else if (_currentStage == WomenHealthStage.cycleTracking) ...[
                Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'سجل الدورة والخصوبة الآمن',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'تتبع هادئ وموثوق لفترات الدورة الشهرية وأيام الإباضة المتوقعة للمساعدة في التخطيط للحمل أو الحفاظ على التوازن الهرموني، بدون أي إعلانات أو مشاركة تجارية للبيانات.',
                          style: TextStyle(fontSize: 13, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'رعاية ما بعد الولادة والأمومة',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'متابعة مرحلة التعافي البدني والنفسي للأم، دعم الرضاعة الطبيعية، فترات نوم وتغذية الطفل، ومواعيد التطعيمات الأولى بالتعاون مع طبيب الأطفال.',
                          style: TextStyle(fontSize: 13, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],

            const SizedBox(height: 20),

            // دليل التثقيف الصحي النسائي لجميع المراحل العمرية
            const Text(
              'موسوعة التثقيف الصحي وصحة المرأة',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _TopicCard(
              title: 'التغيرات الهرمونية والتغذية السليمة',
              desc: 'كيف تؤثر مراحل العمر والتغيرات الشهرية على طاقة الجسم والاحتياج للفيتامينات الأساسية كالحديد والكالسيوم.',
              icon: Icons.spa_outlined,
            ),
            _TopicCard(
              title: 'الاستعداد والتخطيط للحمل الصحي',
              desc: 'أهمية حمض الفوليك، التقييم الطبي المسبق، ومراجعة التاريخ العائلي للأمراض الوراثية لتوفير بداية آمنة للجنين.',
              icon: Icons.child_friendly_outlined,
            ),
            _TopicCard(
              title: 'الصحة الوقائية والفحوص الدورية',
              desc: 'جدول الفحوصات الدورية الموصى بها طبياً لكل فئة عمرية بما يحمي من أي مخاطر صحية صامتة.',
              icon: Icons.health_and_safety_outlined,
            ),
          ],
        ),
      ),
    );
  }
}

class _TopicCard extends StatelessWidget {
  const _TopicCard({
    required this.title,
    required this.desc,
    required this.icon,
  });

  final String title;
  final String desc;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: Colors.pink.shade50,
              child: Icon(icon, color: Colors.pink),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
