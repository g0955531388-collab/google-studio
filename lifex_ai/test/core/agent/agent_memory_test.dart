// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_memory_test.dart
// المسار: test/core/agent/agent_memory_test.dart
// الوصف: يختبر AgentMemory (الواجهة الموحدة) — إفراج الذاكرة قصيرة
// الأمد عند انتهاء المهمة (بند 33)، وسياسة الذاكرة طويلة الأمد
// الافتراضية الآمنة (رفض الحفظ ما لم تُفعَّل صراحة — بند 10).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_memory.dart';
import 'package:lifex_ai/core/agent/memory/long_term_memory.dart';

void main() {
  group('AgentMemory.shortTermFor / releaseShortTermFor', () {
    test('shortTermFor يُعيد نفس الكائن لنفس taskId', () {
      final memory = AgentMemory();
      final a = memory.shortTermFor('task1');
      final b = memory.shortTermFor('task1');
      expect(identical(a, b), isTrue);
    });

    test('releaseShortTermFor يمسح البيانات ويُنشئ كائناً جديداً لاحقاً',
        () {
      final memory = AgentMemory();
      final first = memory.shortTermFor('task1');
      first.setTemp('key', 'value');

      memory.releaseShortTermFor('task1');

      final second = memory.shortTermFor('task1');
      expect(identical(first, second), isFalse);
      expect(second.getTemp<String>('key'), isNull);
    });
  });

  group('AgentMemory long-term policy (deny-by-default)', () {
    test('الذاكرة طويلة الأمد معطّلة افتراضياً — remember يفشل بصمت', () async {
      final memory = AgentMemory(); // بلا سياسة = LongTermMemoryPolicy.disabled
      final saved = await memory.longTerm.remember(
        profileId: 'p1',
        category: 'preferences',
        key: 'k1',
        value: {'x': 1},
      );
      expect(saved, isFalse);
    });

    test('تفعيل سياسة تسمح بفئة معينة يجعل remember/recall يعملان', () async {
      final memory = AgentMemory(
        longTermPolicy: const LongTermMemoryPolicy(
          enabled: true,
          allowedCategories: {'preferences'},
        ),
      );

      final saved = await memory.longTerm.remember(
        profileId: 'p1',
        category: 'preferences',
        key: 'k1',
        value: {'x': 1},
      );
      expect(saved, isTrue);

      final recalled = await memory.longTerm.recall(
        profileId: 'p1',
        category: 'preferences',
        key: 'k1',
      );
      expect(recalled, {'x': 1});
    });

    test('فئة غير مصرَّح بها تُرفض حتى مع تفعيل السياسة عموماً', () async {
      final memory = AgentMemory(
        longTermPolicy: const LongTermMemoryPolicy(
          enabled: true,
          allowedCategories: {'preferences'}, // 'medical_history' غير مدرجة
        ),
      );

      final saved = await memory.longTerm.remember(
        profileId: 'p1',
        category: 'medical_history',
        key: 'k1',
        value: {'x': 1},
      );
      expect(saved, isFalse);
    });
  });

  group('ConversationMemory', () {
    test('recentTextsFor يُرجع فقط آخر N رسالة', () {
      final memory = AgentMemory();
      for (var i = 0; i < 10; i++) {
        memory.conversation.addTurn('p1', 'user', 'رسالة $i');
      }

      final recent = memory.conversation.recentTextsFor('p1', limit: 3);
      expect(recent.length, 3);
      expect(recent.last, contains('رسالة 9'));
    });
  });
}
