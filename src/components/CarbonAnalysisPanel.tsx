// Component intentionally uses the automatic JSX runtime; no React binding required
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';

export default function CarbonAnalysisPanel({ isAnalyzing, aiAnalysis, t }: { isAnalyzing: boolean; aiAnalysis: string | null; t: any }) {
  return (
    <Card>
      <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('carbon.analysis.title')}</h3></div>
      <div className="p-3 max-h-48 overflow-y-auto text-sm text-slate-600" role="status" aria-live="polite">
        {isAnalyzing ? (
          <LoadingSpinner size="sm" message={t('carbon.analysis.analyzing')} />
        ) : aiAnalysis ? (
          <div className="prose prose-xs max-w-none">
            <p>{aiAnalysis.slice(0, 500)}</p>
            {aiAnalysis.length > 500 && <p className="text-xs text-slate-400 mt-1">{t('carbon.analysis.truncated')}</p>}
          </div>
        ) : (
          <p className="text-slate-400 italic">{t('carbon.analysis.empty')}</p>
        )}
      </div>
    </Card>
  );
}
