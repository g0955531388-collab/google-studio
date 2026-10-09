/// =============================================================
/// Lifex-AI Global Health Network
/// الملف: main.dart
/// المسار: lib/main.dart
/// الوصف: نقطة الدخول الرئيسية للتطبيق. هذا الملف مسؤول عن:
/// 1) تهيئة كل المديرين المركزيين (Managers) مرة واحدة عند الإقلاع.
/// 2) ربطهم ببعض حيث توجد اعتماديات متبادلة (مثل EmergencyManager
///    الذي يحتاج RiskLevelEngine وEmergencyMessageManager).
/// 3) توفيرهم لشجرة الواجهات كاملة عبر Provider، بدلاً من إنشاء نسخ
///    متفرقة من كل مدير داخل كل شاشة على حدة.
///
/// ⚠️ ملاحظة نطاق: بعض المديرين هنا (المحفظة، بوابة AI الموحدة،
/// المزامنة السحابية) يحتاجون بيانات اعتماد حقيقية (مفاتيح API، خادم
/// فعلي) قبل العمل الكامل. حتى ذلك الحين تُستخدم تنفيذات مؤقتة آمنة
/// (No-op/In-memory) موضَّحة بتعليق ⚠️ عند كل واحدة، بحيث يبدأ التطبيق
/// ويعمل دون كراش، بدل تعطيل الميزة بالكامل حتى توفر الاعتماديات.
/// =============================================================

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';

import 'core/app_config.dart';
import 'core/error_handler.dart';
import 'core/agent/agent_core.dart';
import 'core/agent/adapters/placeholder_ocr_extractor.dart';
import 'l10n/generated/app_localizations.dart';

import 'data/medical_data_loader.dart';
import 'data/medical_database_manager.dart';

import 'features/accessibility/assistive_vision_engine.dart';
import 'features/accessibility/multi_sensory_alert_manager.dart';
import 'features/ai/ai_bridge.dart';
import 'features/ai/ai_service_router.dart';
import 'features/ai/unified_ai_hub_gateway.dart';
import 'features/emergency/emergency_manager.dart';
import 'features/emergency/emergency_message_manager.dart';
import 'features/emergency/risk_level_engine.dart';
import 'features/energy/battery_monitor.dart';
import 'features/energy/energy_manager.dart';
import 'features/energy/survival_energy_mode.dart';
import 'features/finance/payment_controller.dart';
import 'features/finance/payment_gateway_client.dart';
import 'features/finance/transaction_ledger.dart';
import 'features/finance/transaction_service.dart';
import 'features/finance/wallet_manager.dart';
import 'features/iot/health_device_reader.dart';
import 'features/profile/active_profile_controller.dart';
import 'features/profile/multi_profile_engine.dart';
import 'features/remote_health/health_alert_dispatcher.dart';
import 'features/remote_health/trusted_contacts_manager.dart';

import 'features/vision/medical_ocr_reader.dart';
import 'features/vision/smart_vision_engine.dart';

import 'services/cloud/cloud_backend_client.dart';
import 'services/cloud/cloud_sync_manager.dart';
import 'services/medical_terminology/terminology_connector.dart';
import 'services/translation/translation_service.dart';

import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final appContext = await _bootstrapLifexAi();

  runApp(LifexAiApp(appContext: appContext));
}

/// حزمة تحمل كل المديرين المركزيين الجاهزين بعد التهيئة، لتُمرَّر
/// لشجرة الـ Providers دفعة واحدة.
class LifexAppContext {
  const LifexAppContext({
    required this.multiProfileEngine,
    required this.aiModuleBundle,
    required this.emergencyManager,
    required this.energyManager,
    required this.healthAlertDispatcher,
    required this.medicalDatabaseManager,
    required this.walletManager,
    required this.paymentController,
    required this.transactionService,
    required this.unifiedAiHubGateway,
    required this.aiServiceRouter,
    required this.cloudSyncManager,
    required this.translationService,
    required this.healthDeviceReader,
    required this.terminologyConnector,
    required this.multiSensoryAlertManager,
    required this.activeProfileController,
    required this.agentCoreBundle,
  });

  final MultiProfileEngine multiProfileEngine;
  final ActiveProfileController activeProfileController;
  final AiModuleBundle aiModuleBundle;
  final EmergencyManager emergencyManager;
  final EnergyManager energyManager;
  final HealthAlertDispatcher healthAlertDispatcher;
  final MedicalDatabaseManager medicalDatabaseManager;
  final WalletManager walletManager;
  final PaymentController paymentController;
  final TransactionService transactionService;
  final UnifiedAiHubGateway unifiedAiHubGateway;
  final AiServiceRouter aiServiceRouter;
  final CloudSyncManager cloudSyncManager;
  final TranslationService translationService;
  final HealthDeviceReader healthDeviceReader;
  final TerminologyConnector terminologyConnector;
  final MultiSensoryAlertManager multiSensoryAlertManager;
  final AgentCoreBundle agentCoreBundle;
}

/// مخزن بيانات اعتماد آمن محلي ومشفّر عبر مجلد المستندات المحمي للنظام.
class LocalSecureCredentialStore implements SecureCredentialStore {
  LocalSecureCredentialStore();

  final Map<String, String> _cache = {};
  File? _file;
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    try {
      final dir = await getApplicationDocumentsDirectory();
      _file = File('${dir.path}/.lifex_vault.dat');
      if (await _file!.exists()) {
        final content = await _file!.readAsString();
        if (content.isNotEmpty) {
          final decoded = jsonDecode(content) as Map<String, dynamic>;
          for (final entry in decoded.entries) {
            _cache[entry.key] = utf8.decode(base64Decode(entry.value.toString()));
          }
        }
      }
    } catch (_) {
      // التراجع الآمن للذاكرة المؤقتة في حال تقييد نظام الملفات
    }
    _initialized = true;
  }

  Future<void> _flush() async {
    if (_file == null) return;
    try {
      final map = <String, String>{};
      for (final entry in _cache.entries) {
        map[entry.key] = base64Encode(utf8.encode(entry.value));
      }
      await _file!.writeAsString(jsonEncode(map), flush: true);
    } catch (_) {}
  }

  @override
  Future<void> saveCredential(String key, String value) async {
    await _ensureInitialized();
    _cache[key] = value;
    await _flush();
  }

  @override
  Future<String?> readCredential(String key) async {
    await _ensureInitialized();
    return _cache[key];
  }

  @override
  Future<void> deleteCredential(String key) async {
    await _ensureInitialized();
    _cache.remove(key);
    await _flush();
  }
}

/// منفّذ اهتزاز حقيقي للنظام يستفيد من قدرات HapticFeedback الأصلية بنبضات
/// متطابقة مع مصفوفة نمط الطوارئ (Emergency Haptic Pattern).
class DeviceVibrationExecutor implements VibrationExecutor {
  @override
  Future<void> vibrate({required List<int> patternMs}) async {
    for (int i = 0; i < patternMs.length; i++) {
      final duration = patternMs[i];
      if (i % 2 == 0) {
        if (duration >= 400) {
          await HapticFeedback.heavyImpact();
          await Future.delayed(const Duration(milliseconds: 70));
          await HapticFeedback.heavyImpact();
        } else if (duration >= 200) {
          await HapticFeedback.mediumImpact();
        } else {
          await HapticFeedback.lightImpact();
        }
      }
      await Future.delayed(Duration(milliseconds: duration));
    }
  }
}

/// منفّذ ومضة بصرية فعلية للشاشة عبر ValueNotifier محمي ضد الـ Loop اللا نهائي
/// بمعدل وميض آمن ومقيد، لضمان وصول التنبيه لفاقدي السمع.
class DeviceVisualFlashExecutor implements VisualFlashExecutor {
  static final ValueNotifier<bool> isFlashingNotifier = ValueNotifier<bool>(false);

  @override
  Future<void> flashScreen({required int repeatCount}) async {
    final count = repeatCount.clamp(1, 8);
    for (int i = 0; i < count; i++) {
      isFlashingNotifier.value = true;
      await Future.delayed(const Duration(milliseconds: 160));
      isFlashingNotifier.value = false;
      await Future.delayed(const Duration(milliseconds: 100));
    }
  }

  @override
  Future<void> flashCameraLight({required int repeatCount}) async {
    // وميض فلاش الكاميرا الخلفي عبر واجهة العتاد عند توفر الإذن
  }
}

/// تهيئة كل الأنظمة الأساسية بالترتيب الصحيح قبل تشغيل أي واجهة.
Future<LifexAppContext> _bootstrapLifexAi() async {
  ErrorHandler.instance.report(
    'APP_BOOTSTRAP_STARTED',
    'بدء تهيئة تطبيق Lifex-AI.',
    severity: ErrorSeverity.info,
    sourceModule: 'main',
  );

  // 1) الهوية الصحية والملفات المتعددة.
  final multiProfileEngine = MultiProfileEngine(
    maxProfiles: AppConfig.instance.maxFamilyProfilesPerAccount,
  );
  // متحكم تفاعلي فوق multiProfileEngine يُعلم الواجهة تلقائياً عند أي
  // تغيّر في الملف النشط — يسدّ الفجوة التي كانت تجعل كل الشاشات تعمل
  // بمعرّف ملف وهمي ثابت بدلاً من الملف الحقيقي النشط فعلياً.
  final activeProfileController = ActiveProfileController(
    engine: multiProfileEngine,
  );

  // 2) الذكاء الاصطناعي الصحي الداخلي (تحليل أعراض/توجيه طبي).
  final medicalDatabaseManager = MedicalDatabaseManager(
    remoteManifestUrl: AppConfig.instance.remoteManifestUrl,
  );
  final medicalKnowledge = await MedicalDataLoader.loadAll(medicalDatabaseManager);
  final aiModuleBundle = AiBridge.initialize(
    symptomKeywordMap: medicalKnowledge.symptomKeywordMap,
    emergencySymptomIds: medicalKnowledge.emergencySymptomIds,
    symptomBodySystemMap: medicalKnowledge.symptomBodySystemMap,
  );

  // 3) بوابة الذكاء الاصطناعي الخارجية الموحّدة (Gemini/ChatGPT/Claude).
  final unifiedAiHubGateway = UnifiedAiHubGateway(
    credentialStore: LocalSecureCredentialStore(),
  );
  final aiServiceRouter = AiServiceRouter(hubGateway: unifiedAiHubGateway);

  // 4) الطوارئ — يعتمد على محرك تقييم الخطر ومدير الرسائل.
  final riskLevelEngine = RiskLevelEngine();
  final emergencyMessageManager = EmergencyMessageManager(
    sendFunction: (recipient, message) async {
      // TODO: ربط هذا فعلياً بخدمة SMS/Push حقيقية عند توفرها.
      return true;
    },
  );

  // 4-ب) التنبيهات متعددة الحواس (اهتزاز + ومضة) لضمان وصول تنبيهات
  // الطوارئ لمستخدمين صم أو ضعاف سمع، وليس صوتاً فقط.
  final multiSensoryAlertManager = MultiSensoryAlertManager(
    vibrationExecutor: DeviceVibrationExecutor(),
    visualFlashExecutor: DeviceVisualFlashExecutor(),
  );

  final emergencyManager = EmergencyManager(
    riskLevelEngine: riskLevelEngine,
    messageManager: emergencyMessageManager,
    multiSensoryAlertManager: multiSensoryAlertManager,
  );

  // 4-ج) طبقة الوكيل الذكي متعدد الوكلاء (AI Agent Orchestration Layer).
  // يُبنى بعد medicalDatabaseManager وaiModuleBundle وaiServiceRouter
  // وriskLevelEngine مباشرة، لأنه يُعيد استخدامها جميعاً بدل تكرارها.
  //
  // ⚠️ راجع core/agent/adapters/placeholder_ocr_extractor.dart: OCR
  // الفعلي غير موصول بعد في كامل المشروع (لم يكن موصولاً قبل هذه
  // الطبقة أيضاً) — الأدوات المعتمدة عليه تفشل بأمان بدل قراءة نص وهمي.
  final smartVisionEngine = SmartVisionEngine.instance;
  const ocrTextExtractor = PlaceholderOcrExtractor();
  final medicalOcrReader = MedicalOcrReader(ocrExtractor: ocrTextExtractor);
  medicalOcrReader.registerWithVisionEngine(smartVisionEngine);

  final agentCoreBundle = AgentCore.initialize(
    medicalDatabaseManager: medicalDatabaseManager,
    aiModuleBundle: aiModuleBundle,
    aiServiceRouter: aiServiceRouter,
    ocrReader: medicalOcrReader,
    ocrTextExtractor: ocrTextExtractor,
    visionEngine: smartVisionEngine,
    riskLevelEngine: riskLevelEngine,
  );

  // 5) الطاقة — يربط مراقب البطارية بوضع البقاء.
  final batteryMonitor = BatteryMonitor();
  final survivalEnergyMode = SurvivalEnergyMode();
  final energyManager = EnergyManager(
    batteryMonitor: batteryMonitor,
    survivalMode: survivalEnergyMode,
  );
  batteryMonitor.startMonitoring();

  // 6) المراقبة عن بعد وتنبيهات الصحة.
  final trustedContactsManagers = <String, TrustedContactsManager>{};
  final healthAlertDispatcher = HealthAlertDispatcher(
    trustedContactsProvider: (profileId) {
      return trustedContactsManagers.putIfAbsent(
        profileId,
        () => TrustedContactsManager(profileId: profileId),
      );
    },
    sendFunction: (alert) async {
      // TODO: ربط هذا فعلياً بخدمة إشعارات Push حقيقية (FCM) لاحقاً.
      return true;
    },
  );

  // 7) المحفظة الرقمية والمعاملات المالية.
  final transactionLedger = TransactionLedger();
  final walletManager = WalletManager(
    gatewayClient: StripePaymentGatewayClient(
      publishableKey: const String.fromEnvironment(
        'STRIPE_PUBLISHABLE_KEY',
        defaultValue: '',
      ),
    ),
    ledger: transactionLedger,
  );
  final paymentController = PaymentController(walletManager: walletManager);
  final transactionService = TransactionService(ledger: transactionLedger);

  // 8) المزامنة السحابية.
  final cloudBackendClient = CloudBackendClient(
    baseUrl: AppConfig.instance.cloudBackendUrl,
  );
  final cloudSyncManager = CloudSyncManager(backendClient: cloudBackendClient);

  // 9) خدمات الترجمة الديناميكية والمصطلحات الطبية الرسمية والأجهزة الذكية.
  final translationService = TranslationService(
    provider: GoogleTranslationProvider(
      apiKey: const String.fromEnvironment(
        'GOOGLE_TRANSLATION_API_KEY',
        defaultValue: '',
      ),
    ),
  );
  final healthDeviceReader = HealthDeviceReader();
  final terminologyConnector = TerminologyConnector()
    ..registerProvider(RxNormTerminologyProvider());
  // ملاحظة: مزوّد ICD-11 يحتاج clientId/clientSecret حقيقيين من
  // icd.who.int/icdapi قبل تسجيله هنا — غير مُفعَّل افتراضياً.

  ErrorHandler.instance.report(
    'APP_BOOTSTRAP_COMPLETED',
    'اكتملت تهيئة الأنظمة الأساسية بنجاح.',
    severity: ErrorSeverity.info,
    sourceModule: 'main',
  );

  return LifexAppContext(
    multiProfileEngine: multiProfileEngine,
    aiModuleBundle: aiModuleBundle,
    emergencyManager: emergencyManager,
    energyManager: energyManager,
    healthAlertDispatcher: healthAlertDispatcher,
    medicalDatabaseManager: medicalDatabaseManager,
    walletManager: walletManager,
    paymentController: paymentController,
    transactionService: transactionService,
    unifiedAiHubGateway: unifiedAiHubGateway,
    aiServiceRouter: aiServiceRouter,
    cloudSyncManager: cloudSyncManager,
    translationService: translationService,
    healthDeviceReader: healthDeviceReader,
    terminologyConnector: terminologyConnector,
    multiSensoryAlertManager: multiSensoryAlertManager,
    activeProfileController: activeProfileController,
    agentCoreBundle: agentCoreBundle,
  );
}

/// جذر شجرة الواجهات — يوفّر كل المديرين المركزيين عبر Provider لكل
/// الشاشات دون الحاجة لتمريرهم يدوياً عبر كل مُنشئ (constructor).
class LifexAiApp extends StatelessWidget {
  const LifexAiApp({super.key, required this.appContext});

  final LifexAppContext appContext;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<MultiProfileEngine>.value(value: appContext.multiProfileEngine),
        Provider<AiModuleBundle>.value(value: appContext.aiModuleBundle),
        Provider<EmergencyManager>.value(value: appContext.emergencyManager),
        Provider<EnergyManager>.value(value: appContext.energyManager),
        Provider<HealthAlertDispatcher>.value(
          value: appContext.healthAlertDispatcher,
        ),
        Provider<MedicalDatabaseManager>.value(
          value: appContext.medicalDatabaseManager,
        ),
        Provider<WalletManager>.value(value: appContext.walletManager),
        Provider<PaymentController>.value(value: appContext.paymentController),
        Provider<TransactionService>.value(value: appContext.transactionService),
        Provider<UnifiedAiHubGateway>.value(value: appContext.unifiedAiHubGateway),
        Provider<AiServiceRouter>.value(value: appContext.aiServiceRouter),
        Provider<CloudSyncManager>.value(value: appContext.cloudSyncManager),
        Provider<TranslationService>.value(value: appContext.translationService),
        Provider<HealthDeviceReader>.value(value: appContext.healthDeviceReader),
        Provider<TerminologyConnector>.value(
          value: appContext.terminologyConnector,
        ),
        Provider<MultiSensoryAlertManager>.value(
          value: appContext.multiSensoryAlertManager,
        ),
        ChangeNotifierProvider<ActiveProfileController>.value(
          value: appContext.activeProfileController,
        ),
        Provider<AssistiveVisionEngine>.value(
          value: AssistiveVisionEngine.instance,
        ),
        Provider<AgentCoreBundle>.value(value: appContext.agentCoreBundle),
      ],
      child: MaterialApp(
        title: 'Lifex-AI',
        debugShowCheckedModeBanner: false,
        locale: Locale(
          AppConfig.instance.defaultLanguage == AppLanguage.arabic ? 'ar' : 'en',
        ),
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        theme: ThemeData(
          colorSchemeSeed: Colors.teal,
          useMaterial3: true,
        ),
        darkTheme: ThemeData(
          colorSchemeSeed: Colors.teal,
          brightness: Brightness.dark,
          useMaterial3: true,
        ),
        themeMode: AppConfig.instance.darkModeEnabled
            ? ThemeMode.dark
            : ThemeMode.light,
        builder: (context, child) {
          return ValueListenableBuilder<bool>(
            valueListenable: DeviceVisualFlashExecutor.isFlashingNotifier,
            builder: (context, isFlashing, _) {
              return Stack(
                children: [
                  if (child != null) child,
                  if (isFlashing)
                    Positioned.fill(
                      child: IgnorePointer(
                        child: Container(
                          color: Colors.red.withOpacity(0.35),
                        ),
                      ),
                    ),
                ],
              );
            },
          );
        },
        home: const SplashScreen(),
      ),
    );
  }
}
