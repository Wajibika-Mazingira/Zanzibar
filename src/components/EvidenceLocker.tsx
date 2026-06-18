import * as React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Assessment, Evidence } from '../types';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useI18n } from '../config/i18n';
// ReactMarkdown used in EvidenceListPanel; not required here
const EvidenceReportViewer = React.lazy(() => import('./EvidenceReportViewer'));
const EvidenceListPanel = React.lazy(() => import('./EvidenceListPanel').then(m => ({ default: m.default })));
import { useToasts } from '../hooks/useToasts';
import { useStreamReader } from '../hooks/useStreamReader';
// exportToPdf, streamAIResponse and PiPaymentButton are lazy-loaded to reduce initial bundle
import { MODELS } from '../config/ai';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_LABEL } from '../utils/sanitize';
import ExportPdfButton from './ExportPdfButton';

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);

export const EvidenceLocker: React.FC = () => {
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const [selectedAssessment, setSelectedAssessment] = React.useState<Assessment | null>(assessments[0] || null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedReport, setEditedReport] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'environmental' | 'social' | 'health' | 'climate' | 'carbon' | 'monitoring' | 'engagement' | 'compliance' | 'financial' | 'risk'>('all');
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();
  
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    setIsEditing(false);
    setEditedReport('');
  }, [selectedAssessment?.id]);

  const filteredAssessments = React.useMemo(() => {
    if (activeTab === 'all') return assessments;
    return assessments.filter(a => {
      const type = a.assessmentType.toLowerCase();
      switch (activeTab) {
        case 'environmental': return type.includes('environmental');
        case 'social': return type.includes('social');
        case 'health': return type.includes('health');
        case 'climate': return type.includes('climate');
        case 'carbon': return type.includes('carbon');
        case 'monitoring': return type.includes('monitoring');
        case 'engagement': return type.includes('engagement');
        case 'compliance': return type.includes('compliance');
        case 'financial': return type.includes('financial');
        case 'risk': return type.includes('risk');
        default: return true;
      }
    });
  }, [assessments, activeTab]);
  
  const updateAssessment = (updatedAssessment: Assessment) => {
      const updatedAssessments = assessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a);
      setAssessments(updatedAssessments);
      setSelectedAssessment(updatedAssessment);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedAssessment) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        addToast({ type: 'error', message: `File too large. Maximum size is ${MAX_IMAGE_SIZE_LABEL}.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const newEvidence: Evidence = {
          id: `${Date.now()}`,
          type: 'image',
          name: file.name,
          data: e.target?.result as string,
        };
        const updatedAssessment = {
            ...selectedAssessment,
            evidence: [...(selectedAssessment.evidence || []), newEvidence]
        };
        updateAssessment(updatedAssessment);
        addToast({type: 'success', message: 'Image added as evidence.'})
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyzeImage = async (evidenceId: string) => {
     if (!selectedAssessment) return;
     const evidenceToAnalyze = selectedAssessment.evidence?.find(e => e.id === evidenceId);
     if (!evidenceToAnalyze) return;

     const updateEvidenceState = (evidenceId: string, updates: Partial<Evidence>) => {
         const newAssessment = { ...selectedAssessment };
         newAssessment.evidence = newAssessment.evidence?.map(e => e.id === evidenceId ? { ...e, ...updates } : e);
         updateAssessment(newAssessment);
     };

     updateEvidenceState(evidenceId, { isAnalyzing: true, analysis: '' });
     
     try {
         const base64Data = evidenceToAnalyze.data.split(',')[1];
         const mimeType = evidenceToAnalyze.data.split(';')[0].split(':')[1];
         const langInstr = language === 'sw' ? 'Respond in Swahili (Kiswahili).' : 'Respond in English.';
         const prompt = `Analyze this image in the context of a potential environmental or social impact assessment in Kenya. Describe what you see and identify any potential points of concern. Be objective and descriptive. ${langInstr}`;
         
          const { streamAIResponse } = await import('../services/aiClient');
          const stream = await streamAIResponse('analyzeImage', {
              prompt,
              image: base64Data,
              mimeType,
              model: MODELS.flash
          });
         
         let fullText = '';
         let timeoutId: ReturnType<typeof setTimeout> | null = null;
         await readStream(stream, chunk => {
             fullText += chunk;
             if (timeoutId) clearTimeout(timeoutId);
             timeoutId = setTimeout(() => {
                 const newAssessments = assessments.map(a => a.id === selectedAssessment.id ? {
                     ...a,
                     evidence: a.evidence?.map(e => e.id === evidenceId ? {...e, analysis: fullText} : e)
                 } : a);
                 setAssessments(newAssessments);
                 setSelectedAssessment(newAssessments.find(a => a.id === selectedAssessment.id) || null);
             }, 50);
         });
         if (timeoutId) clearTimeout(timeoutId);
         const finalAssessments = assessments.map(a => a.id === selectedAssessment.id ? {
             ...a,
             evidence: a.evidence?.map(e => e.id === evidenceId ? {...e, analysis: fullText} : e)
         } : a);
         setAssessments(finalAssessments);
         setSelectedAssessment(finalAssessments.find(a => a.id === selectedAssessment.id) || null);
     } catch (error) {
         addToast({ type: 'error', message: 'Image analysis failed.' });
         updateEvidenceState(evidenceId, { analysis: 'Error during analysis.' });
     } finally {
         updateEvidenceState(evidenceId, { isAnalyzing: false });
     }
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    if (!selectedAssessment) return;
    const updatedAssessment = {
        ...selectedAssessment,
        evidence: selectedAssessment.evidence?.filter(e => e.id !== evidenceId)
    };
    updateAssessment(updatedAssessment);
    addToast({ type: 'info', message: 'Evidence removed.' });
  };
  
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updatedAssessments = assessments.filter(a => a.id !== deleteTarget);
    setAssessments(updatedAssessments);
    if (selectedAssessment?.id === deleteTarget) setSelectedAssessment(updatedAssessments[0] || null);
    setDeleteTarget(null);
    addToast({ type: 'info', message: 'Assessment deleted.' });
  };

  const handleExport = (assessment: Assessment) => {
    // POST to server-side PDF generator
    fetch((import.meta.env.VITE_PDF_SERVER_URL || '') + '/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment),
    }).then(async res => {
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(assessment.projectName || 'assessment').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast({ type: 'info', message: 'PDF generated and downloaded.' });
    }).catch(() => {
      addToast({ type: 'error', message: 'PDF generation failed.' });
    });
  };
  
  const handleToggleEdit = () => {
    if (!selectedAssessment) return;
    if (isEditing) {
        const updatedAssessment = { ...selectedAssessment, report: editedReport };
        updateAssessment(updatedAssessment);
        addToast({ type: 'success', message: 'Report updated successfully.'});
        setIsEditing(false);
    } else {
        setEditedReport(selectedAssessment.report);
        setIsEditing(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
        <div className="md:col-span-1 lg:col-span-1">
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t('locker.savedAssessments')}</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {filteredAssessments.length}
              </span>
            </div>
            <div className="p-2 border-b border-slate-200 flex flex-wrap gap-1">
              <button onClick={() => setActiveTab('all')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'all' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('locker.all')}</button>
              <button onClick={() => setActiveTab('environmental')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'environmental' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{t('locker.environmental')}</button>
              <button onClick={() => setActiveTab('social')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'social' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>{t('locker.social')}</button>
              <button onClick={() => setActiveTab('health')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'health' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>{t('locker.health')}</button>
              <button onClick={() => setActiveTab('climate')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'climate' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>{t('locker.climate')}</button>
              <button onClick={() => setActiveTab('carbon')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'carbon' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>{t('locker.carbon')}</button>
              <button onClick={() => setActiveTab('monitoring')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'monitoring' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>{t('locker.monitoring')}</button>
              <button onClick={() => setActiveTab('engagement')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'engagement' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>{t('locker.engagement')}</button>
              <button onClick={() => setActiveTab('compliance')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'compliance' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>{t('locker.compliance')}</button>
              <button onClick={() => setActiveTab('financial')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'financial' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{t('locker.financial')}</button>
              <button onClick={() => setActiveTab('risk')} className={`px-2 py-1 text-xs rounded-full ${activeTab === 'risk' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>{t('locker.risk')}</button>
            </div>
            <div className="max-h-[40vh] md:max-h-[calc(100vh-10rem)] overflow-y-auto">
              {filteredAssessments.length === 0 ? <p className="p-4 text-sm text-slate-500">{t('locker.noSaved')}</p> : (
                  <ul>{filteredAssessments.map(assessment => (
                      <li key={assessment.id} className={`border-b border-slate-200 last:border-b-0 ${selectedAssessment?.id === assessment.id ? 'bg-brand-green-50' : ''}`}>
                          <button onClick={() => setSelectedAssessment(assessment)} className="w-full text-left p-4 hover:bg-slate-50 transition-colors duration-150">
                              <p className="font-semibold text-slate-700 truncate">{assessment.projectName}</p>
                              <p className="text-sm text-slate-500">{assessment.assessmentType} Assessment</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(assessment.createdAt).toLocaleString()}</p>
                          </button>
                      </li>
                  ))}</ul>
              )}
            </div>
          </Card>
        </div>
      <div className="md:col-span-2 lg:col-span-3">
        <Card className="md:sticky top-28">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800 truncate pr-4 w-full sm:w-auto">{selectedAssessment ? selectedAssessment.projectName : t('locker.selectAssessment')}</h2>
                {selectedAssessment && (
                    <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-auto">
                        <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800"><EditIcon className="h-4 w-4" />{isEditing ? t('locker.saveChanges') : t('common.edit')}</button>
                        <React.Suspense fallback={<div />}> 
                          <ExportPdfButton assessment={selectedAssessment} onExport={() => { handleExport(selectedAssessment); }} />
                        </React.Suspense>
                        <button onClick={() => setDeleteTarget(selectedAssessment.id)} className="text-sm font-medium text-red-500 hover:text-red-700">{t('common.delete')}</button>
                    </div>
                )}
            </div>
            <div className="min-h-[50vh] md:max-h-[calc(100vh-12rem)] overflow-y-auto" key={selectedAssessment?.id}>
                {selectedAssessment ? (
                    <div className="divide-y divide-slate-200">
                        {isEditing ? (
                            <textarea value={editedReport} onChange={(e) => setEditedReport(e.target.value)} className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed resize-none" aria-label="Report Editor"/>
                        ) : (
                            <React.Suspense fallback={<div className="p-6"><div className="text-sm text-slate-500">Loading report…</div></div>}>
                              <EvidenceReportViewer report={selectedAssessment.report} />
                            </React.Suspense>
                        )}
                        <React.Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading evidence…</div>}>
                          <EvidenceListPanel assessment={selectedAssessment} onAnalyze={handleAnalyzeImage} onRemove={handleRemoveEvidence} onAddClick={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} onFileChange={handleImageUpload} />
                        </React.Suspense>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="font-semibold">{t('locker.selectAssessment.desc')}</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('confirm.dialog.delete.title')}
        message={t('confirm.dialog.delete.message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
