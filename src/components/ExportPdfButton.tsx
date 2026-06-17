import * as React from 'react';
import { useI18n } from '../config/i18n';
import { usePiAuth } from '../contexts/PiAuthContext';

export default function ExportPdfButton({ assessment, onExport }: { assessment: any; onExport: () => void }) {
  const { t } = useI18n();
  const { user, sdkAvailable } = usePiAuth();
  void assessment; // intentionally referenced so the prop is preserved for future use
  
  if (!sdkAvailable || !user) {
    return (
      <button onClick={onExport} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">{t('locker.exportPdf')}</button>
    );
  }

  // Lazy-load PiPaymentButton to avoid loading Pi SDK until needed
  const PiPaymentButton = React.lazy(() => import('./PiPaymentButton').then(m => ({ default: m.PiPaymentButton })));

  return (
    <React.Suspense fallback={<button className="text-sm font-medium text-slate-500">{t('locker.exportPdf')}</button>}>
      <PiPaymentButton
        amount={0.05}
        memo="Unlock PDF export for this session"
        metadata={{ feature: 'pdf_export' }}
        onPaymentSuccess={onExport}
        className="text-sm font-medium text-yellow-700 hover:text-yellow-900"
      >
        {t('locker.exportPdf.unlock')}
      </PiPaymentButton>
    </React.Suspense>
  );
}
