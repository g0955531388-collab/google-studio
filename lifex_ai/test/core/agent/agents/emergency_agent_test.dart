// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: emergency_agent_test.dart
// المسار: test/core/agent/agents/emergency_agent_test.dart
// الوصف: يختبر EmergencyAgent — يجب أن يُبلغ فقط عن ضرورة انتباه فوري
// لمستويات critical/high، ولا يتخذ أي إجراء بذاته (بند 15). يعتمد على
// RiskLevelEngine الحقيقي الموجود فعلاً في المشروع، وليس تكراراً له.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agents/emergency_agent.dart';

void main() {
  late EmergencyAgent agent;

  setUp(() {
    agent = EmergencyAgent();
  });

  group('EmergencyAgent.assess', () {
    test('مؤشر قلبي يتطلب انتباهاً فورياً', () {
      final result = agent.assess({'triggerType': 'cardiac_symptom'});
      expect(result.requiresImmediateHumanAttention, isTrue);
      expect(result.riskLevel, 'critical');
    });

    test('حالة مزمنة مع عمر 60+ تتطلب انتباهاً (عالي)', () {
      final result = agent.assess({
        'hasChronicCondition': true,
        'age': 65,
      });
      expect(result.requiresImmediateHumanAttention, isTrue);
      expect(result.riskLevel, 'high');
    });

    test('سياق فارغ (منخفض الخطورة) لا يتطلب انتباهاً فورياً', () {
      final result = agent.assess({});
      expect(result.requiresImmediateHumanAttention, isFalse);
      expect(result.riskLevel, 'low');
    });

    test('كل تقييم يتضمن سبباً نصياً غير فارغ للشفافية', () {
      final result = agent.assess({'triggerType': 'cardiac_symptom'});
      expect(result.reasonAr, isNotEmpty);
    });
  });
}
