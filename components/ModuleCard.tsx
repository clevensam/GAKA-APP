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
      className="flex flex-col text-left bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-emerald-50/50 transition-all duration-500 group hover:border-emerald-200 h-full relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6 sm:mb-8 w-full relative z-10">
        <div className="p-3.5 sm:p-4 bg-emerald-50 rounded-[1rem] sm:rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
          <BookOpenIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 group-hover:text-white" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3.5 py-1.5 rounded-full tracking-widest border border-slate-100 uppercase">
          {module.code}
        </span>
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 group-hover:text-emerald-700 transition-colors leading-tight break-words">
          {module.name}
        </h3>
        <p className="text-slate-400 text-sm sm:text-base line-clamp-2 mb-8 sm:mb-10 font-normal leading-relaxed flex-grow">
          {module.description}
        </p>
        
        <div className="flex items-center text-emerald-600 font-bold text-[11px] sm:text-[12px] uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-500">
          Open Resources
          <ChevronRightIcon className="ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
    </button>
  );
};