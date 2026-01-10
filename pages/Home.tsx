import React from 'react';
import { SearchIcon, DownloadIcon, FileIcon, BookOpenIcon } from '../components/Icons';
import { RecentFileCard } from '../components/RecentFileCard';
import { Module, AcademicFile } from '../types';

interface HomeProps {
  recentFiles: (AcademicFile & { moduleCode: string; moduleId: string })[];
  modules: Module[];
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ recentFiles, modules, onNavigate }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center">
      <div className="text-center pt-4 pb-16 lg:pt-32">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-2 rounded-full mb-8 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">MUST CS Portal</span>
        </div>
        <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-white/90 mb-8 max-w-6xl mx-auto leading-[1.1] sm:leading-[1.05] tracking-tight break-words px-2 text-center">
          Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
        </h2>
        <p className="text-base sm:text-2xl text-slate-500 dark:text-white/60 max-w-3xl mx-auto mb-12 font-normal leading-relaxed px-4 text-center">
          Verified lecture materials, modules, and past examination papers for Computer Science students.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
          <button onClick={() => onNavigate('/modules')} className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
            Access Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          <button onClick={() => onNavigate('/about')} className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-[#282828] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 shadow-sm active:scale-95">
            Learn More
          </button>
        </div>
      </div>
      
      {recentFiles.length > 0 && (
        <div className="w-full max-w-6xl mb-12 px-4 animate-fade-in">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white/90 tracking-tight">Recently Uploaded</h3>
            </div>
            <button onClick={() => onNavigate('/modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
            {recentFiles.map((file, idx) => (
              <RecentFileCard 
                key={file.id} 
                file={file} 
                delay={idx * 100} 
                onNavigate={onNavigate} 
                moduleName={modules.find(m => m.id === file.moduleId)?.name}
              />
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mb-12 px-4 text-left sm:text-center mt-6 sm:mt-8">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white/90 tracking-tight">Our Services</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-6xl px-4 pb-20">
        {[
          { title: 'Material Distribution', text: 'Seamless delivery of lecture notes and academic modules directly to your device.', icon: <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
          { title: 'One-Tap Downloads', text: 'Accelerated file retrieval engine that bypasses secondary login prompts and redirects.', icon: <DownloadIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
          { title: 'Exam Preparation', text: 'Extensive archive of verified past examination papers (Gaka) to enhance your revision process.', icon: <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" /> }
        ].map((service, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 text-left group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-[#282828] rounded-[1.2rem] flex items-center justify-center text-slate-400 dark:text-white/40 mb-6 sm:mb-8 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">{service.icon}</div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white/90 mb-3 sm:mb-4 tracking-tight">{service.title}</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm sm:text-base font-normal leading-relaxed">{service.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};