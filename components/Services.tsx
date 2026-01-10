import React from 'react';
import { BookOpenIcon, DownloadIcon, FileIcon } from './Icons';

const SERVICES = [
  { title: 'Cloud Distribution', text: 'Seamless, high-speed delivery of lecture notes optimized for all mobile devices.', icon: <BookOpenIcon className="w-8 h-8" /> },
  { title: 'One-Tap Logic', text: 'Bypass login redirects and complex folder structures with our direct engine.', icon: <DownloadIcon className="w-8 h-8" /> },
  { title: 'Gaka Archives', text: 'Extensive, verified library of past examination papers for optimal exam preparation.', icon: <FileIcon className="w-8 h-8" /> }
];

export const Services: React.FC = () => (
  <div className="w-full max-w-7xl px-4 pb-32 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mt-12">
    {SERVICES.map((service, idx) => (
      <div key={idx} className="bg-white dark:bg-[#111111] p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.03] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group">
        <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center text-slate-400 dark:text-white/20 mb-8 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
          {service.icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{service.title}</h3>
        <p className="text-slate-500 dark:text-white/50 text-base leading-relaxed font-medium">{service.text}</p>
      </div>
    ))}
  </div>
);