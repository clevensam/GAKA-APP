
import React from 'react';
import { Module } from '../types';
import { ChevronRightIcon, BookOpenIcon, FileIcon } from './Icons';

interface Props {
  module: Module;
  onClick: () => void;
}

export const ModuleCard: React.FC<Props> = ({ module, onClick }) => {
  const resourceCount = module.resources.length;

  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left bg-white dark:bg-[#111] p-5 sm:p-7 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group hover:border-emerald-200 dark:hover:border-emerald-500/30 h-full relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="flex justify-between items-start mb-5 sm:mb-6 w-full relative z-10">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-500 shadow-sm">
          <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[9px] font-black text-slate-400 dark:text-white/40 bg-slate-50 dark:bg-black/40 px-3 py-1 rounded-lg tracking-widest border border-slate-100 dark:border-white/5 uppercase">
            {module.code}
          </span>
          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
             <FileIcon className="w-3 h-3" />
             <span className="text-[9px] font-black uppercase tracking-widest">{resourceCount} {resourceCount === 1 ? 'File' : 'Files'}</span>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white/95 mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight tracking-tight">
          {module.name}
        </h3>
        <p className="text-slate-500 dark:text-white/50 text-xs sm:text-sm line-clamp-2 mb-6 font-medium leading-relaxed flex-grow">
          {module.description}
        </p>
        
        <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform duration-500">
          Open Repository
          <ChevronRightIcon className="ml-1.5 w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
};
