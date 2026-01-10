import React from 'react';
import { Module } from '../types';
import { ChevronRightIcon, BookOpenIcon } from './Icons';

interface Props {
  module: Module;
  onClick: () => void;
}

export const ModuleCard: React.FC<Props> = ({ module, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left bg-white dark:bg-[#111111] p-7 sm:p-9 rounded-[2.5rem] sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/[0.03] hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group hover:border-emerald-200 dark:hover:border-emerald-500/20 h-full relative overflow-hidden active:scale-[0.98]"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-400/5 blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="flex justify-between items-start mb-8 sm:mb-10 w-full relative z-10">
        <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-all duration-500 shadow-sm group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-900/40">
          <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
        </div>
        <span className="text-[10px] font-black text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/[0.02] px-4 py-2 rounded-full tracking-widest border border-slate-100 dark:border-white/[0.05] uppercase">
          {module.code}
        </span>
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight tracking-tight">
          {module.name}
        </h3>
        <p className="text-slate-500 dark:text-white/50 text-sm sm:text-base line-clamp-2 mb-10 sm:mb-12 font-medium leading-relaxed flex-grow">
          {module.description}
        </p>
        
        <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-all duration-500">
          <span>Explore Files</span>
          <ChevronRightIcon className="ml-2 w-4 h-4" />
        </div>
      </div>
    </button>
  );
};