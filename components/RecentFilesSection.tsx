import React from 'react';
import { RecentFileCard } from './RecentFileCard';
import { AcademicFile } from '../types';

interface RecentFilesSectionProps {
  files: (AcademicFile & { moduleCode: string; moduleId: string })[];
  onNavigate: (page: string, params?: any) => void;
}

export const RecentFilesSection: React.FC<RecentFilesSectionProps> = ({ files, onNavigate }) => {
  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mb-24 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-12 px-2">
        <div className="flex items-center space-x-4">
          <div className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Recent Updates</h3>
        </div>
        <button 
          onClick={() => onNavigate('modules')} 
          className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
        >
          View Repository
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
        {files.map((file, idx) => (
          <RecentFileCard key={file.id} file={file} delay={idx * 150} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};