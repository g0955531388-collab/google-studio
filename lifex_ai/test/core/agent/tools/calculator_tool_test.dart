// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: calculator_tool_test.dart
// المسار: test/core/agent/tools/calculator_tool_test.dart
// الوصف: يختبر CalculatorTool — عمليات ثابتة فقط (BMI، تحويل حرارة)،
// ورفض أي عملية غير مدعومة أو قيم غير صالحة (بند 29: لا تنفيذ كود حر).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_context.dart';
import 'package:lifex_ai/core/agent/agent_permissions.dart';
import 'package:lifex_ai/core/agent/tools/calculator_tool.dart';

AgentContext _context() {
  return AgentContext(
    taskId: 't1',
    profileId: 'p1',
    userRequest: 'اختبار',
    permissions: const AgentGrantedPermissions(granted: {}),
  );
}

void main() {
  const tool = CalculatorTool();

  group('CalculatorTool.validate', () {
    test('يرفض عملية غير معروفة', () {
      expect(tool.validate({'operation': 'unknown_op'}), isFalse);
    });

    test('يقبل عملية bmi معروفة', () {
      expect(tool.validate({'operation': 'bmi'}), isTrue);
    });
  });

  group('CalculatorTool.execute — bmi', () {
    test('يحسب BMI بشكل صحيح لقيم معروفة', () async {
      final result = await tool.execute(
        arguments: const {
          'operation': 'bmi',
          'values': {'weightKg': 70, 'heightM': 1.75},
        },
        context: _context(),
      );

      expect(result.isSuccess, isTrue);
      // 70 / (1.75*1.75) ≈ 22.857
      expect(result.data['result'], closeTo(22.857, 0.01));
    });

    test('يرفض طولاً صفرياً بدل قسمة على صفر صامتة', () async {
      final result = await tool.execute(
        arguments: const {
          'operation': 'bmi',
          'values': {'weightKg': 70, 'heightM': 0},
        },
        context: _context(),
      );

      expect(result.isSuccess, isFalse);
    });
  });

  group('CalculatorTool.execute — temperature conversion', () {
    test('يحوّل 0 مئوية إلى 32 فهرنهايت', () async {
      final result = await tool.execute(
        arguments: const {
          'operation': 'celsiusToFahrenheit',
          'values': {'celsius': 0},
        },
        context: _context(),
      );

      expect(result.data['result'], 32.0);
    });

    test('يحوّل 98.6 فهرنهايت إلى ما يقارب 37 مئوية', () async {
      final result = await tool.execute(
        arguments: const {
          'operation': 'fahrenheitToCelsius',
          'values': {'fahrenheit': 98.6},
        },
        context: _context(),
      );

      expect(result.data['result'], closeTo(37.0, 0.1));
    });
  });

  group('CalculatorTool.execute — invalid input', () {
    test('قيم مفقودة تُرجع فشلاً بدل رمي استثناء غير متوقع', () async {
      final result = await tool.execute(
        arguments: const {'operation': 'bmi', 'values': {}},
        context: _context(),
      );

      expect(result.isSuccess, isFalse);
    });
  });
}
