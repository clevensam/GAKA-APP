
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../components/Icons';
import { ModuleCard } from '../components/ModuleCard';
import { Module } from '../types';

interface ModulesPageProps {
  modules: Module[];
}

const ModulesPage: React.FC<ModulesPageProps> = ({ modules }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modules.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.code.toLowerCase().includes(q)
    );
  }, [modules, searchQuery]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 sm:gap-10">
        <div className="space-y-3 sm:space-y-4 px-1">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Modules</h2>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex bg-emerald-100/50 dark:bg-[#1E1E1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-200/30 dark:border-white/5 shadow-sm">
               <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Semester 1 | 2025/2026</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10"></div>
            <span className="text-slate-400 dark:text-white/40 font-semibold text-sm sm:text-base tracking-tight">{filteredModules.length} Registered Modules</span>
          </div>
        </div>
        <div className="relative w-full lg:w-[480px] group px-1">
          <div className="absolute inset-y-0 left-6 sm:left-8 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 sm:w-6 h-6 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
          <input 
            type="text" 
            placeholder="Search course code or name..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 sm:pl-20 pr-6 py-5 sm:py-7 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 focus:border-emerald-300 dark:focus:border-emerald-500 outline-none transition-all shadow-sm hover:shadow-md text-lg sm:text-xl font-medium placeholder:text-slate-200 dark:placeholder:text-white/10 text-slate-900 dark:text-white/90" 
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
        {filteredModules.map((module, i) => (
          <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <ModuleCard module={module} onClick={() => navigate(`/module/${module.id}`)} />
          </div>
        ))}
        {filteredModules.length === 0 && (
          <div className="col-span-full py-16 sm:py-24 text-center">
            <p className="text-slate-400 dark:text-white/20 font-medium text-base sm:text-lg italic px-4">
              {modules.length === 0 ? "Searching registry..." : "No matching modules found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesPage;
