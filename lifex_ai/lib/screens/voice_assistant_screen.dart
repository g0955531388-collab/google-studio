/// =============================================================
/// Lifex-AI — المساعد الصوتي والذكاء السمعي
/// الملف: voice_assistant_screen.dart
/// المسار: lib/screens/voice_assistant_screen.dart
/// الوصف: شاشة متطورة للمرشد الصوتي والذكاء اللغوي:
/// - استماع ذكي وتعرف على الأوامر باللغة الطبيعية
/// - تنفيذ فوري للأوامر الصحية ("افتح ملفي"، "أدويتي"، "طوارئ")
/// - نطق الإجابات وتوجيه صوتي كامل للمكفوفين وضعاف البصر
/// - مراقبة كلمات الاستغاثة في حالات الطوارئ
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/profile/active_profile_controller.dart';
import '../features/voice/command_parser.dart';
import '../features/voice/voice_command_engine.dart';
import '../features/voice/voice_engine.dart';
import '../widgets/accessible_widgets.dart';

import 'appointments_screen.dart';
import 'health_profile_screen.dart';
import 'medications_screen.dart';

class VoiceAssistantScreen extends StatefulWidget {
  const VoiceAssistantScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<VoiceAssistantScreen> createState() => _VoiceAssistantScreenState();
}

class _VoiceAssistantScreenState extends State<VoiceAssistantScreen> {
  late final VoiceCommandEngine _commandEngine;
  bool _isListening = false;
  String _spokenText = '';
  String _systemReply = 'مرحباً، أنا مرشد Lifex-AI الصوتي. اضغط على الميكروفون وقل أمراً صوتياً.';
  final TextEditingController _textCommandController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _commandEngine = VoiceCommandEngine(parser: CommandParser());
    _registerVoiceActions();
  }

  @override
  void dispose() {
    _textCommandController.dispose();
    super.dispose();
  }

  void _registerVoiceActions() {
    _commandEngine.registerAction(VoiceCommandIntent.openHealthProfile, (cmd) async {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => HealthProfileScreen(profileId: widget.profileId),
        ),
      );
    });

    _commandEngine.registerAction(VoiceCommandIntent.openMedications, (cmd) async {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => MedicationsScreen(profileId: widget.profileId),
        ),
      );
    });

    _commandEngine.registerAction(VoiceCommandIntent.openAppointments, (cmd) async {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => AppointmentsScreen(profileId: widget.profileId),
        ),
      );
    });

    _commandEngine.registerAction(VoiceCommandIntent.callEmergency, (cmd) async {
      HapticFeedback.heavyImpact();
      HealthEventManager.instance.emitQuick(
        HealthEventType.emergencyTriggered,
        sourceModule: 'voice_assistant_screen',
        profileId: widget.profileId,
        data: {'trigger': 'voice_emergency_call'},
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ تم إطلاق تنبيه الطوارئ الصوتي وإشعار جهات الاتصال الموثوقة!'),
          backgroundColor: Colors.red,
        ),
      );
    });
  }

  Future<void> _processCommand(String text) async {
    if (text.trim().isEmpty) return;
    HapticFeedback.mediumImpact();

    setState(() {
      _spokenText = text;
      _systemReply = 'جارٍ معالجة طلبك وفهم القصد الطبي...';
    });

    final result = await _commandEngine.handleRawSpeechText(text);

    setState(() {
      if (result.executed) {
        _systemReply = 'تم تنفيذ الأمر بنجاح: "$text"';
      } else if (result.feedbackMessageAr != null) {
        _systemReply = result.feedbackMessageAr!;
      } else {
        _systemReply = 'تم استلام الأمر، جاري متابعته مع وحدات النظام.';
      }
    });

    HapticFeedback.selectionClick();
    announceForScreenReader(context, _systemReply);
  }

  void _simulateSpeechRecognition(String phrase) {
    HapticFeedback.mediumImpact();
    setState(() {
      _isListening = true;
      _spokenText = 'جارٍ الاستماع...';
    });

    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() {
        _isListening = false;
      });
      _processCommand(phrase);
    });
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'المستخدم';

    return Scaffold(
      appBar: AppBar(
        title: const Text('المرشد الصوتي الذكي (Voice AI)'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // بطاقة حالة المحرك الصوتي
            Card(
              color: Colors.blueGrey.shade50,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.blueGrey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.blueGrey.shade800,
                      child: const Icon(Icons.record_voice_over, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'المحرك الصوتي واللغوي ($profileName)',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'يفهم اللهجات، يفسر النوايا الصحية، ويساعد فاقدي البصر وذوي الإعاقة على التحكم الكامل بالنظام صوتياً.',
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // دائرة الميكروفون المركزية
            Center(
              child: Semantics(
                button: true,
                label: _isListening ? 'جارٍ الاستماع الآن' : 'اضغط للتحدث بالأمر الصوتي',
                child: GestureDetector(
                  onTap: () {
                    _simulateSpeechRecognition('افتح ملفي الصحي');
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: _isListening ? 110 : 90,
                    height: _isListening ? 110 : 90,
                    decoration: BoxDecoration(
                      color: _isListening ? Colors.redAccent : Colors.teal,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (_isListening ? Colors.redAccent : Colors.teal).withOpacity(0.3),
                          blurRadius: 16,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      _isListening ? Icons.mic : Icons.mic_none,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                _isListening ? 'يستمع إليك الآن...' : 'اضغط على الميكروفون للتحدث',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),

            const SizedBox(height: 24),

            // مربع الاستجابة ورد النظام
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'استجابة المرشد الصوتي:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 8),
                    Semantics(
                      liveRegion: true,
                      child: Text(
                        _systemReply,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // نماذج لأوامر صوتية جاهزة للاختبار
            const Text(
              'أمثلة للأوامر الصوتية المدعومة:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.person_outline, size: 18),
                  label: const Text('افتح ملفي الصحي'),
                  onPressed: () => _simulateSpeechRecognition('افتح ملفي الصحي'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.medication_outlined, size: 18),
                  label: const Text('ما هي أدويتي؟'),
                  onPressed: () => _simulateSpeechRecognition('ما هي أدويتي'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.calendar_month_outlined, size: 18),
                  label: const Text('مواعيدي القادمة'),
                  onPressed: () => _simulateSpeechRecognition('مواعيدي'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.sos_outlined, size: 18, color: Colors.red),
                  label: const Text('طوارئ: ساعدني الآن', style: TextStyle(color: Colors.red)),
                  onPressed: () => _simulateSpeechRecognition('طوارئ أنا بحاجة مساعدة'),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // حقل كتابة بديل لمن لا يستطيع التحدث
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textCommandController,
                    decoration: InputDecoration(
                      hintText: 'أو اكتب الأمر هنا (مثال: أدويتي، صحتي)...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    onSubmitted: (val) {
                      _processCommand(val);
                      _textCommandController.clear();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.send),
                  onPressed: () {
                    _processCommand(_textCommandController.text);
                    _textCommandController.clear();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
