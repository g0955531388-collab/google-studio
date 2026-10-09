/// =============================================================
/// Lifex-AI — واجهات التطبيق
/// الملف: wallet_screen.dart
/// المسار: lib/screens/wallet_screen.dart
/// الوصف: عرض رصيد المحفظة الرقمية وكشف الحساب، مع إمكانية شحن الرصيد
/// عبر بوابة الدفع المرخّصة. تعتمد على PaymentController وTransactionService
/// المبنيين مسبقاً، ولا تلمس أي بيانات بطاقة خام مباشرة.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/finance/payment_controller.dart';
import '../features/finance/transaction_ledger.dart';
import '../features/finance/transaction_service.dart';
import '../features/finance/wallet_manager.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _isProcessing = false;
  String? _statusMessageAr;

  Future<void> _showTopUpDialog() async {
    final amountController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('شحن الرصيد'),
        content: TextField(
          controller: amountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: false),
          decoration: const InputDecoration(
            labelText: 'المبلغ (بالدولار)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('متابعة الشحن'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final dollars = int.tryParse(amountController.text.trim());
    if (dollars == null || dollars <= 0) {
      setState(() => _statusMessageAr = 'يُرجى إدخال مبلغ صالح.');
      return;
    }

    setState(() {
      _isProcessing = true;
      _statusMessageAr = null;
    });

    final controller = Provider.of<PaymentController>(context, listen: false);

    // التحويل لأصغر وحدة عملة (سنتات) تجنباً لأخطاء الفاصلة العشرية،
    // بنفس المبدأ المتّبع في transaction_ledger.dart وpayment_gateway_client.dart.
    final result = await controller.handleTopUpRequest(
      profileId: widget.profileId,
      amountInSmallestUnit: dollars * 100,
      currencyCode: 'USD',
    );

    if (!mounted) return;
    setState(() {
      _isProcessing = false;
      _statusMessageAr = result.messageAr;
    });
  }

  @override
  Widget build(BuildContext context) {
    final walletManager = Provider.of<WalletManager>(context, listen: false);
    final transactionService =
        Provider.of<TransactionService>(context, listen: false);

    final balanceCents = walletManager.balanceFor(widget.profileId);
    final statement = transactionService.statementFor(widget.profileId);

    return Scaffold(
      appBar: AppBar(title: const Text('محفظتي')),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Text('الرصيد الحالي', style: TextStyle(fontSize: 14)),
                      const SizedBox(height: 8),
                      Text(
                        '\$${(balanceCents / 100).toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _isProcessing ? null : _showTopUpDialog,
                        icon: _isProcessing
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.add),
                        label: const Text('شحن الرصيد'),
                      ),
                      if (_statusMessageAr != null) ...[
                        const SizedBox(height: 8),
                        Text(_statusMessageAr!, style: const TextStyle(fontSize: 13)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'كشف الحساب',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
            Expanded(
              child: statement.isEmpty
                  ? const Center(child: Text('لا توجد حركات مسجَّلة بعد.'))
                  : ListView.builder(
                      itemCount: statement.length,
                      itemBuilder: (context, index) {
                        final tx = statement[index];
                        final isCredit = tx.type == TransactionType.topUp ||
                            tx.type == TransactionType.refund;
                        return ListTile(
                          leading: Icon(
                            isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                            color: isCredit ? Colors.green : Colors.red,
                          ),
                          title: Text(_transactionLabelAr(tx.type)),
                          subtitle: Text(
                            '${tx.recordedAt.year}/${tx.recordedAt.month}/${tx.recordedAt.day}',
                          ),
                          trailing: Text(
                            '${isCredit ? '+' : '-'}\$'
                            '${(tx.amountInSmallestUnit / 100).toStringAsFixed(2)}',
                            style: TextStyle(
                              color: isCredit ? Colors.green : Colors.red,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  String _transactionLabelAr(TransactionType type) {
    switch (type) {
      case TransactionType.topUp:
        return 'شحن رصيد';
      case TransactionType.hospitalPayment:
        return 'دفع فاتورة مستشفى';
      case TransactionType.donationPayment:
        return 'تبرع';
      case TransactionType.refund:
        return 'استرجاع مبلغ';
    }
  }
}
