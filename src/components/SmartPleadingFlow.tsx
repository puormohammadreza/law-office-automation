import React, { useState } from 'react';
import { PleadingDraftingForm } from './PleadingDraftingForm';
import { LegalCase, CaseDocument } from '../types';
import { Sparkles, ArrowLeft, FileText, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartPleadingFlowProps {
  allCases: LegalCase[];
  allDocuments: CaseDocument[];
  onAddNote: (note: any) => void;
}

export const SmartPleadingFlow: React.FC<SmartPleadingFlowProps> = ({ allCases, allDocuments, onAddNote }) => {
  const [step, setStep] = useState<'selection' | 'setup' | 'drafting'>('selection');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null); // For passing to form
  const [caseDescription, setCaseDescription] = useState<string>('');

  const handleCaseSelect = (id: string) => {
    setSelectedCaseId(id);
  };

  const handleToSetup = () => {
    // Logic to move to setup step
    setStep('setup');
  };

  const handleToDrafting = (analysis: any) => {
    setAnalysisResult(analysis);
    setStep('drafting');
  };

  const selectedCaseObj = allCases.find(c => c.id === selectedCaseId);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6" dir="rtl">
      <AnimatePresence mode="wait">
        
        {step === 'selection' && (
          <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                انتخاب پرونده یا اسناد
              </h2>
              
              <select
                value={selectedCaseId}
                onChange={(e) => handleCaseSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:border-rose-500 transition-all"
              >
                <option value="">-- پرونده‌ای انتخاب نشده است --</option>
                {allCases.map(c => (
                  <option key={c.id} value={c.id}>{c.title} (موکل: {c.clientName})</option>
                ))}
              </select>

              <button
                onClick={handleToSetup}
                disabled={!selectedCaseId}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                تنظیم لایحه
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {/* This needs to look like photo 2 */}
             {/* For simplicity, I'll pass relevant props to a wrapper around PleadingDraftingForm setup */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-900 mb-6">تنظیم هوشمند لایحه قضایی</h3>
                <PleadingDraftingForm 
                    analysisResult={analysisResult} 
                    selectedCaseObj={selectedCaseObj} 
                    onSaveToNotes={onAddNote}
                />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
