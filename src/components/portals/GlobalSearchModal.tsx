import React, { useState } from 'react';
import { Search, X, ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';
import { SearchResultItem } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (category: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const session = authService.getSession();
  const userRole = session?.role || 'patient';

  if (!isOpen) return null;

  const results = dataService.search(query, userRole);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-white">
              محرك البحث الصحي الموحد المصرح به (Authorized Search Engine)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Disclaimer */}
        <div className="p-3 bg-teal-950/30 border border-teal-800/40 rounded-xl text-[11px] text-teal-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            البحث خاضع لسياسة التفويض (Role: <strong>{userRole}</strong>) وموافقة المريض (Consent). فهرس البحث ليس مصدراً وحيداً للحقيقة (Search Index ≠ Source of Truth).
          </span>
        </div>

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن طبيب، مستشفى، فحص مختبري، صيدلية، أو دليل علاجي..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 pr-10"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-xs text-slate-500">
              اكتب كلمة البحث لاستعراض الكوادر والمرافق المصرح لك بالوصول إليها.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              لم يتم العثور على نتائج مطابقة لـ "{query}" ضمن نطاق الصلاحيات الحالية.
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onSelectResult(r.category.toLowerCase());
                  onClose();
                }}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-teal-500/50 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">{r.title}</strong>
                    <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-slate-400">{r.subtitle}</p>
                  {r.location && (
                    <span className="text-[10px] text-slate-500">{r.location}</span>
                  )}
                </div>

                <ExternalLink className="w-4 h-4 text-slate-500 hover:text-teal-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
