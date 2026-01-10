import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-white/5 py-12 transition-colors duration-500">
      <div className="container mx-auto px-6 sm:px-8 max-w-7xl text-center md:text-left">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white/90 uppercase">GAKA Portal</span>
            </div>
            <p className="text-slate-400 dark:text-white/30 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mx-auto md:mx-0">
              Centralized academic hub for MUST Computer Science students.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-sm">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Connect</h4>
              <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="block text-slate-600 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                +255 685 208 576
              </a>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Developer</h4>
              <p className="text-slate-900 dark:text-white/90 font-bold">Cleven Sam</p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-50 dark:border-white/5 text-center">
          <p className="text-slate-300 dark:text-white/10 text-[9px] font-bold uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Softlink Africa | MUST ICT
          </p>
        </div>
      </div>
    </footer>
  );
};
