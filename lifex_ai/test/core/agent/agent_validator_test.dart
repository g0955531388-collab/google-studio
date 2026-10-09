// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_validator_test.dart
// المسار: test/core/agent/agent_validator_test.dart
// الوصف: يتحقق من سلوك AgentValidator الافتراضي: فشل العملية يعني
// إعادة محاولة، ثقة غير معروفة تعني طلب تأكيد من المستخدم، ونجاح
// بثقة معروفة يعني نتيجة صالحة (بند 18).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_confidence.dart';
import 'package:lifex_ai/core/agent/agent_error.dart';
import 'package:lifex_ai/core/agent/agent_observation.dart';
import 'package:lifex_ai/core/agent/agent_validator.dart';

class _AlwaysReplanValidator implements AgentValidatorStrategy {
  @override
  String get dataType => 'custom_type';

  @override
  ValidationResult validate(AgentObservation observation) {
    return const ValidationResult(
      outcome: ValidationOutcome.replan,
      reasonAr: 'اختبار: يتطلب إعادة تخطيط دائماً.',
    );
  }
}

void main() {
  group('AgentValidator (default strategy)', () {
    late AgentValidator validator;

    setUp(() {
      validator = AgentValidator();
    });

    test('عملية فاشلة تُصنَّف كقابلة لإعادة المحاولة', () {
      final observation = AgentObservation.failure(
        actionId: 'a1',
        error: const ToolExecutionFailedError('فشل'),
      );

      final result = validator.validate(observation);
      expect(result.outcome, ValidationOutcome.retry);
    });

    test('عملية ناجحة بثقة unknown تتطلب تأكيد المستخدم', () {
      final observation = AgentObservation.success(
        actionId: 'a1',
        data: const {},
        confidence: AgentConfidence.unknown,
      );

      final result = validator.validate(observation);
      expect(result.outcome, ValidationOutcome.askUser);
    });

    test('عملية ناجحة بثقة معروفة (medium) تُعتبر صالحة', () {
      final observation = AgentObservation.success(
        actionId: 'a1',
        data: const {},
        confidence: AgentConfidence.medium,
      );

      final result = validator.validate(observation);
      expect(result.outcome, ValidationOutcome.valid);
    });

    test('يمكن تسجيل Validator مخصص لنوع بيانات معيّن واستخدامه', () {
      validator.register(_AlwaysReplanValidator());

      final observation = AgentObservation.success(
        actionId: 'a1',
        data: const {'dataType': 'custom_type'},
        confidence: AgentConfidence.high,
      );

      final result = validator.validate(observation);
      expect(result.outcome, ValidationOutcome.replan);
    });
  });
}
