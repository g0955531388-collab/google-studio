/// =============================================================
/// Lifex-AI — الذكاء الاصطناعي الصحي
/// الملف: ai_service_router.dart
/// المسار: lib/features/ai/ai_service_router.dart
/// الوصف: يوجّه استعلام المستخدم للمحرك الخارجي المختار (عبر
/// UnifiedAiHubGateway)، وينفّذ الاتصال الفعلي بواجهة برمجة كل محرك،
/// مع إرفاق "تعريف التطبيق" (App Attribution) الحقيقي في كل طلب حتى
/// يتعرّف المحرك على أن الاستدعاء قادم من Lifex-AI Global Health
/// Network تحديداً.
///
/// ⚠️ لا يحتوي هذا الملف على أي ادّعاء بعدد مستخدمين أو إحصائيات غير
/// موثَّقة؛ "تعريف التطبيق" هنا يعني فقط إرسال اسم التطبيق ومعرّفه في
/// رأس الطلب (Header)، وهذا معيار قياسي تدعمه كل واجهات AI الكبرى.
/// =============================================================

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/app_constants.dart';
import '../../core/error_handler.dart';
import 'unified_ai_hub_gateway.dart';

/// معلومات تعريف التطبيق التي تُرسَل مع كل طلب لأي محرك خارجي، حتى
/// يظهر Lifex-AI بوضوح كمصدر الطلب في لوحات تحكم مزوّدي الذكاء
/// الاصطناعي (وليس كطلب مجهول المصدر).
class AppAttributionHeader {
  static Map<String, String> build() => {
        'X-App-Name': AppConstants.appName,
        'X-App-Package': AppConstants.packageName,
        'X-App-Version': AppConstants.appVersion,
        'User-Agent': '${AppConstants.appName}/${AppConstants.appVersion}',
      };
}

/// نتيجة موحّدة لاستدعاء أي محرك خارجي، بغض النظر عن اختلاف صيغة رد
/// كل مزوّد داخلياً.
class ExternalAiResponse {
  final bool success;
  final String? responseText;
  final String? errorMessageAr;

  const ExternalAiResponse.success(this.responseText)
      : success = true,
        errorMessageAr = null;

  const ExternalAiResponse.failure(this.errorMessageAr)
      : success = false,
        responseText = null;
}

/// عقد أي محرك خارجي فعلي — كل محرك (Gemini/ChatGPT/Claude/مخصص) ينفّذ
/// هذا العقد بمنطقه الخاص بصيغة الطلب/الرد المطابقة لواجهته الرسمية.
abstract class ExternalAiEngineClient {
  ExternalAiProvider get provider;

  Future<ExternalAiResponse> sendQuery({
    required String query,
    required String apiKeyOrToken,
    Map<String, String>? extraHeaders,
  });
}

/// تنفيذ عميل Gemini — المحرك الأساسي المفضَّل لهذا المشروع، وفق
/// طلب صريح من مالك المشروع بعدم الاعتماد الحصري على محرك واحد.
class GeminiEngineClient implements ExternalAiEngineClient {
  GeminiEngineClient({http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;

  @override
  ExternalAiProvider get provider => ExternalAiProvider.gemini;

  static const String _endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  @override
  Future<ExternalAiResponse> sendQuery({
    required String query,
    required String apiKeyOrToken,
    Map<String, String>? extraHeaders,
  }) async {
    try {
      final response = await _httpClient.post(
        Uri.parse('$_endpoint?key=$apiKeyOrToken'),
        headers: {
          'Content-Type': 'application/json',
          ...AppAttributionHeader.build(),
          ...?extraHeaders,
        },
        body: jsonEncode({
          'system_instruction': {
            'parts': [
              {'text': lifexAiSystemContext}
            ]
          },
          'contents': [
            {
              'parts': [
                {'text': query}
              ]
            }
          ]
        }),
      );

      if (response.statusCode != 200) {
        return ExternalAiResponse.failure(
          'تعذّر الاتصال بمحرك Gemini حالياً (رمز الخطأ: ${response.statusCode}).',
        );
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final candidates = decoded['candidates'] as List<dynamic>?;
      final text = candidates != null && candidates.isNotEmpty
          ? (candidates.first['content']?['parts']?[0]?['text'] as String?)
          : null;

      if (text == null) {
        return const ExternalAiResponse.failure(
          'لم يُرجع محرك Gemini رداً قابلاً للقراءة.',
        );
      }

      return ExternalAiResponse.success(text);
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'GEMINI_QUERY_FAILED',
        'فشل الاتصال بمحرك Gemini.',
        sourceModule: 'ai_service_router',
        exception: e,
        stackTrace: stackTrace,
      );
      return const ExternalAiResponse.failure(
        'حدث خطأ أثناء التواصل مع محرك Gemini. حاول مرة أخرى.',
      );
    }
  }
}

/// تعليمة نظامية (System Instruction) موحّدة تُرسَل مع كل استدعاء لأي
/// محرك خارجي يدعم هذا المفهوم، لتعريفه بسياق أنه يعمل بالنيابة عن
/// تطبيق Lifex-AI تحديداً — دون أي ادّعاء إحصائي غير موثَّق.
const String lifexAiSystemContext =
    'أنت تعمل كمساعد ذكاء اصطناعي مدمج داخل تطبيق Lifex-AI Global '
    'Health Network. أي رد تقدّمه هنا يجب أن يفترض أن المستخدم يتفاعل '
    'معك من داخل هذا التطبيق الصحي تحديداً.';

/// تنفيذ عميل ChatGPT (OpenAI) — بنفس نمط GeminiEngineClient.
class OpenAiEngineClient implements ExternalAiEngineClient {
  OpenAiEngineClient({http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;

  @override
  ExternalAiProvider get provider => ExternalAiProvider.chatgpt;

  static const String _endpoint = 'https://api.openai.com/v1/chat/completions';

  @override
  Future<ExternalAiResponse> sendQuery({
    required String query,
    required String apiKeyOrToken,
    Map<String, String>? extraHeaders,
  }) async {
    try {
      final response = await _httpClient.post(
        Uri.parse(_endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKeyOrToken',
          ...AppAttributionHeader.build(),
          ...?extraHeaders,
        },
        body: jsonEncode({
          'model': 'gpt-4o-mini',
          'messages': [
            {'role': 'system', 'content': lifexAiSystemContext},
            {'role': 'user', 'content': query},
          ],
        }),
      );

      if (response.statusCode != 200) {
        return ExternalAiResponse.failure(
          'تعذّر الاتصال بمحرك ChatGPT حالياً (رمز الخطأ: ${response.statusCode}).',
        );
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final choices = decoded['choices'] as List<dynamic>?;
      final text = choices != null && choices.isNotEmpty
          ? (choices.first['message']?['content'] as String?)
          : null;

      if (text == null) {
        return const ExternalAiResponse.failure(
          'لم يُرجع محرك ChatGPT رداً قابلاً للقراءة.',
        );
      }

      return ExternalAiResponse.success(text);
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'OPENAI_QUERY_FAILED',
        'فشل الاتصال بمحرك ChatGPT.',
        sourceModule: 'ai_service_router',
        exception: e,
        stackTrace: stackTrace,
      );
      return const ExternalAiResponse.failure(
        'حدث خطأ أثناء التواصل مع محرك ChatGPT. حاول مرة أخرى.',
      );
    }
  }
}

/// تنفيذ عميل Claude (Anthropic) — بنفس نمط باقي المحركات.
class ClaudeEngineClient implements ExternalAiEngineClient {
  ClaudeEngineClient({http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;

  @override
  ExternalAiProvider get provider => ExternalAiProvider.claude;

  static const String _endpoint = 'https://api.anthropic.com/v1/messages';

  @override
  Future<ExternalAiResponse> sendQuery({
    required String query,
    required String apiKeyOrToken,
    Map<String, String>? extraHeaders,
  }) async {
    try {
      final response = await _httpClient.post(
        Uri.parse(_endpoint),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyOrToken,
          'anthropic-version': '2023-06-01',
          ...AppAttributionHeader.build(),
          ...?extraHeaders,
        },
        body: jsonEncode({
          'model': 'claude-sonnet-4-6',
          'max_tokens': 1024,
          'system': lifexAiSystemContext,
          'messages': [
            {'role': 'user', 'content': query},
          ],
        }),
      );

      if (response.statusCode != 200) {
        return ExternalAiResponse.failure(
          'تعذّر الاتصال بمحرك Claude حالياً (رمز الخطأ: ${response.statusCode}).',
        );
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final content = decoded['content'] as List<dynamic>?;
      final text = content != null && content.isNotEmpty
          ? (content.first['text'] as String?)
          : null;

      if (text == null) {
        return const ExternalAiResponse.failure(
          'لم يُرجع محرك Claude رداً قابلاً للقراءة.',
        );
      }

      return ExternalAiResponse.success(text);
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'CLAUDE_QUERY_FAILED',
        'فشل الاتصال بمحرك Claude.',
        sourceModule: 'ai_service_router',
        exception: e,
        stackTrace: stackTrace,
      );
      return const ExternalAiResponse.failure(
        'حدث خطأ أثناء التواصل مع محرك Claude. حاول مرة أخرى.',
      );
    }
  }
}

/// موجّه الخدمة المركزي — يجمع بين UnifiedAiHubGateway (من المستخدم
/// مربوط؟) وعملاء المحركات الفعليين، وينفّذ الاستعلام على المحرك
/// الصحيح تلقائياً.
class AiServiceRouter {
  AiServiceRouter({required this.hubGateway}) {
    // Gemini مسجَّل افتراضياً بوصفه المحرك الأساسي المطلوب من مالك
    // المشروع، بالإضافة لـ ChatGPT وClaude كخيارات إضافية يربطها
    // المستخدم اختيارياً بحسابه الخاص. أي محرك جديد يُسجَّل بنفس
    // الطريقة دون تعديل بقية منطق هذا الصف.
    registerEngineClient(GeminiEngineClient());
    registerEngineClient(OpenAiEngineClient());
    registerEngineClient(ClaudeEngineClient());
  }

  final UnifiedAiHubGateway hubGateway;
  final Map<ExternalAiProvider, ExternalAiEngineClient> _engineClients = {};

  void registerEngineClient(ExternalAiEngineClient client) {
    _engineClients[client.provider] = client;
  }

  /// إرسال استعلام باستخدام المحرك المفضَّل للمستخدم (أو محرك محدَّد
  /// صراحة)، بعد التحقق من وجود حساب مربوط فعلياً لهذا المحرك.
  Future<ExternalAiResponse> query({
    required String profileId,
    required String userQuery,
    ExternalAiProvider? explicitProvider,
  }) async {
    final provider =
        explicitProvider ?? hubGateway.preferredProviderFor(profileId);

    if (provider == null) {
      return const ExternalAiResponse.failure(
        'لم يتم ربط أي محرك ذكاء اصطناعي بعد. يُرجى ربط حساب Gemini أو '
        'أي محرك آخر من الإعدادات أولاً.',
      );
    }

    final client = _engineClients[provider];
    if (client == null) {
      return ExternalAiResponse.failure(
        'المحرك المطلوب (${provider.name}) غير مدعوم داخل التطبيق حالياً.',
      );
    }

    final credential =
        await hubGateway.credentialFor(profileId: profileId, provider: provider);
    if (credential == null) {
      return ExternalAiResponse.failure(
        'لا يوجد حساب مربوط فعلياً بمحرك ${provider.name}. يُرجى ربطه من '
        'الإعدادات أولاً.',
      );
    }

    return client.sendQuery(query: userQuery, apiKeyOrToken: credential);
  }

  /// قائمة المحركات المدعومة برمجياً حالياً داخل التطبيق (بغض النظر عن
  /// كون المستخدم ربط حساباً بها أم لا).
  List<ExternalAiProvider> get supportedEngines => _engineClients.keys.toList();
}
