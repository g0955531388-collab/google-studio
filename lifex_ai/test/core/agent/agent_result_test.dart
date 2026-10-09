// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_result_test.dart
// المسار: test/core/agent/agent_result_test.dart
// الوصف: يختبر AgentResult — يجب أن يحمل دائماً تنويهاً غير فارغ، وأن
// factories الفشل/الإلغاء تُنتج finalState الصحيح ومستوى ثقة unknown
// (لا يجوز الادعاء بثقة في حالة فشل أو إلغاء — بند 17).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_confidence.dart';
import 'package:lifex_ai/core/agent/agent_result.dart';
import 'package:lifex_ai/core/agent/agent_state.dart';

void main() {
  group('AgentResult.failed', () {
    test('finalState يساوي failed ومستوى الثقة unknown', () {
      final result = AgentResult.failed(taskId: 't1', reasonAr: 'سبب الفشل');
      expect(result.finalState, AgentTaskState.failed);
      expect(result.confidence, AgentConfidence.unknown);
      expect(result.isSuccessful, isFalse);
    });

    test('يحمل التنويه الافتراضي دائماً', () {
      final result = AgentResult.failed(taskId: 't1', reasonAr: 'سبب');
      expect(result.disclaimerAr, kAgentDefaultDisclaimerAr);
    });
  });

  group('AgentResult.cancelled', () {
    test('finalState يساوي cancelled', () {
      final result = AgentResult.cancelled(taskId: 't1');
      expect(result.finalState, AgentTaskState.cancelled);
      expect(result.isSuccessful, isFalse);
    });
  });

  group('AgentResult.isSuccessful', () {
    test('true فقط عندما تكون finalState تساوي completed', () {
      const completedResult = AgentResult(
        taskId: 't1',
        finalState: AgentTaskState.completed,
        summaryAr: 'تم',
        confidence: AgentConfidence.high,
        disclaimerAr: kAgentDefaultDisclaimerAr,
      );
      expect(completedResult.isSuccessful, isTrue);

      const blockedResult = AgentResult(
        taskId: 't1',
        finalState: AgentTaskState.blocked,
        summaryAr: 'محظور',
        confidence: AgentConfidence.unknown,
        disclaimerAr: kAgentDefaultDisclaimerAr,
      );
      expect(blockedResult.isSuccessful, isFalse);
    });
  });
}
