// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: active_profile_controller_test.dart
// المسار: test/features/active_profile_controller_test.dart
// الوصف: اختبار أن ActiveProfileController يُصدر إشعار (notifyListeners)
// فعلياً عند إنشاء أو تبديل الملف النشط — هذا هو أساس عمل Consumer في
// home_screen.dart؛ فشل هذا السلوك يعني أن الواجهة لن تتحدّث أبداً عند
// تغيّر الملف النشط، حتى لو كان المنطق الداخلي في MultiProfileEngine
// صحيحاً.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/features/profile/active_profile_controller.dart';
import 'package:lifex_ai/features/profile/health_profile.dart';
import 'package:lifex_ai/features/profile/multi_profile_engine.dart';

void main() {
  late MultiProfileEngine engine;
  late ActiveProfileController controller;

  setUp(() {
    engine = MultiProfileEngine(maxProfiles: 5);
    controller = ActiveProfileController(engine: engine);
  });

  group('ActiveProfileController', () {
    test('hasAnyProfile يكون false قبل إنشاء أي ملف', () {
      expect(controller.hasAnyProfile, isFalse);
    });

    test('إنشاء أول ملف يُصدر إشعاراً ويحدّث hasAnyProfile', () {
      var notified = false;
      controller.addListener(() => notified = true);

      final profile = HealthProfile(
        profileId: 'p1',
        fullName: 'غازي',
        dateOfBirth: DateTime(1990, 1, 1),
      );

      final result = controller.createInitialProfile(profile);

      expect(result.success, isTrue);
      expect(notified, isTrue);
      expect(controller.hasAnyProfile, isTrue);
      expect(controller.activeProfileId, 'p1');
    });

    test('التبديل الناجح بين الملفات يُصدر إشعاراً', () {
      controller.createInitialProfile(
        HealthProfile(profileId: 'p1', fullName: 'أ', dateOfBirth: DateTime(1990, 1, 1)),
      );
      controller.addFamilyMember(
        HealthProfile(profileId: 'p2', fullName: 'ب', dateOfBirth: DateTime(2010, 1, 1)),
        role: ProfileRole.child,
      );

      var notifyCount = 0;
      controller.addListener(() => notifyCount++);

      final switched = controller.switchTo('p2');

      expect(switched, isTrue);
      expect(notifyCount, 1);
      expect(controller.activeProfileId, 'p2');
    });

    test('التبديل الفاشل لا يُصدر إشعاراً', () {
      controller.createInitialProfile(
        HealthProfile(profileId: 'p1', fullName: 'أ', dateOfBirth: DateTime(1990, 1, 1)),
      );

      var notifyCount = 0;
      controller.addListener(() => notifyCount++);

      final switched = controller.switchTo('nonexistent');

      expect(switched, isFalse);
      expect(notifyCount, 0);
    });
  });
}
