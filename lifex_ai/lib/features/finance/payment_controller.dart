/// =============================================================
/// Lifex-AI — المعاملات المالية
/// الملف: payment_controller.dart
/// المسار: lib/features/finance/payment_controller.dart
/// الوصف: طبقة واجهة (Controller) رقيقة تستقبل طلبات الدفع من الشاشات
/// مباشرة، وتتحقق من صحة المدخلات، ثم تفوّضها لـ WalletManager الذي
/// يحتوي المنطق الفعلي — هذا الملف لا يكرر أي منطق موجود، فقط يبسّط
/// نقطة الدخول من الواجهة.
///
/// ⚠️ هذا الملف لا "يمتثل" تلقائياً لأي قانون بمجرد وجوده. الامتثال
/// الفعلي لـ PCI-DSS/HIPAA/GDPR يتطلب مراجعة قانونية متخصصة خارج نطاق
/// الكود، بالإضافة لضبط بنية تحتية حقيقية (تشفير، سجلات تدقيق، اتفاقيات
/// مع مزوّدي الخدمة) لا يمكن لملف Dart واحد أن يوفرها بذاته.
/// =============================================================

import 'transaction_ledger.dart';
import 'wallet_manager.dart';

/// نتيجة التحقق من صحة طلب دفع قبل إرساله لأي بوابة خارجية.
class PaymentRequestValidation {
  final bool isValid;
  final String? errorMessageAr;

  const PaymentRequestValidation.valid()
      : isValid = true,
        errorMessageAr = null;

  const PaymentRequestValidation.invalid(this.errorMessageAr) : isValid = false;
}

/// متحكم الدفع — نقطة الدخول الموحدة من الواجهة لكل عمليات الدفع.
class PaymentController {
  PaymentController({required this.walletManager});

  final WalletManager walletManager;

  /// التحقق الأساسي من صحة مبلغ الشحن قبل إرساله لبوابة الدفع — يمنع
  /// إرسال مبالغ سالبة أو صفرية أو غير منطقية للبوابة الخارجية.
  PaymentRequestValidation validateTopUpRequest({
    required int amountInSmallestUnit,
    required String currencyCode,
  }) {
    if (amountInSmallestUnit <= 0) {
      return const PaymentRequestValidation.invalid(
        'قيمة الشحن يجب أن تكون أكبر من صفر.',
      );
    }
    if (currencyCode.trim().isEmpty) {
      return const PaymentRequestValidation.invalid(
        'يجب تحديد عملة صالحة لعملية الدفع.',
      );
    }
    return const PaymentRequestValidation.valid();
  }

  /// معالجة طلب شحن محفظة كامل: التحقق أولاً، ثم التفويض لـ WalletManager.
  Future<WalletOperationResult> handleTopUpRequest({
    required String profileId,
    required int amountInSmallestUnit,
    required String currencyCode,
  }) async {
    final validation = validateTopUpRequest(
      amountInSmallestUnit: amountInSmallestUnit,
      currencyCode: currencyCode,
    );

    if (!validation.isValid) {
      return WalletOperationResult.failure(
        validation.errorMessageAr ?? 'طلب دفع غير صالح.',
      );
    }

    return walletManager.topUp(
      profileId: profileId,
      amountInSmallestUnit: amountInSmallestUnit,
      currencyCode: currencyCode,
    );
  }

  /// معالجة طلب دفع فاتورة (مستشفى/تبرع) من رصيد المحفظة الحالي.
  WalletOperationResult handleBalancePaymentRequest({
    required String profileId,
    required int amountInSmallestUnit,
    required String currencyCode,
    required TransactionType type,
    String? relatedEntityId,
  }) {
    if (amountInSmallestUnit <= 0) {
      return const WalletOperationResult.failure(
        'قيمة الدفع يجب أن تكون أكبر من صفر.',
      );
    }

    return walletManager.payFromBalance(
      profileId: profileId,
      amountInSmallestUnit: amountInSmallestUnit,
      currencyCode: currencyCode,
      type: type,
      relatedEntityId: relatedEntityId,
    );
  }
}
