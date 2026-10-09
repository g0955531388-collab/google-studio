// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: report_agent_test.dart
// المسار: test/core/agent/agents/report_agent_test.dart
// الوصف: يختبر ReportAgent.buildDisplayTextAr — يجب أن يتضمن دائماً
// مستوى الثقة والتنويه الإلزامي (بند 38)، ويعرض المصادر عند توفرها.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_result.dart';
import 'package:lifex_ai/core/agent/agents/report_agent.dart';

void main() {
  const agent = ReportAgent();

  test('النص المبني يتضمن التنويه الإلزامي دائماً', () {
    final text = agent.buildDisplayTextAr(const {
      'sections': [
        {'titleAr': 'نتيجة', 'contentAr': 'محتوى'}
      ],
      'sourceFiles': <String>[],
      'confidence': 'medium',
      'reportKindAr': 'تحليل مساعد وليس قراراً سريرياً',
    });

    expect(text, contains(kAgentDefaultDisclaimerAr));
  });

  test('يعرض مستوى الثقة بالعربية بشكل صحيح', () {
    final text = agent.buildDisplayTextAr(const {
      'sections': <Map<String, dynamic>>[],
      'sourceFiles': <String>[],
      'confidence': 'low',
      'reportKindAr': 'تحليل مساعد',
    });

    expect(text, contains('منخفضة'));
  });

  test('يعرض المصادر عند توفرها', () {
    final text = agent.buildDisplayTextAr(const {
      'sections': <Map<String, dynamic>>[],
      'sourceFiles': ['diseases_database.json', 'symptoms_database.json'],
      'confidence': 'high',
      'reportKindAr': 'تحليل مساعد',
    });

    expect(text, contains('diseases_database.json'));
    expect(text, contains('symptoms_database.json'));
  });

  test('لا يعرض سطر مصادر عند عدم توفر أي مصدر', () {
    final text = agent.buildDisplayTextAr(const {
      'sections': <Map<String, dynamic>>[],
      'sourceFiles': <String>[],
      'confidence': 'unknown',
      'reportKindAr': 'تحليل مساعد',
    });

    expect(text, isNot(contains('المصادر:')));
  });
}
