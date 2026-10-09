/// =============================================================
/// Lifex-AI — الكاميرا الطبية الذكية
/// الملف: medical_ocr_reader.dart
/// المسار: lib/features/vision/medical_ocr_reader.dart
/// الوصف: قارئ عام للنصوص الطبية (تقارير، وصفات مطبوعة/مخطوطة، نتائج
/// تحاليل مطبوعة) باستخدام تقنية التعرف الضوئي على الحروف (OCR).
///
/// ملاحظة تقنية: هذا الملف يعرّف الواجهة والمنطق التنظيمي فقط. محرك OCR
/// الفعلي (مثل Google ML Kit Text Recognition) يُدمج لاحقاً عبر
/// [OcrTextExtractor] كنقطة استبدال واضحة (Dependency injection)
/// دون الحاجة لتعديل هذا الملف.
/// =============================================================

import 'smart_vision_engine.dart';

/// عقد بسيط لأي محرك استخراج نص فعلي (OCR) يُستخدم خلف الكواليس.
/// هذا يسمح باستبدال محرك OCR (ML Kit/Tesseract/أي حل آخر) دون تعديل
/// منطق هذا الملف.
abstract class OcrTextExtractor {
  Future<String> extractText(List<int> imageBytes);
}

/// تصنيف نوع المستند الطبي المُقروء، يُستنتج من الكلمات المفتاحية
/// الموجودة في النص المستخرج.
enum MedicalDocumentType {
  prescription,
  labReport,
  dischargeReport,
  generalMedicalDocument,
  unknown,
}

/// قارئ النصوص الطبية — يستخدم [OcrTextExtractor] لاستخراج النص الخام
/// ثم يحاول تصنيف نوع المستند ويستخرج أهم الحقول المحتملة.
class MedicalOcrReader {
  MedicalOcrReader({required this.ocrExtractor});

  final OcrTextExtractor ocrExtractor;

  static const Map<String, MedicalDocumentType> _keywordToDocType = {
    'وصفة طبية': MedicalDocumentType.prescription,
    'Rx': MedicalDocumentType.prescription,
    'نتيجة التحليل': MedicalDocumentType.labReport,
    'Lab Report': MedicalDocumentType.labReport,
    'تقرير خروج': MedicalDocumentType.dischargeReport,
    'Discharge Summary': MedicalDocumentType.dischargeReport,
  };

  /// تسجيل هذا القارئ كمعالج لمهام [VisionTaskType.medicalTextOcr]
  /// داخل [SmartVisionEngine] المركزي.
  void registerWithVisionEngine(SmartVisionEngine engine) {
    engine.registerHandler(
      VisionTaskType.medicalTextOcr,
      (imageBytes, context) => readDocument(imageBytes),
    );
  }

  /// قراءة المستند الطبي وتصنيفه، وإرجاع نتيجة موحّدة.
  Future<VisionResult> readDocument(List<int> imageBytes) async {
    final rawText = await ocrExtractor.extractText(imageBytes);

    if (rawText.trim().isEmpty) {
      return VisionResult.failure(
        'لم يتم التعرّف على أي نص واضح في الصورة. يُرجى إعادة التصوير '
        'بإضاءة أفضل وزاوية مستقيمة.',
      );
    }

    final docType = _classifyDocument(rawText);

    return VisionResult(
      success: true,
      extractedSummaryAr:
          'تم استخراج نص من مستند مصنّف كـ "${_docTypeLabelAr(docType)}".',
      structuredData: {
        'documentType': docType.name,
        'rawText': rawText,
      },
      confidence: docType == MedicalDocumentType.unknown ? 0.4 : 0.75,
      disclaimer:
          'النص المستخرج آلياً وقد يحتوي أخطاء قراءة. يُرجى مراجعة المستند '
          'الأصلي أو الطبيب المعالج قبل الاعتماد على أي معلومة منه.',
    );
  }

  MedicalDocumentType _classifyDocument(String text) {
    for (final entry in _keywordToDocType.entries) {
      if (text.contains(entry.key)) {
        return entry.value;
      }
    }
    return MedicalDocumentType.unknown;
  }

  String _docTypeLabelAr(MedicalDocumentType type) {
    switch (type) {
      case MedicalDocumentType.prescription:
        return 'وصفة طبية';
      case MedicalDocumentType.labReport:
        return 'نتيجة تحليل';
      case MedicalDocumentType.dischargeReport:
        return 'تقرير خروج من المستشفى';
      case MedicalDocumentType.generalMedicalDocument:
        return 'مستند طبي عام';
      case MedicalDocumentType.unknown:
        return 'مستند غير مصنّف';
    }
  }
}
