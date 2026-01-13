
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ChevronRightIcon } from '../components/Icons';
import { AcademicFile } from '../types';

interface HomePageProps {
  recentFiles: (AcademicFile & { moduleCode: string; moduleId: string })[];
}

const HomePage: React.FC<HomePageProps> = ({ recentFiles }) => {
  const navigate = useNavigate();

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
          <button onClick={() => navigate('/modules')} className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
            Access Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          <button onClick={() => navigate('/about')} className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-[#282828] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 shadow-sm active:scale-95">
            About Gaka
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
            <button onClick={() => navigate('/modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
            {recentFiles.map((file, idx) => (
              <div 
                key={file.id}
                className="group bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center space-x-3">
                     <div className={`w-3 h-3 rounded-full animate-pulse ${file.type === 'Notes' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
                     <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">
                      {file.moduleCode}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-400' : 'text-teal-400'}`}>
                    {file.type === 'Notes' ? 'Note' : 'Past Paper'}
                  </span>
                </div>
                <div className="flex-grow relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white/90 leading-[1.25] mb-8 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
                    {file.title}
                  </h3>
                </div>
                <button onClick={() => navigate(`/module/${file.moduleId}`)} className="relative z-10 w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 dark:border-white/5 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/40">
                  <span>View Resources</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
