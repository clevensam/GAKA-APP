import React from 'react';
import { SearchIcon, BookOpenIcon, DownloadIcon, FileIcon } from '../components/Icons';
import { AcademicFile } from '../types';
import { RecentFileCard } from '../components/RecentFileCard';

interface HomeProps {
  recentFiles: (AcademicFile & { moduleCode: string; moduleId: string })[];
  onNavigate: (page: string, params?: any) => void;
}

const HomePage: React.FC<HomeProps> = ({ recentFiles, onNavigate }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center">
      <div className="text-center pt-8 pb-20 lg:pt-36">
        <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-2.5 rounded-full mb-10 border border-emerald-100 dark:border-emerald-500/20 animate-slide-in shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800 dark:text-emerald-400">MUST CS Portal</span>
        </div>
        
        <h2 className="text-5xl sm:text-[95px] font-black text-slate-900 dark:text-white mb-10 max-w-6xl mx-auto leading-[1] sm:leading-[0.95] tracking-tight px-4 text-center">
          Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
        </h2>
        
        <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/60 max-w-4xl mx-auto mb-16 font-medium leading-relaxed px-6 text-center">
          Access verified lecture notes, module materials, and past examination papers specifically curated for MUST Computer Science students.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-8 justify-center">
          <button 
            onClick={() => onNavigate('modules')} 
            className="group flex items-center justify-center px-12 py-6 sm:px-20 sm:py-7 bg-emerald-600 dark:bg-emerald-500 text-white rounded-3xl font-black text-base sm:text-lg shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/30 hover:bg-emerald-700 dark:hover:bg-emerald-400 hover:scale-[1.04] transition-all duration-500 active:scale-95"
          >
            Access Modules 
            <SearchIcon className="ml-4 w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
          </button>
          <button 
            onClick={() => onNavigate('about')} 
            className="px-12 py-6 sm:px-20 sm:py-7 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white font-black text-base sm:text-lg border border-slate-200 dark:border-white/[0.05] rounded-3xl hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all duration-500 shadow-sm active:scale-95"
          >
            Learn More
          </button>
        </div>
      </div>

      {recentFiles.length > 0 && (
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
            {recentFiles.map((file, idx) => (
              <RecentFileCard key={file.id} file={file} delay={idx * 150} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl px-4 pb-32 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mt-12">
        {[
          { title: 'Cloud Distribution', text: 'Seamless, high-speed delivery of lecture notes optimized for all mobile devices.', icon: <BookOpenIcon className="w-8 h-8" /> },
          { title: 'One-Tap Logic', text: 'Bypass login redirects and complex folder structures with our direct engine.', icon: <DownloadIcon className="w-8 h-8" /> },
          { title: 'Gaka Archives', text: 'Extensive, verified library of past examination papers for optimal exam preparation.', icon: <FileIcon className="w-8 h-8" /> }
        ].map((service, idx) => (
          <div key={idx} className="bg-white dark:bg-[#111111] p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.03] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group">
            <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center text-slate-400 dark:text-white/20 mb-8 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
              {service.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{service.title}</h3>
            <p className="text-slate-500 dark:text-white/50 text-base leading-relaxed font-medium">{service.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;