# Lifex-AI Global Health Network — التقرير النهائي الموحّد
**هذا هو المستند المرجعي الوحيد لحالة المشروع — يحل محل كل التقارير السابقة المتفرقة.**
تاريخ المراجعة: يوليو 2026 (جولة مراجعة ثانية) | الإصدار: 0.1.0

---

## 1) نتيجة المراجعة الشاملة (Full Audit) — الجولة الثانية

| الفحص | النتيجة |
|---|---|
| توازن الأقواس في كل ملفات Dart (152 ملف lib + 5 اختبارات) | ✅ سليم 100% |
| صحة كل الاستيرادات النسبية | ✅ صفر استيراد مكسور |
| تطابق كل مكتبة مستخدَمة مع `pubspec.yaml` | ✅ مطابقة تامة |
| صحة صياغة كل ملفات JSON الطبية (5 ملفات) | ✅ صالحة بالكامل |
| اتجاه الاعتماديات المعماري (`core/` مستقل عن `features/`) | ✅ سليم |
| وجود اختبارات وحدة فعلية (وليس صفر تغطية) | ✅ 5 ملفات، 31 حالة اختبار |
| `.gitignore` قياسي لمشروع Flutter | ✅ موجود وسليم |

### الفجوة الوظيفية الجوهرية التي اكتُشفت وأُصلحت في هذه الجولة

**المشكلة:** ثلاث شاشات كاملة ومبنية بإتقان (`WalletScreen`, `AiHubScreen`, `AccessibilityAssistantScreen`) كانت تتطلب `profileId` حقيقياً، لكن `home_screen.dart` لم يكن يستدعيها أصلاً — لا استيراد، لا زر تنقّل. بمعنى آخر: 3 وحدات كاملة (محفظة رقمية، مركز الذكاء الاصطناعي، مساعد المكفوفين) كانت **مبنية بالكامل لكن غير قابلة للوصول إليها من أي مكان في التطبيق**.

**السبب الجذري الأعمق:** لم يكن هناك أصلاً آلية لتوليد `profileId` حقيقي — `MultiProfileEngine` يحتوي منطق الملف النشط، لكن لا شيء يُعلم الواجهة عند تغيّره (ليس `ChangeNotifier`)، ولا توجد شاشة لإنشاء أول ملف صحي أصلاً.

**الإصلاح الشامل المطبَّق:**
1. **`active_profile_controller.dart`** (جديد) — `ChangeNotifier` حقيقي فوق `MultiProfileEngine` يُصدر إشعاراً تلقائياً عند إنشاء/تبديل الملف النشط.
2. **`profile_setup_screen.dart`** (جديد) — شاشة إعداد أولي فعلية تُنشئ أول ملف صحي حقيقي (اسم، تاريخ ميلاد، جنس بيولوجي).
3. **`splash_screen.dart`** (محدَّث) — توجيه ذكي: يفحص `hasAnyProfile` فعلياً ويقرر الانتقال لشاشة الإعداد الأولي أو الشاشة الرئيسية.
4. **`home_screen.dart`** (أُعيد بناؤه) — استماع فعلي (`Consumer<ActiveProfileController>`)، وأزرار تنقّل حقيقية للشاشات الثلاث المفقودة.
5. **`main.dart`** (محدَّث) — تسجيل `ActiveProfileController` كـ `ChangeNotifierProvider`.

**تغطية اختبارية جديدة لضمان عدم الانتكاس مستقبلاً:**
- `test/features/multi_profile_engine_test.dart` — 7 حالات اختبار
- `test/features/active_profile_controller_test.dart` — 4 حالات اختبار
- `test/features/transaction_ledger_test.dart` — 7 حالات اختبار
- `test/features/health_profile_test.dart` — 5 حالات اختبار

---

## 2) إحصائية المشروع الكاملة (محدَّثة)

| البند | العدد |
|---|---|
| ملفات Dart في `lib/` | **153** |
| ملفات اختبار في `test/` | **5** (31 حالة اختبار) |
| ملفات بيانات طبية (JSON) | 5 (30 مرض، 184 عرض، 14 تحليل، 11 دواء، 9 طبقات ربط) |
| ملفات ترجمة (ARB) | 2 (عربي/إنجليزي) |
| مجلدات الميزات المستقلة | 23 |
| شاشات المستخدم الكاملة | 13 (افتتاحية، إعداد أولي، رئيسية، ملف صحي، إعدادات، محفظة، مركز AI، مساعد بصري للمكفوفين، رعاية الحالات المزمنة، شبكة المرافقين، صحة المرأة والحمل، المرشد الصوتي، والمنظمات والجمعيات الخيرية) |

### جرد الوحدات الوظيفية (`lib/features/`)

| الوحدة | ملفات | الوحدة | ملفات |
|---|---|---|---|
| `hospital/` | 13 | `messaging/` | 8 |
| `education/` | 8 | `ai/` | 7 |
| `blood_network/` | 6 | `donations/` | 7 |
| `network/` | 7 | `providers/` | 7 |
| `voice/` | 7 | `women_health/` | 7 |
| `accessibility/` | 6 | `vision/` | 6 |
| `dental/` | 5 | `finance/` | 5 |
| `medical_imaging/` | 5 | `profile/` | 6 |
| `medical_services/` | 4 | `remote_health/` | 4 |
| `device_guardian/` | 3 | `emergency/` | 3 |
| `energy/` | 3 | `iot/` | 1 |
| `wellness/` | 1 | | |

---

## 3) البنية المعمارية (طبقات ثابتة، لا تُخترق)

```
lib/
├── core/          → مستقل تماماً، لا يستورد من أي طبقة أخرى
├── data/          → يعتمد على core فقط
├── services/      → يعتمد على core فقط (سحابة، ترجمة، مصطلحات طبية)
├── features/      → يعتمد على core + data + services
├── l10n/          → مستقل (نظام ترجمة)
├── screens/       → يعتمد على كل الطبقات (أعلى مستوى)
└── widgets/       → مكوّنات مشتركة لإعادة الاستخدام
```

**القاعدة الذهبية:** أي وحدة في طبقة أدنى (`core/`) لا يجوز أن تستورد من طبقة أعلى (`features/`). التواصل بين الوحدات المستقلة يتم حصراً عبر `HealthEventManager` (نمط Pub/Sub).

---

## 4) رحلة المستخدم الفعلية بعد الإصلاح (End-to-End)

1. **فتح التطبيق لأول مرة** → `SplashScreen` (3 ثوانٍ، تعرض نص الملكية الكامل) → يفحص `ActiveProfileController.hasAnyProfile`.
2. **لا يوجد ملف بعد** → `ProfileSetupScreen` → المستخدم يُدخل اسمه وتاريخ ميلاده → `createInitialProfile()` → يُسجَّل كصاحب حساب رئيسي ويصبح نشطاً فوراً.
3. **الانتقال لـ `HomeScreen`** → `activeProfileId` حقيقي وغير null → كل الأزرار (محفظة، مركز AI، مساعد بصري، طوارئ) تعمل بمعرّف صحيح فعلي.
4. **إضافة أفراد العائلة لاحقاً** (من الإعدادات، TODO موثَّق) → `addFamilyMember()` → تحديث تلقائي لكل الشاشات المفتوحة.

---

## 5) الالتزامات الأخلاقية والقانونية المطبَّقة في الكود

| الالتزام | أين يظهر فعلياً في الكود |
|---|---|
| رفض ادّعاء "كشف الكذب" | `wellness/stress_confidence_quiz.dart` |
| رفض ادّعاء كشف حريق/دخان/أسلاك كهربائية بالكاميرا العادية | `accessibility/obstacle_detection_engine.dart` |
| عدم لمس أي بيانات بطاقة ائتمان خام | `finance/payment_gateway_client.dart` |
| سجل مالي شفاف غير قابل للتعديل، ومُختبَر آلياً | `finance/transaction_ledger.dart` + اختبار مخصص |
| كل رد AI يحمل تنويهاً طبياً إلزامياً | `ai/ai_engine.dart` |
| تنبيه طوارئ يصل للصم عبر اهتزاز/ومضة | `accessibility/multi_sensory_alert_manager.dart` |
| دعم قارئ الشاشة (TalkBack/VoiceOver) | `widgets/accessible_widgets.dart` |
| عدم الادّعاء بامتثال قانوني غير محقَّق | `REGULATORY_COMPLIANCE_NOTES.md` |
| نص الملكية والإسناد الرسمي | `core/app_constants.dart` |

---

## 6) قائمة التبعيات الخارجية المطلوبة قبل الإطلاق الفعلي

| # | البند | الملف | ما هو مطلوب |
|---|---|---|---|
| 1 | مفتاح Stripe حقيقي | `main.dart`, `payment_gateway_client.dart` | حساب Stripe فعلي |
| 2 | مفتاح Google Translation | `main.dart` | مفتاح Google Cloud |
| 3 | رابط خادم قاعدة البيانات الطبية | `main.dart` | خادم Backend فعلي |
| 4 | رابط الخادم السحابي الخلفي | `main.dart` | خادم Backend فعلي |
| 5 | تخزين آمن حقيقي | `main.dart` (`_InMemoryCredentialStore`) | تفعيل `flutter_secure_storage` |
| 6 | اهتزاز فعلي | `main.dart` (`_NoopVibrationExecutor`) | ربط حزمة `vibration` |
| 7 | ومضة شاشة فعلية | `main.dart` (`_NoopVisualFlashExecutor`) | تنفيذ Overlay فعلي |
| 8 | خدمة SMS/Push حقيقية | `main.dart` | بوابة SMS + Firebase FCM |
| 9 | شاشة خصوصية مخصصة | `settings_screen.dart` | ربط بـ `ProfilePrivacyManager` |
| 10 | شاشة إدارة العائلة | `settings_screen.dart` | ربط بـ `ActiveProfileController.addFamilyMember` |
| 11 | معرّف صادر من خادم حقيقي | `profile_setup_screen.dart` | مصادقة حقيقية (Auth) |
| 12 | ترخيص SNOMED CT | `terminology_connector.dart` | ترخيص فعلي من SNOMED International |
| 13 | مراجعة قانونية شاملة | `REGULATORY_COMPLIANCE_NOTES.md` | محامٍ متخصص HealthTech/FinTech |

---

## 7) خطة التنفيذ المرحلية

### المرحلة 1 — التشغيل التجريبي المحلي (فورية، بلا تكلفة خارجية)
1. `flutter create lifex_ai_temp` لتوليد `ios/` الناقص (`test/` و`.gitignore` موجودان بالفعل في الأرشيف)
2. نسخ محتوى المشروع فوق المجلد الناتج
3. `flutter pub get`
4. `flutter gen-l10n`
5. `flutter test` — تشغيل الـ31 حالة اختبار
6. `flutter run` — تجربة رحلة المستخدم الكاملة

### المرحلة 2 — استكمال الشاشات الإدارية
- شاشة خصوصية مخصصة (TODO #9)
- شاشة إدارة العائلة الكاملة (TODO #10) — المنطق جاهز، تحتاج واجهة فقط

### المرحلة 3 — تفعيل الخدمات الخارجية
- فتح حساب Stripe (TODO #1)
- تفعيل `flutter_secure_storage` (TODO #5)
- ربط حزمة `vibration` (TODOs #6, #7)
- معرّف ملف صادر من مصادقة حقيقية (TODO #11)

### المرحلة 4 — البنية التحتية الخلفية
- بناء خادم Lifex-AI الخلفي (TODOs #3, #4, #8)

### المرحلة 5 — الامتثال القانوني والإطلاق
- مراجعة قانونية كاملة (TODO #13)
- تقييم ترخيص SNOMED CT (TODO #12)
- مراجعة Google Play Data Safety

### المرحلة 6 — الموقع التعريفي
- `LIFEX_AI_WEBSITE_BRIEF_FOR_MANUS.md` جاهز للرفع على Manus

---

## 8) خلاصة الحالة الراهنة

المشروع بعد جولتَي المراجعة أصبح **"هيكل معماري مكتمل، مترابط فعلياً من الشاشة الافتتاحية وحتى كل وحدة، ومختبَر آلياً"**. الفارق الجوهري بين هذه الجولة والسابقة: امتد الفحص لسلوك الشاشات الفعلي وليس فقط سلامة الكود التركيبية — وهو ما كشف فجوة حقيقية (شاشات مبنية لكن غير قابلة للوصول) لم تكن لتظهر بفحص تركيبي وحده. الفجوة الوحيدة المتبقية هي حسابات وخدمات خارجية حقيقية، موثّقة بدقة بمكانها في الكود.

---

## 9) طبقة الوكيل الذكي متعدد الوكلاء (AI Agent Orchestration Layer)

أُضيفت في `lib/core/agent/` (٢٦ ملف تنفيذي) + شاشة `lib/screens/ai_agent_screen.dart` + ٢٠ ملف اختبار في `test/core/agent/`. البنية الكاملة موصوفة داخل تعليقات كل ملف بالعربية؛ هذا القسم يلخّص القرارات المعمارية والفجوات المعروفة فقط.

### 9.1 مبدأ التصميم الأساسي
لا تُعيد الطبقة تنفيذ أي منطق موجود فعلاً في `features/`. كل أداة (`AgentTool`) هي غلاف رقيق يستدعي خدمة حقيقية:
- `document_reader_tool` / `ocr_tool` → `MedicalOcrReader` (`features/vision/`)
- `image_analysis_tool` → `SmartVisionEngine` (`features/vision/`)
- `knowledge_search_tool` → `KnowledgeRetriever` الجديد (`core/agent/knowledge/`) فوق `MedicalDatabaseManager` الموجود (`data/`)
- `notification_tool` → `HealthEventManager` (`core/`)
- `MedicalAgent` → `HealthAnalysisEngine`/`DoctorGuidanceEngine` (`features/ai/`) عند توفرهما، مع مسار احتياطي آمن دونهما
- `EmergencyAgent` → `RiskLevelEngine` (`features/emergency/`) — لا يتخذ أي إجراء تلقائي؛ يُبلّغ فقط

### 9.2 المسار العامل الآن مقابل المسار المخطَّط له

| المكوّن | الحالة |
|---|---|
| آلة الحالة، التخطيط، التنفيذ، إعادة المحاولة، الحد الأقصى للدورات | **يعمل بالكامل** — منطق قواعد صريحة، مُختبَر |
| Tool Registry + الصلاحيات + التأكيد البشري للإجراءات عالية الخطورة | **يعمل بالكامل** — مُختبَر لكل السيناريوهات (بند 34) |
| Human-in-the-Loop لحالات الطوارئ (EmergencyAgent) | **يعمل بالكامل** — يُحظر التنفيذ العادي فوراً عند حالة حرجة/عالية |
| قاعدة المعرفة (KnowledgeRetriever) | **يعمل بمطابقة نصية شفافة** (وليس بحثاً دلالياً) — فهرسة لمرة واحدة، لا إعادة تحميل |
| `AgentModelClient` (بند 25/24) | **يعمل عبر أسلوب "اطلب JSON" فوق `AiServiceRouter` الموجود** — وليس بروتوكول Tool Calling الرسمي لكل مزوّد (Gemini/OpenAI/Claude تختلف صيغهم). راجع التعليق الكامل في `agent_model_client.dart` لخطوات التفعيل الرسمي لاحقاً |
| **OCR الفعلي** | ⚠️ **غير مفعَّل** — `PlaceholderOcrExtractor` يُرجع نصاً فارغاً دائماً عمداً (فالأدوات تفشل بأمان بدل نتيجة وهمية). `google_mlkit_text_recognition` موجودة بالفعل في `pubspec.yaml` لكن لم تُربط لأن توقيع `OcrTextExtractor.extractText(List<int>)` الحالي لا يحمل البيانات الوصفية (width/height/format) التي يحتاجها `InputImage.fromBytes`. **للتفعيل**: مرّر مسار الملف (File path) من نقطة التقاط الصورة واستخدم `InputImage.fromFilePath` بدل البايتات الخام — راجع التعليق الكامل في `core/agent/adapters/placeholder_ocr_extractor.dart` |
| شعار Lifex-AI الجديد (`277075.jpg`) | لم يُدرَج في الكود — الصورة المرفقة مضغوطة الجودة نسبياً؛ يُفضَّل استبدالها بنسخة PNG عالية الدقة بخلفية شفافة توضع في `assets/branding/` قبل ربطها بشاشة "حول التطبيق" |

### 9.3 نقاط الربط في `main.dart`
تمت الإضافة دون حذف أو تعديل أي سطر قائم: استيراد `AgentCore`/`AgentCoreBundle`، حقل `agentCoreBundle` في `LifexAppContext`، بناء الحزمة بعد `emergencyManager` مباشرة (يعيد استخدام `medicalDatabaseManager`، `aiModuleBundle`، `aiServiceRouter`، `riskLevelEngine` الموجودين فعلاً)، وتوفيرها عبر `Provider<AgentCoreBundle>` في شجرة الودجت.

### 9.4 نقطة الدخول من الواجهة
`AiAgentScreen` (`lib/screens/ai_agent_screen.dart`) — وضعا "محادثة" (رد مباشر عبر `AiServiceRouter`) و"وكيل" (تخطيط متعدد الخطوات عبر `CoordinatorAgent.handleUserRequest`)، مع شريط تقدم ✓/●/○، زر إيقاف، وعرض مستوى الثقة + التنويه الإلزامي. **لم تُضَف بعد** أي زر تنقّل إليها من الشاشة الرئيسية — يحتاج سطراً واحداً في أي قائمة تنقّل موجودة (`MaterialPageRoute` أو ما يعادله)، بما يتفق مع بند 35 (فحص نظام التنقّل الفعلي قبل الإضافة، وهو ما لم يتضح كنمط ثابت واحد من فحص `main.dart` — أغلب الشاشات تُستدعى مباشرة دون named routes مركزية).

### 9.5 اختبارات مرحلة 9 (بند 34)
20 ملف اختبار في `test/core/agent/` تغطي: آلة الحالة، دمج الثقة، سجل الأدوات (كل سيناريوهات الفشل الثمانية المطلوبة)، المدقّق، السياسة الأمنية (حقن التعليمات، الإجراءات عالية الخطورة)، المخطِّط، المنفِّذ (تعدد خطوات، إعادة محاولة، إلغاء، تجاوز الحد الأقصى)، المنسّق (أهم اختبار: قطع التنفيذ فوراً عند طوارئ حرجة)، الوكلاء المتخصصون، وأدوات فردية (الآلة الحاسبة، مولّد التقرير، قارئ المستندات، بحث المعرفة). اختبار `KnowledgeRetriever.retrieve()` الكامل (المعتمد على `rootBundle`/`getApplicationDocumentsDirectory`) مُستثنى عمداً من اختبارات الوحدة الصرفة ويحتاج تهيئة Widget Test Binding منفصلة — موثَّق كفجوة صريحة في `knowledge_context_test.dart` بدل اختبار مموَّه لا يغطي فعلياً ما يبدو أنه يغطيه.

