/// =============================================================
/// Lifex-AI — طبقة الوكيل الذكي (AI Agent Layer)
/// الملف: placeholder_ocr_extractor.dart
/// المسار: lib/core/agent/adapters/placeholder_ocr_extractor.dart
/// الوصف: ⚠️ تنفيذ مؤقت لـ OcrTextExtractor (العقد المُعرَّف في
/// features/vision/medical_ocr_reader.dart) — **لا يقرأ أي نص فعلي**.
///
/// ملاحظة صدق تقنية مهمة: حزمة google_mlkit_text_recognition **موجودة
/// بالفعل** في pubspec.yaml (راجعها)، لكن لم يُستخدم هذا الملف لتفعيلها
/// فعلياً هنا لسبب محدد: MLKit.InputImage.fromBytes() يحتاج بيانات
/// وصفية دقيقة (width/height/InputImageFormat/bytesPerRow) لا يوفرها
/// توقيع OcrTextExtractor.extractText(List<int> imageBytes) الحالي —
/// بايتات خام فقط دون هذه البيانات، لأن هذا التوقيع صُمم في
/// medical_ocr_reader.dart قبل ربط أي محرك فعلي. تنفيذ الربط بشكل خاطئ
/// (بتخمين هذه القيم) قد ينتج فشلاً صامتاً أو استثناءات وقت التشغيل غير
/// متوقعة على أجهزة حقيقية بدل عدم العمل بوضوح كما هو الآن.
///
/// المسار الصحيح لتفعيل OCR فعلياً (تعديلان بسيطان لا يكسران شيئاً):
/// 1) في نقطة التقاط/اختيار الصورة (camera أو image_picker — كلاهما
///    مُضاف في pubspec.yaml)، احتفظ بمسار الملف (File path) وليس
///    البايتات الخام فقط.
/// 2) نفّذ extractText عبر:
///      final inputImage = InputImage.fromFilePath(filePath);
///      final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
///      final result = await recognizer.processImage(inputImage);
///      return result.text;
///    (استخدم TextRecognitionScript.arabic إن توفر عند تحديث الحزمة،
///    أو معالجة ما بعدية للنص العربي حسب إصدار الحزمة المُثبَّت).
/// 3) بدّل PlaceholderOcrExtractor بالتنفيذ الجديد في main.dart —
///    سطر واحد فقط، لا تعديل آخر مطلوب في بقية طبقة الوكيل.
/// =============================================================

import '../../../features/vision/medical_ocr_reader.dart';

class PlaceholderOcrExtractor implements OcrTextExtractor {
  const PlaceholderOcrExtractor();

  @override
  Future<String> extractText(List<int> imageBytes) async {
    // نص فارغ عمداً — الأدوات التي تعتمد عليه (DocumentReaderTool/
    // OcrTool) تتعامل مع النص الفارغ كفشل صريح (بند 27)، وليس كنجاح
    // بمحتوى وهمي. هذا يمنع عرض "نتيجة تحليل" لمستند لم يُقرأ فعلياً.
    return '';
  }
}

