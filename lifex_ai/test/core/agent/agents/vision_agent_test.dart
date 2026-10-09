// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: vision_agent_test.dart
// المسار: test/core/agent/agents/vision_agent_test.dart
// الوصف: يختبر VisionAgent.interpret — تحويل مخرجات أدوات الرؤية إلى
// قرار "هل يُحوَّل هذا للوكيل الطبي أم لا"، مع سياسة حذر افتراضية
// (fail-safe): أي نص مستخرج غير فارغ يُعتبر مرشحاً للتحويل.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_confidence.dart';
import 'package:lifex_ai/core/agent/agents/vision_agent.dart';

void main() {
  const agent = VisionAgent();

  test('نص مستخرج غير فارغ من document_ocr يُحوَّل للوكيل الطبي', () {
    final result = agent.interpret(const {
      'dataType': 'document_ocr',
      'extractedText': 'نتيجة تحليل دم: سكر 110',
      'confidence': 'high',
    });

    expect(result.shouldForwardToMedicalAgent, isTrue);
    expect(result.confidence, AgentConfidence.high);
  });

  test('نص فارغ لا يُحوَّل للوكيل الطبي (لا فائدة من تحليل فارغ)', () {
    final result = agent.interpret(const {
      'dataType': 'document_ocr',
      'extractedText': '',
      'confidence': 'unknown',
    });

    expect(result.shouldForwardToMedicalAgent, isFalse);
  });

  test('يقرأ summaryAr من image_analysis كنص بديل عند غياب extractedText',
      () {
    final result = agent.interpret(const {
      'dataType': 'image_analysis',
      'summaryAr': 'صورة تُظهر طفحاً جلدياً بسيطاً',
      'confidence': 'medium',
    });

    expect(result.extractedTextForNextStep,
        'صورة تُظهر طفحاً جلدياً بسيطاً');
    expect(result.shouldForwardToMedicalAgent, isTrue);
  });

  test('ثقة غير معروفة (بدون حقل confidence) تُقرأ كـ unknown افتراضياً',
      () {
    final result = agent.interpret(const {
      'dataType': 'document_ocr',
      'extractedText': 'نص',
    });

    expect(result.confidence, AgentConfidence.unknown);
  });
}
