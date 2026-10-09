/// =============================================================
/// Lifex-AI — المكوّنات المشتركة
/// الملف: accessible_widgets.dart
/// المسار: lib/widgets/accessible_widgets.dart
/// الوصف: مكوّنات واجهة قياسية تضمن توافق كل شاشات التطبيق مع قارئ
/// الشاشة المدمج في نظام التشغيل (TalkBack على أندرويد، VoiceOver على
/// iOS)، بدلاً من الاعتماد فقط على النطق الصوتي المخصص لدينا
/// (voice_engine.dart). هذا الملف هو الحل لمشكلة "عناصر واجهة بلا
/// تسميات دلالية" التي كانت موجودة في الشاشات السابقة.
///
/// لماذا هذا مهم تحديداً لتطبيق يخدم المكفوفين: قارئ الشاشة لا يقرأ
/// المظهر البصري للعنصر، بل يقرأ خاصية Semantics.label المرفقة به. أي
/// شاشة جديدة في المشروع يجب أن تستخدم هذه المكوّنات بدلاً من
/// IconButton/Card العادية مباشرة، لضمان اتساق إمكانية الوصول عبر كل
/// التطبيق دون نسيانها في شاشة بعينها.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

/// زر إجراء كبير بتسمية دلالية واضحة وحجم لمسة كافٍ (لا يقل عن 48×48
/// نقطة منطقية، وهو الحد الأدنى الموصى به عالمياً لإمكانية الوصول).
class AccessibleActionButton extends StatelessWidget {
  const AccessibleActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.semanticHint,
    this.onTap,
    this.isUrgent = false,
  });

  final IconData icon;
  final String label;

  /// وصف إضافي يُقرأ لقارئ الشاشة يوضّح ماذا يحدث عند الضغط (مثلاً
  /// "يفتح صفحة الملف الصحي")، وليس فقط اسم الزر.
  final String semanticHint;
  final VoidCallback? onTap;
  final bool isUrgent;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onTap == null;

    // اللون الرمادي المعطَّل له أولوية دائماً على لون الإلحاح (isUrgent)؛
    // زر طوارئ لا معنى لتعطيله عملياً، لكن هذا يضمن السلوك الصحيح لو
    // حدث ذلك مستقبلاً في أي زر آخر.
    final color = isDisabled
        ? Theme.of(context).disabledColor
        : (isUrgent ? Colors.red : Theme.of(context).colorScheme.primary);

    // قارئ الشاشة يجب أن يُعلن صراحة أن العنصر "معطَّل" (disabled: true
    // في Semantics)، وليس مجرد صمت أو رسالة عامة — هذا يمنع خلط
    // المستخدم الكفيف بين "هذا الزر لا يعمل بعد" و"حدث خطأ عند الضغط".
    final effectiveHint = isDisabled
        ? 'هذه الميزة غير متاحة بعد.'
        : semanticHint;

    return Semantics(
      button: true,
      label: label,
      hint: effectiveHint,
      enabled: !isDisabled,
      // إعلام قارئ الشاشة أن هذا عنصر تفاعلي منفصل، وليس نصاً عادياً
      // ضمن قائمة أطول يصعب تمييز حدوده صوتياً.
      container: true,
      child: Opacity(
        opacity: isDisabled ? 0.5 : 1.0,
        child: Card(
          elevation: isUrgent && !isDisabled ? 4 : 1,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              constraints: const BoxConstraints(minHeight: 48, minWidth: 48),
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ExcludeSemantics هنا لأن Semantics الأب فوق بالفعل
                  // يوفر التسمية الكاملة؛ تكرار قراءة الأيقونة والنص
                  // منفصلين يجعل تجربة قارئ الشاشة مزعجة ومكرَّرة.
                  ExcludeSemantics(
                    child: Icon(icon, size: 40, color: color),
                  ),
                  const SizedBox(height: 8),
                  ExcludeSemantics(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontWeight:
                            isUrgent && !isDisabled ? FontWeight.bold : FontWeight.normal,
                        color: isDisabled ? Theme.of(context).disabledColor : (isUrgent ? Colors.red : null),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// نص عادي لكنه يُعلن (Announce) نفسه فوراً لقارئ الشاشة عند ظهوره —
/// مفيد لرسائل حالة الطوارئ أو نتائج تحليل الكاميرا المساعدة، حيث يجب
/// أن يسمع المستخدم الكفيف الرسالة فوراً دون الحاجة للتنقل يدوياً
/// إليها بإصبعه على الشاشة.
class LiveAnnouncingText extends StatelessWidget {
  const LiveAnnouncingText({
    super.key,
    required this.message,
    this.style,
  });

  final String message;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true, // يخبر قارئ الشاشة بقراءة هذا فور تحديثه
      label: message,
      child: Text(message, style: style),
    );
  }
}

/// دالة مساعدة لإجبار قارئ الشاشة على الإعلان الفوري عن رسالة معيّنة
/// (مثلاً نتيجة تحليل الكاميرا فور جاهزيتها)، حتى لو لم يكن تركيز
/// قارئ الشاشة على هذا العنصر أصلاً.
void announceForScreenReader(BuildContext context, String message) {
  SemanticsService.announce(message, Directionality.of(context));
}
