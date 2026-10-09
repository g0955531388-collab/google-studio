/// =============================================================
/// Lifex-AI — واجهات التطبيق
/// الملف: splash_screen.dart
/// المسار: lib/screens/splash_screen.dart
/// الوصف: الشاشة الافتتاحية (Splash) — أول ما يراه المستخدم عند فتح
/// التطبيق. تعرض شعار/اسم التطبيق ونص الإسناد والملكية الرسمي الكامل
/// قبل الانتقال للشاشة الرئيسية.
///
/// ⚠️ هذا النص (AppConstants.ownershipStatement) إلزامي الظهور هنا ولا
/// يجوز حذفه أو اختصاره أو تغييره.
/// =============================================================

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_constants.dart';
import '../features/profile/active_profile_controller.dart';
import 'home_screen.dart';
import 'profile_setup_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, this.displayDuration = const Duration(seconds: 3)});

  /// مدة عرض الشاشة الافتتاحية قبل الانتقال تلقائياً للشاشة التالية.
  final Duration displayDuration;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(widget.displayDuration, () {
      if (!mounted) return;

      // التوجيه الذكي: إذا لم يُنشئ المستخدم أي ملف صحي بعد (أول
      // تشغيل)، يبدأ بشاشة الإعداد الأولي بدلاً من الدخول مباشرة
      // للشاشة الرئيسية بملف وهمي غير موجود فعلياً.
      final controller = Provider.of<ActiveProfileController>(
        context,
        listen: false,
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => controller.hasAnyProfile
              ? const HomeScreen()
              : const ProfileSetupScreen(),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/images/app_icon.png',
                  width: 112,
                  height: 112,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Icon(
                    Icons.health_and_safety_outlined,
                    size: 96,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                AppConstants.appName,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const Spacer(),
              // نص الإسناد والملكية — إلزامي الظهور في هذه الشاشة تحديداً
              // لأنها أول شاشة يراها أي مستخدم عند فتح التطبيق.
              Semantics(
                label: AppConstants.ownershipStatement,
                child: ExcludeSemantics(
                  child: Text(
                    AppConstants.ownershipStatement,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
