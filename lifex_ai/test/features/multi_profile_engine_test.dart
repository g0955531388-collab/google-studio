// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: multi_profile_engine_test.dart
// المسار: test/features/multi_profile_engine_test.dart
// الوصف: اختبار منطق الملفات الصحية المتعددة — أهم فجوة تم اكتشافها
// وإصلاحها في هذه الجولة (ربط الملف النشط الحقيقي بالواجهة بدل معرّف
// وهمي ثابت)، لذا يستحق تغطية اختبارية مباشرة لضمان عدم الانتكاس مستقبلاً.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/features/profile/health_profile.dart';
import 'package:lifex_ai/features/profile/multi_profile_engine.dart';

void main() {
  late MultiProfileEngine engine;

  HealthProfile buildProfile(String id, String name) => HealthProfile(
        profileId: id,
        fullName: name,
        dateOfBirth: DateTime(1990, 1, 1),
      );

  setUp(() {
    engine = MultiProfileEngine(maxProfiles: 3);
  });

  group('MultiProfileEngine', () {
    test('أول ملف يُضاف يصبح نشطاً تلقائياً', () {
      final result = engine.addProfile(
        buildProfile('p1', 'غازي'),
        role: ProfileRole.primaryOwner,
      );

      expect(result.success, isTrue);
      expect(engine.activeProfileId, 'p1');
    });

    test('إضافة ملف ثانٍ لا تغيّر الملف النشط تلقائياً', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);
      engine.addProfile(buildProfile('p2', 'ابن'), role: ProfileRole.child);

      expect(engine.activeProfileId, 'p1');
    });

    test('التبديل الصريح بين الملفات يعمل بنجاح', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);
      engine.addProfile(buildProfile('p2', 'ابن'), role: ProfileRole.child);

      final switched = engine.switchActiveProfile('p2');

      expect(switched, isTrue);
      expect(engine.activeProfileId, 'p2');
    });

    test('التبديل لملف غير موجود يفشل ولا يغيّر الملف النشط', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);

      final switched = engine.switchActiveProfile('does_not_exist');

      expect(switched, isFalse);
      expect(engine.activeProfileId, 'p1');
    });

    test('لا يمكن تجاوز الحد الأقصى لعدد الملفات', () {
      engine.addProfile(buildProfile('p1', 'أ'), role: ProfileRole.primaryOwner);
      engine.addProfile(buildProfile('p2', 'ب'), role: ProfileRole.child);
      engine.addProfile(buildProfile('p3', 'ج'), role: ProfileRole.child);

      final fourth = engine.addProfile(buildProfile('p4', 'د'), role: ProfileRole.child);

      expect(fourth.success, isFalse);
      expect(engine.remainingSlots, 0);
    });

    test('إزالة الملف النشط تنقل النشاط لملف آخر متبقٍّ تلقائياً', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);
      engine.addProfile(buildProfile('p2', 'ابن'), role: ProfileRole.child);

      final removed = engine.removeProfile('p1');

      expect(removed, isTrue);
      expect(engine.activeProfileId, 'p2');
    });

    test('إزالة ملف غير موجود تعيد false ولا تؤثر على الروابط', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);

      final removed = engine.removeProfile('non_existent');

      expect(removed, isFalse);
      expect(engine.links.length, 1);
      expect(engine.activeProfileId, 'p1');
    });

    test('إزالة آخر ملف متبقٍّ تجعل الملف النشط null وتزيد عدد المقاعد الشاغرة', () {
      engine.addProfile(buildProfile('p1', 'غازي'), role: ProfileRole.primaryOwner);
      expect(engine.remainingSlots, 2);

      final removed = engine.removeProfile('p1');

      expect(removed, isTrue);
      expect(engine.activeProfileId, isNull);
      expect(engine.activeProfile, isNull);
      expect(engine.links.isEmpty, isTrue);
      expect(engine.remainingSlots, 3);
    });

    test('لا يوجد ملف نشط قبل إضافة أي ملف', () {
      expect(engine.activeProfileId, isNull);
      expect(engine.activeProfile, isNull);
    });
  });
}
