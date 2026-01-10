import React, { useState, useMemo } from 'react';
import { BackIcon } from '../components/Icons';
import { Module, ResourceType } from '../types';
import { ResourceItem } from '../components/ResourceItem';

interface DetailProps {
  modules: Module[];
  moduleId: string;
  onNavigate: (page: string, params?: any) => void;
}

const ModuleDetailPage: React.FC<DetailProps> = ({ modules, moduleId, onNavigate }) => {
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');

  const selectedModule = useMemo(() => modules.find(m => m.id === moduleId), [modules, moduleId]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  if (!selectedModule) {
    return <div className="text-center py-20 text-slate-400">Module not found. <button onClick={() => onNavigate('modules')} className="text-emerald-500 font-bold">Go back</button></div>;
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="mb-8 px-1">
        <button onClick={() => onNavigate('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] uppercase tracking-widest hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group">
          <BackIcon className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" />Back to Modules
        </button>
      </div>
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 p-8 sm:p-24 rounded-[2rem] sm:rounded-[3.5rem] text-white shadow-2xl mb-8 sm:mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8">
            <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
            <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Files</span>
          </div>
          <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 leading-tight tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
          <div className="flex bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl border dark:border-white/5">
            {['All', 'Notes', 'Past Paper'].map((v) => (
              <button key={v} onClick={() => setFilterType(v as any)} className={`px-4 sm:px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80'}`}>
                {v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredResources.map((file, i) => <ResourceItem key={file.id} file={file} delay={i * 50} />)}
          {filteredResources.length === 0 && <div className="text-center py-20 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-dashed dark:border-white/5"><p className="text-slate-400 dark:text-white/20 italic">No resources matched your filter.</p></div>}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;