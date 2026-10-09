/// =============================================================
/// Lifex-AI — المعاملات المالية
/// الملف: payment_gateway_client.dart
/// المسار: lib/features/finance/payment_gateway_client.dart
/// الوصف: عقد مجرَّد لأي بوابة دفع مرخّصة خارجية (Stripe/PayPal).
///
/// ⚠️ حد فاصل مهم جداً بالنسبة لملكية المشروع: Lifex-AI **لا يلمس أي
/// أموال حقيقية مباشرة أبداً**. كل عملية دفع فعلية (بطاقة ائتمان، حساب
/// بنكي) تمر بالكامل عبر SDK البوابة المرخّصة نفسها (Stripe/PayPal)،
/// وتطبيقنا يستقبل فقط "تأكيد نجاح/فشل" من البوابة، ولا يخزّن أبداً أي
/// بيانات بطاقة ائتمان خام. هذا يبقينا خارج نطاق متطلبات PCI-DSS
/// المعقدة، وخارج نطاق الحاجة لترخيص مؤسسة تحويل أموال.
/// =============================================================

enum PaymentStatus { pending, succeeded, failed, refunded }

class PaymentResult {
  final PaymentStatus status;
  final String? gatewayTransactionId;
  final String? errorMessageAr;

  const PaymentResult({
    required this.status,
    this.gatewayTransactionId,
    this.errorMessageAr,
  });
}

/// عقد أي بوابة دفع مرخّصة. التنفيذ الفعلي يُربط لاحقاً بـ SDK حقيقي
/// (flutter_stripe أو ما يعادله)، وهذا الملف يوفر البنية والواجهة فقط.
abstract class PaymentGatewayClient {
  String get gatewayName;

  /// بدء عملية دفع لشحن المحفظة أو دفع فاتورة مباشرة. المبلغ بأصغر
  /// وحدة عملة (قروش/سنتات) تجنباً لأخطاء الفاصلة العشرية.
  Future<PaymentResult> chargeAmount({
    required int amountInSmallestUnit,
    required String currencyCode,
    required String description,
  });

  /// استرجاع مبلغ مدفوع سابقاً (يتطلب معرّف معاملة البوابة الأصلي).
  Future<PaymentResult> refund({
    required String gatewayTransactionId,
    int? partialAmountInSmallestUnit,
  });
}

/// تنفيذ توضيحي لبوابة Stripe — هيكل فقط، يتطلب ربط SDK حقيقي
/// (flutter_stripe) واعتماد مفتاح API خاص بحساب Stripe فعلي للمشروع
/// قبل الاستخدام الحقيقي.
class StripePaymentGatewayClient implements PaymentGatewayClient {
  StripePaymentGatewayClient({required this.publishableKey});

  final String publishableKey;

  @override
  String get gatewayName => 'Stripe';

  @override
  Future<PaymentResult> chargeAmount({
    required int amountInSmallestUnit,
    required String currencyCode,
    required String description,
  }) async {
    // TODO: استبدال هذا بالاستدعاء الفعلي لحزمة flutter_stripe عند
    // اعتماد حساب Stripe حقيقي للمشروع.
    return const PaymentResult(
      status: PaymentStatus.failed,
      errorMessageAr: 'بوابة الدفع غير مُفعَّلة بعد. يُرجى المحاولة لاحقاً.',
    );
  }

  @override
  Future<PaymentResult> refund({
    required String gatewayTransactionId,
    int? partialAmountInSmallestUnit,
  }) async {
    return const PaymentResult(
      status: PaymentStatus.failed,
      errorMessageAr: 'بوابة الدفع غير مُفعَّلة بعد.',
    );
  }
}
