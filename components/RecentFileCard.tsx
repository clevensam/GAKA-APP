import React from 'react';
import { ChevronRightIcon } from './Icons';
import { AcademicFile } from '../types';

interface RecentCardProps {
  file: AcademicFile & { moduleCode: string; moduleId: string };
  delay: number;
  onNavigate: (page: string, params?: any) => void;
}

export const RecentFileCard: React.FC<RecentCardProps> = ({ file, delay, onNavigate }) => {
  return (
    <div 
      className="group bg-white dark:bg-[#111111] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.03] hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center space-x-3">
           <div className={`w-3 h-3 rounded-full animate-pulse ${file.type === 'Notes' ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-teal-500 shadow-teal-500/50 shadow-lg'}`}></div>
           <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl uppercase tracking-widest border dark:border-white/[0.05]">{file.moduleCode}</span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-400' : 'text-teal-400'}`}>{file.type === 'Notes' ? 'Notes' : 'Past Paper'}</span>
      </div>
      
      <div className="flex-grow relative z-10">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-10 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
          {file.title}
        </h3>
      </div>
      
      <button 
        onClick={() => onNavigate('module-detail', { moduleId: file.moduleId })}
        className="relative z-10 w-full py-5 bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-white/30 font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 dark:border-white/[0.05]"
      >
        <span>View Details</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </div>
  );
};