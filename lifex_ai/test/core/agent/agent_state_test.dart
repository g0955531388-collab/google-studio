// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_state_test.dart
// المسار: test/core/agent/agent_state_test.dart
// الوصف: يتحقق من أن آلة حالة الوكيل تمنع أي انتقال غير منطقي (مثل
// القفز من "planning" مباشرة إلى "completed" دون تنفيذ أو تحقق)،
// وهو ما يحمي من تخطي خطوات السلامة بالخطأ.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_state.dart';

void main() {
  group('AgentTaskState transitions', () {
    test('المسار السعيد الكامل مسموح به خطوة بخطوة', () {
      expect(isValidAgentTransition(
          AgentTaskState.idle, AgentTaskState.understanding), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.understanding, AgentTaskState.planning), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.planning, AgentTaskState.executing), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.executing, AgentTaskState.observing), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.observing, AgentTaskState.validating), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.validating, AgentTaskState.completed), isTrue);
    });

    test('لا يجوز القفز من planning إلى completed مباشرة', () {
      expect(isValidAgentTransition(
          AgentTaskState.planning, AgentTaskState.completed), isFalse);
    });

    test('لا يجوز القفز من idle إلى executing مباشرة', () {
      expect(isValidAgentTransition(
          AgentTaskState.idle, AgentTaskState.executing), isFalse);
    });

    test('لا يوجد انتقال خارج الحالات النهائية (completed/failed/cancelled)',
        () {
      for (final terminal in [
        AgentTaskState.completed,
        AgentTaskState.failed,
        AgentTaskState.cancelled,
      ]) {
        for (final other in AgentTaskState.values) {
          if (other == terminal) continue;
          expect(isValidAgentTransition(terminal, other), isFalse,
              reason: '$terminal لا يجب أن ينتقل إلى $other');
        }
      }
    });

    test('validating يمكن أن يعود إلى executing لخطوة تالية في الخطة', () {
      expect(isValidAgentTransition(
          AgentTaskState.validating, AgentTaskState.executing), isTrue);
    });

    test('isTerminalAgentState صحيح لكل الحالات النهائية وغير النهائية', () {
      expect(isTerminalAgentState(AgentTaskState.completed), isTrue);
      expect(isTerminalAgentState(AgentTaskState.failed), isTrue);
      expect(isTerminalAgentState(AgentTaskState.cancelled), isTrue);
      expect(isTerminalAgentState(AgentTaskState.executing), isFalse);
      expect(isTerminalAgentState(AgentTaskState.idle), isFalse);
    });

    test('waitingForUser يمكن أن يعود لـ planning أو executing', () {
      expect(isValidAgentTransition(
          AgentTaskState.waitingForUser, AgentTaskState.planning), isTrue);
      expect(isValidAgentTransition(
          AgentTaskState.waitingForUser, AgentTaskState.executing), isTrue);
    });
  });
}
