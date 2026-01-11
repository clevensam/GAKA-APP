import React from 'react';
import { AcademicFile } from '../types';
import { FileIcon, ViewIcon, DownloadIcon } from './Icons';

interface RecentFileCardProps {
  file: AcademicFile & { moduleCode: string; moduleId: string };
  delay: number;
  onNavigate: (page: string, params?: any) => void;
}

export const RecentFileCard: React.FC<RecentFileCardProps> = ({ file, delay, onNavigate }) => {
  return (
    <div 
      className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:bg-emerald-600 transition-colors duration-500">
          <FileIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
        </div>
        <button 
          onClick={() => onNavigate('module-detail', { moduleId: file.moduleId })}
          className="text-[10px] font-bold text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-black/40 px-3 py-1 rounded-full tracking-widest border border-slate-100 dark:border-white/5 uppercase hover:text-emerald-500 transition-colors"
        >
          {file.moduleCode}
        </button>
      </div>

      <h4 className="text-lg font-bold text-slate-800 dark:text-white/90 mb-2 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {file.title}
      </h4>
      <p className="text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mb-8">
        {file.type === 'Past Paper' ? 'Gaka' : file.type}
      </p>

      <div className="flex gap-3">
        <a 
          href={file.viewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95"
        >
          <ViewIcon className="w-4 h-4" />
          View
        </a>
        <a 
          href={file.downloadUrl}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all active:scale-95"
        >
          <DownloadIcon className="w-4 h-4" />
          Get
        </a>
      </div>
    </div>
  );
};