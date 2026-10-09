/// =============================================================
/// Lifex-AI — الهوية الصحية والملفات الشخصية
/// الملف: active_profile_controller.dart
/// المسار: lib/features/profile/active_profile_controller.dart
/// الوصف: يسدّ الفجوة بين MultiProfileEngine (منطق بيانات بلا حالة
/// تفاعلية) والواجهة (تحتاج إعادة بناء تلقائية عند تغيّر الملف النشط).
/// بدونه، كانت كل شاشة تعمل بمعرّف ملف وهمي ثابت بدلاً من الملف الصحي
/// الحقيقي — وهذا الملف يحل الفجوة عبر ChangeNotifier موفَّر مركزياً
/// بـ Provider، بحيث تقرأ كل شاشة الملف النشط الحقيقي دائماً.
/// =============================================================

import 'package:flutter/foundation.dart';

import 'health_profile.dart';
import 'multi_profile_engine.dart';

/// متحكم تفاعلي فوق MultiProfileEngine — يُعلم الواجهة تلقائياً عند أي
/// تغيّر في الملف النشط (إنشاء أول ملف، تبديل بين أفراد العائلة).
class ActiveProfileController extends ChangeNotifier {
  ActiveProfileController({required this.engine});

  final MultiProfileEngine engine;

  /// معرّف الملف الصحي النشط حالياً، أو null إن لم يُنشأ أي ملف بعد
  /// (حالة "أول تشغيل" قبل إكمال شاشة الإعداد الأولي).
  String? get activeProfileId => engine.activeProfileId;

  HealthProfile? get activeProfile => engine.activeProfile;

  bool get hasAnyProfile => engine.activeProfileId != null;

  /// إنشاء أول ملف صحي للمستخدم (يُستدعى من شاشة الإعداد الأولي) —
  /// يسجّله في MultiProfileEngine كصاحب الحساب الرئيسي، ويصبح نشطاً
  /// تلقائياً، ثم يُعلم كل الواجهة المستمعة بالتغيير.
  AddProfileResult createInitialProfile(HealthProfile profile) {
    final result = engine.addProfile(profile, role: ProfileRole.primaryOwner);
    if (result.success) {
      notifyListeners();
    }
    return result;
  }

  /// إضافة فرد عائلة جديد (لا يصبح نشطاً تلقائياً إلا إذا كان أول ملف
  /// يُضاف للحساب بالكامل).
  AddProfileResult addFamilyMember(
    HealthProfile profile, {
    required ProfileRole role,
  }) {
    final result = engine.addProfile(profile, role: role);
    if (result.success) {
      notifyListeners();
    }
    return result;
  }

  /// التبديل الفعلي بين أفراد العائلة من الواجهة — يُعلم كل الشاشات
  /// المفتوحة فوراً بالملف الجديد النشط.
  bool switchTo(String profileId) {
    final success = engine.switchActiveProfile(profileId);
    if (success) {
      notifyListeners();
    }
    return success;
  }
}
