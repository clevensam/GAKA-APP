import React from 'react';
import { AcademicFile } from '../types';
import { FileIcon, ViewIcon, DownloadIcon, ShareIcon } from './Icons';

interface ResourceItemProps {
  file: AcademicFile;
  delay: number;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({ file, delay }) => {
  const handleShare = () => {
    const url = window.location.href;
    const text = `*GAKA Portal Resource*\n\nFile: ${file.title}\nAccess here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/[0.02] border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20 rounded-2xl sm:rounded-[2rem] transition-all duration-500 group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-[#1A1A1A] rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 dark:text-white/10 group-hover:text-emerald-500 transition-colors shadow-sm">
          <FileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h4 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white/90 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{file.title}</h4>
          <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">{file.type === 'Past Paper' ? 'Gaka' : file.type}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={handleShare}
          className="p-3 sm:p-4 text-slate-400 dark:text-white/20 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          title="Share to WhatsApp"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
        <a 
          href={file.viewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/60 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95"
        >
          <ViewIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
          <span className="sm:hidden">View</span>
        </a>
        <a 
          href={file.downloadUrl}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all active:scale-95"
        >
          <DownloadIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
          <span className="sm:hidden">Get</span>
        </a>
      </div>
    </div>
  );
};