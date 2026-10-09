// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: transaction_ledger_test.dart
// المسار: test/features/transaction_ledger_test.dart
// الوصف: اختبار سجل المعاملات المالية — منطق حساس لأنه يحسب الرصيد
// دائماً من مجموع الحركات (Append-only) وليس رقماً مخزَّناً قابلاً
// للتلاعب. أي خطأ حسابي هنا يعني رصيداً غير صحيح لمستخدم حقيقي.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/features/finance/transaction_ledger.dart';

void main() {
  late TransactionLedger ledger;

  setUp(() {
    ledger = TransactionLedger();
  });

  group('TransactionLedger', () {
    test('الرصيد يبدأ من صفر قبل أي معاملة', () {
      expect(ledger.currentBalanceFor('user1'), 0);
    });

    test('الشحن (topUp) يزيد الرصيد', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 5000,
        currencyCode: 'USD',
      );

      expect(ledger.currentBalanceFor('user1'), 5000);
    });

    test('دفع فاتورة مستشفى ينقص الرصيد', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 5000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user1',
        type: TransactionType.hospitalPayment,
        amountInSmallestUnit: 2000,
        currencyCode: 'USD',
      );

      expect(ledger.currentBalanceFor('user1'), 3000);
    });

    test('الاسترجاع (refund) يزيد الرصيد مثل الشحن', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 5000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user1',
        type: TransactionType.hospitalPayment,
        amountInSmallestUnit: 3000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user1',
        type: TransactionType.refund,
        amountInSmallestUnit: 1000,
        currencyCode: 'USD',
      );

      expect(ledger.currentBalanceFor('user1'), 3000);
    });

    test('معاملات مستخدم آخر لا تؤثر على رصيد هذا المستخدم', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 5000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user2',
        type: TransactionType.topUp,
        amountInSmallestUnit: 9999,
        currencyCode: 'USD',
      );

      expect(ledger.currentBalanceFor('user1'), 5000);
      expect(ledger.currentBalanceFor('user2'), 9999);
    });

    test('historyFor يُرجع كل معاملات المستخدم بالترتيب الذي أُضيفت به', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 1000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user1',
        type: TransactionType.donationPayment,
        amountInSmallestUnit: 500,
        currencyCode: 'USD',
      );

      final history = ledger.historyFor('user1');

      expect(history.length, 2);
      expect(history[0].type, TransactionType.topUp);
      expect(history[1].type, TransactionType.donationPayment);
    });

    test('allTransactions يشمل كل المستخدمين معاً', () {
      ledger.record(
        profileId: 'user1',
        type: TransactionType.topUp,
        amountInSmallestUnit: 1000,
        currencyCode: 'USD',
      );
      ledger.record(
        profileId: 'user2',
        type: TransactionType.topUp,
        amountInSmallestUnit: 2000,
        currencyCode: 'USD',
      );

      expect(ledger.allTransactions.length, 2);
    });
  });
}
