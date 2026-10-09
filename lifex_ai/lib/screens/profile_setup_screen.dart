/// =============================================================
/// Lifex-AI — واجهات التطبيق
/// الملف: profile_setup_screen.dart
/// المسار: lib/screens/profile_setup_screen.dart
/// الوصف: شاشة الإعداد الأولي — أول شيء يراه المستخدم بعد الشاشة
/// الافتتاحية إذا لم يكن لديه أي ملف صحي بعد. تنشئ الملف الأول فعلياً
/// عبر ActiveProfileController، بدلاً من ترك التطبيق يعمل بمعرّف وهمي
/// ثابت كما كان الحال قبل إضافة هذه الشاشة.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/profile/active_profile_controller.dart';
import '../features/profile/health_profile.dart';
import 'home_screen.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  DateTime? _dateOfBirth;
  BiologicalSex _sex = BiologicalSex.unspecified;
  String? _errorMessageAr;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 30),
      firstDate: DateTime(now.year - 120),
      lastDate: now,
    );
    if (picked != null) {
      setState(() => _dateOfBirth = picked);
    }
  }

  void _submit() {
    setState(() => _errorMessageAr = null);

    if (!_formKey.currentState!.validate()) return;
    if (_dateOfBirth == null) {
      setState(() => _errorMessageAr = 'يُرجى تحديد تاريخ الميلاد.');
      return;
    }

    final controller = Provider.of<ActiveProfileController>(
      context,
      listen: false,
    );

    final profile = HealthProfile(
      // معرّف بسيط ومحلي كافٍ لهذه المرحلة؛ يُستبدل لاحقاً بمعرّف صادر
      // من خادم Lifex-AI الخلفي عند ربط الحساب بمصادقة حقيقية.
      profileId: 'local-${DateTime.now().millisecondsSinceEpoch}',
      fullName: _nameController.text.trim(),
      dateOfBirth: _dateOfBirth!,
      biologicalSex: _sex,
    );

    final result = controller.createInitialProfile(profile);

    if (!result.success) {
      setState(() {
        _errorMessageAr = result.errorMessage ?? 'تعذّر إنشاء الملف الصحي.';
      });
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('إنشاء ملفك الصحي')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'مرحباً بك في Lifex-AI. لنبدأ بإنشاء ملفك الصحي '
                  'الأساسي — يمكنك إضافة أفراد عائلتك لاحقاً من '
                  'الإعدادات.',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'الاسم الكامل',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'يُرجى إدخال الاسم.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: _pickDateOfBirth,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'تاريخ الميلاد',
                      border: OutlineInputBorder(),
                    ),
                    child: Text(
                      _dateOfBirth == null
                          ? 'اضغط لاختيار التاريخ'
                          : '${_dateOfBirth!.year}/${_dateOfBirth!.month}/${_dateOfBirth!.day}',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<BiologicalSex>(
                  value: _sex,
                  decoration: const InputDecoration(
                    labelText: 'الجنس البيولوجي (لأغراض طبية بحتة)',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: BiologicalSex.unspecified,
                      child: Text('تفضّل عدم التحديد'),
                    ),
                    DropdownMenuItem(
                      value: BiologicalSex.male,
                      child: Text('ذكر'),
                    ),
                    DropdownMenuItem(
                      value: BiologicalSex.female,
                      child: Text('أنثى'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _sex = value);
                  },
                ),
                if (_errorMessageAr != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _errorMessageAr!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submit,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Text('إنشاء الملف والمتابعة'),
                    ),
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
