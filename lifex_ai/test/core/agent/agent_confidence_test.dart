// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_confidence_test.dart
// المسار: test/core/agent/agent_confidence_test.dart
// الوصف: يتحقق من أن دمج مستويات الثقة يختار دائماً الأضعف (بند 17:
// لا يجوز تحويل ثقة منخفضة إلى نتيجة قطعية عبر "تبييضها" بنتيجة أخرى
// عالية الثقة).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_confidence.dart';

void main() {
  group('AgentConfidence.combineWith', () {
    test('دمج high مع low يُنتج low (الأضعف يفوز)', () {
      expect(AgentConfidence.high.combineWith(AgentConfidence.low),
          AgentConfidence.low);
    });

    test('دمج high مع high يُنتج high', () {
      expect(AgentConfidence.high.combineWith(AgentConfidence.high),
          AgentConfidence.high);
    });

    test('دمج medium مع unknown يُنتج unknown', () {
      expect(AgentConfidence.medium.combineWith(AgentConfidence.unknown),
          AgentConfidence.unknown);
    });

    test('الدمج متماثل (commutative)', () {
      expect(
        AgentConfidence.high.combineWith(AgentConfidence.low),
        AgentConfidence.low.combineWith(AgentConfidence.high),
      );
    });
  });

  group('AgentConfidence.requiresHedgedLanguage', () {
    test('low و unknown يتطلبان صياغة محوّطة', () {
      expect(AgentConfidence.low.requiresHedgedLanguage, isTrue);
      expect(AgentConfidence.unknown.requiresHedgedLanguage, isTrue);
    });

    test('high و medium لا يتطلبان صياغة محوّطة', () {
      expect(AgentConfidence.high.requiresHedgedLanguage, isFalse);
      expect(AgentConfidence.medium.requiresHedgedLanguage, isFalse);
    });
  });
}
