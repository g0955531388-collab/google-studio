// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: risk_level_engine_test.dart
// المسار: test/features/risk_level_engine_test.dart
// الوصف: اختبار منطق تقييم الخطر في الطوارئ — أهم منطق في المشروع
// لأنه يقرر مستوى الاستجابة (منخفض/متوسط/عالٍ/حرج) لأي حدث صحي طارئ.
// أي خطأ هنا قد يعني عدم تصعيد حالة طارئة فعلية بالشكل الصحيح.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/app_constants.dart';
import 'package:lifex_ai/features/emergency/risk_level_engine.dart';

void main() {
  late RiskLevelEngine engine;

  setUp(() {
    engine = RiskLevelEngine();
  });

  group('RiskLevelEngine', () {
    test('يصنّف المؤشرات القلبية دائماً كحرجة، بغض النظر عن السياق', () {
      final result = engine.assess({'triggerType': 'cardiac_symptom'});
      expect(result.level, AppConstants.riskLevelCritical);
    });

    test('يصنّف فقدان الوعي كحرج', () {
      final result = engine.assess({'triggerType': 'loss_of_consciousness'});
      expect(result.level, AppConstants.riskLevelCritical);
    });

    test('يصنّف النزيف الحاد كحرج حتى مع بيانات ناقصة', () {
      final result = engine.assess({'triggerType': 'severe_bleeding'});
      expect(result.level, AppConstants.riskLevelCritical);
    });

    test('حالة مزمنة مع عمر 60+ تُصنَّف كعالية الخطورة', () {
      final result = engine.assess({
        'hasChronicCondition': true,
        'age': 65,
      });
      expect(result.level, AppConstants.riskLevelHigh);
    });

    test('حالة مزمنة بدون عمر محدَّد تُصنَّف أيضاً كعالية (افتراض حذر)', () {
      final result = engine.assess({'hasChronicCondition': true});
      expect(result.level, AppConstants.riskLevelHigh);
    });

    test('مؤشر عام بلا حالة مزمنة يُصنَّف كمتوسط', () {
      final result = engine.assess({'triggerType': 'general_discomfort'});
      expect(result.level, AppConstants.riskLevelMedium);
    });

    test('سياق فارغ تماماً يُصنَّف كمنخفض الخطورة', () {
      final result = engine.assess({});
      expect(result.level, AppConstants.riskLevelLow);
    });

    test('كل تقييم يتضمن سبباً نصياً غير فارغ (شفافية القرار)', () {
      final result = engine.assess({'triggerType': 'cardiac_symptom'});
      expect(result.reasonAr, isNotEmpty);
    });
  });
}
