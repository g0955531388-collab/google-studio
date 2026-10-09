/// =============================================================
/// Lifex-AI — المصطلحات الطبية الرسمية
/// الملف: terminology_connector.dart
/// المسار: lib/services/medical_terminology/terminology_connector.dart
/// الوصف: طبقة اتصال بأنظمة التصنيف الطبي الرسمية العالمية — لا يحتوي
/// هذا الملف على أي أكواد ICD-11/SNOMED CT/LOINC/RxNorm مؤلَّفة يدوياً؛
/// فقط عقود اتصال بواجهات برمجية رسمية أو ملفات بيانات رسمية معتمدة.
///
/// ⚠️ حالة كل نظام:
/// - ICD-11: مجاني، عبر API رسمي من منظمة الصحة العالمية
///   (https://icd.who.int/icdapi) — يتطلب فقط تسجيل تطبيق للحصول على
///   client_id/secret مجاناً.
/// - RxNorm: مجاني، عبر API من المكتبة الوطنية الأمريكية للطب (NLM)
///   (https://rxnav.nlm.nih.gov/) — بلا ترخيص مطلوب لمعظم الاستخدامات.
/// - LOINC: مجاني من Regenstrief Institute، لكن يتطلب تنزيل ملف البيانات
///   الكامل (ضخم جداً، مئات الآلاف من السجلات) والاتفاق على شروط
///   الترخيص المجاني عبر التسجيل في loinc.org.
/// - SNOMED CT: **يتطلب ترخيصاً فعلياً** من SNOMED International أو
///   المركز الوطني المعتمد في بلدك قبل أي استخدام تجاري أو حتى تطويري
///   جاد — لا يجوز دمجه دون هذا الترخيص.
/// =============================================================

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/error_handler.dart';

class TerminologyLookupResult {
  final bool found;
  final String? code;
  final String? officialTermEn;
  final String? sourceSystem;

  const TerminologyLookupResult.found({
    required this.code,
    required this.officialTermEn,
    required this.sourceSystem,
  }) : found = true;

  const TerminologyLookupResult.notFound()
      : found = false,
        code = null,
        officialTermEn = null,
        sourceSystem = null;
}

/// عقد أي مزوّد بحث مصطلحات طبية رسمي.
abstract class MedicalTerminologyProvider {
  String get systemName;
  Future<TerminologyLookupResult> lookupByTerm(String searchTerm);
}

/// عميل WHO ICD-11 الرسمي — يتطلب client_id/secret حقيقيين من التسجيل
/// المجاني على icd.who.int/icdapi قبل الاستخدام الفعلي.
class Icd11TerminologyProvider implements MedicalTerminologyProvider {
  Icd11TerminologyProvider({
    required this.clientId,
    required this.clientSecret,
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();

  final String clientId;
  final String clientSecret;
  final http.Client _httpClient;

  @override
  String get systemName => 'ICD-11 (WHO)';

  static const String _searchEndpoint =
      'https://id.who.int/icd/release/11/2024-01/mms/search';

  @override
  Future<TerminologyLookupResult> lookupByTerm(String searchTerm) async {
    try {
      // ملاحظة: الاتصال الفعلي بـ ICD-11 API يتطلب أولاً الحصول على
      // access token عبر OAuth2 من id.who.int باستخدام clientId/
      // clientSecret، ثم إرفاقه كـ Bearer Token هنا. هذا التبسيط يفترض
      // وجود دالة منفصلة للحصول على التوكن غير معروضة هنا لتبسيط المثال.
      final response = await _httpClient.get(
        Uri.parse('$_searchEndpoint?q=${Uri.encodeComponent(searchTerm)}'),
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
          'API-Version': 'v2',
        },
      );

      if (response.statusCode != 200) {
        return const TerminologyLookupResult.notFound();
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final entities = decoded['destinationEntities'] as List<dynamic>?;
      if (entities == null || entities.isEmpty) {
        return const TerminologyLookupResult.notFound();
      }

      final first = entities.first as Map<String, dynamic>;
      return TerminologyLookupResult.found(
        code: first['theCode'] as String?,
        officialTermEn: first['title'] as String?,
        sourceSystem: systemName,
      );
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'ICD11_LOOKUP_FAILED',
        'فشل البحث في نظام ICD-11 الرسمي.',
        sourceModule: 'terminology_connector',
        exception: e,
        stackTrace: stackTrace,
      );
      return const TerminologyLookupResult.notFound();
    }
  }
}

/// عميل RxNorm الرسمي (NLM) — لربط أسماء الأدوية بمعرّفات دوائية معيارية
/// عالمية، مجاني بلا ترخيص مطلوب لمعظم الاستخدامات.
class RxNormTerminologyProvider implements MedicalTerminologyProvider {
  RxNormTerminologyProvider({http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;

  @override
  String get systemName => 'RxNorm (NLM)';

  static const String _endpoint =
      'https://rxnav.nlm.nih.gov/REST/drugs.json';

  @override
  Future<TerminologyLookupResult> lookupByTerm(String searchTerm) async {
    try {
      final response = await _httpClient.get(
        Uri.parse('$_endpoint?name=${Uri.encodeComponent(searchTerm)}'),
      );

      if (response.statusCode != 200) {
        return const TerminologyLookupResult.notFound();
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final drugGroup = decoded['drugGroup'] as Map<String, dynamic>?;
      final conceptGroups = drugGroup?['conceptGroup'] as List<dynamic>?;

      if (conceptGroups == null || conceptGroups.isEmpty) {
        return const TerminologyLookupResult.notFound();
      }

      for (final group in conceptGroups) {
        final properties = (group as Map<String, dynamic>)['conceptProperties']
            as List<dynamic>?;
        if (properties != null && properties.isNotEmpty) {
          final first = properties.first as Map<String, dynamic>;
          return TerminologyLookupResult.found(
            code: first['rxcui'] as String?,
            officialTermEn: first['name'] as String?,
            sourceSystem: systemName,
          );
        }
      }

      return const TerminologyLookupResult.notFound();
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'RXNORM_LOOKUP_FAILED',
        'فشل البحث في نظام RxNorm الرسمي.',
        sourceModule: 'terminology_connector',
        exception: e,
        stackTrace: stackTrace,
      );
      return const TerminologyLookupResult.notFound();
    }
  }
}

/// موجّه موحّد يبحث عبر كل أنظمة المصطلحات المسجَّلة، بدلاً من استدعاء
/// كل مزوّد يدوياً من كل شاشة على حدة.
class TerminologyConnector {
  TerminologyConnector();

  final List<MedicalTerminologyProvider> _providers = [];

  void registerProvider(MedicalTerminologyProvider provider) {
    _providers.add(provider);
  }

  /// البحث عبر كل الأنظمة المسجَّلة، وإرجاع أول نتيجة موجودة.
  Future<TerminologyLookupResult> lookupAcrossAllSystems(
    String searchTerm,
  ) async {
    for (final provider in _providers) {
      final result = await provider.lookupByTerm(searchTerm);
      if (result.found) return result;
    }
    return const TerminologyLookupResult.notFound();
  }
}
