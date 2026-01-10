import React, { useState, useMemo } from 'react';
import { ModuleCard } from '../components/ModuleCard';
import { SearchIcon } from '../components/Icons';
import { Module } from '../types';

interface ModulesProps {
  modules: Module[];
  onNavigate: (page: string, params?: any) => void;
}

const ModulesPage: React.FC<ModulesProps> = ({ modules, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = useMemo(() => {
    return modules.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modules, searchQuery]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 px-1">
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Modules</h2>
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100/50 dark:bg-[#1E1E1E] px-3 py-1.5 rounded-full border border-emerald-200/30 dark:border-white/5 shadow-sm">
               <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live Feed</span>
            </div>
            <span className="text-slate-400 dark:text-white/40 font-semibold text-sm">{filteredModules.length} Modules Found</span>
          </div>
        </div>
        <div className="relative w-full lg:w-[480px] group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
          <input 
            type="text" 
            placeholder="Search course..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 focus:border-emerald-300 dark:focus:border-emerald-500 outline-none transition-all shadow-sm text-lg font-medium placeholder:text-slate-200 dark:placeholder:text-white/10 text-slate-900 dark:text-white/90" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
        {filteredModules.map((module, i) => (
          <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <ModuleCard module={module} onClick={() => onNavigate('module-detail', { moduleId: module.id })} />
          </div>
        ))}
        {filteredModules.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <p className="text-slate-400 dark:text-white/20 font-medium italic">No matching modules found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesPage;