import React from 'react';
import { ChevronRightIcon } from './Icons';
import { AcademicFile } from '../types';

interface RecentCardProps {
  file: AcademicFile & { moduleCode: string; moduleId: string };
  delay: number;
  onNavigate: (path: string) => void;
  moduleName?: string;
}

export const RecentFileCard: React.FC<RecentCardProps> = ({ file, delay, onNavigate, moduleName }) => {
  return (
    <div 
      className="group bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center space-x-3">
           <div className={`w-3 h-3 rounded-full animate-pulse ${file.type === 'Notes' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
           <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">
            {file.moduleCode}
          </span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-400' : 'text-teal-400'}`}>
          {file.type === 'Notes' ? 'Lecture Note' : 'Past Paper'}
        </span>
      </div>
      <div className="flex-grow relative z-10">
        <h4 className="text-[12px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.1em] mb-3 line-clamp-1">{moduleName || file.moduleCode}</h4>
        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white/90 leading-[1.25] mb-8 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
          {file.title}
        </h3>
      </div>
      <button 
        onClick={() => onNavigate(`#/module/${file.moduleId}`)} 
        className="relative z-10 w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 dark:border-white/5 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/40"
      >
        <span>View Resources</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};