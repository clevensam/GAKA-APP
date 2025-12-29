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
      className="flex flex-col text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group hover:border-emerald-200"
    >
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
          <BookOpenIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
          {module.code}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">
        {module.name}
      </h3>
      <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-grow">
        {module.description}
      </p>
      <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
        Explore Resources
        <ChevronRightIcon className="ml-1 w-4 h-4" />
      </div>
    </button>
  );
};