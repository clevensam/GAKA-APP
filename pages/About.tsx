import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto py-4 sm:py-12">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 dark:bg-emerald-400/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50"></div>
         <h2 className="text-3xl sm:text-7xl font-extrabold text-slate-900 dark:text-white/90 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
         <div className="space-y-10 sm:space-y-16 text-slate-600 dark:text-white/60 leading-relaxed text-base sm:text-lg relative font-normal">
          <section>
            <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4">Our Objective</h3>
            <p className="text-xl sm:text-3xl font-semibold text-slate-800 dark:text-white/90 tracking-tight leading-snug">GAKA bridges the gap between students and course materials.</p>
            <p className="mt-6">By providing a unified interface for MUST resources, we ensure that focus remains on learning rather than logistics.</p>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-[#282828] p-8 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-2">Development</h4>
              <p className="text-slate-900 dark:text-white font-bold text-lg">Softlink Africa</p>
              <p className="text-sm">Modern engineering optimized for mobile environments.</p>
            </div>
            <div className="bg-emerald-600 dark:bg-emerald-500 p-8 rounded-[1.5rem] text-white shadow-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/60 mb-2">Lead Developer</h4>
              <p className="font-bold text-xl mb-4">Cleven Sam</p>
              <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 rounded-full hover:bg-white/30 transition-all active:scale-95">WhatsApp Connect</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;