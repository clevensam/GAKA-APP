import React, { useState } from 'react';
import { FileIcon, DownloadIcon, ShareIcon, ViewIcon } from './Icons';
import { AcademicFile } from '../types';

interface ResourceItemProps {
  file: AcademicFile;
  moduleCode?: string;
  delay: number;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({ file, moduleCode, delay }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    const msg = `Academic Resource from GAKA Portal: \n\n*${file.title}*\n ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const onDownload = (e: React.MouseEvent) => {
    if (file.downloadUrl === '#') {
        e.preventDefault();
        return;
    }
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 3000);
  };

  return (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-9 bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-slate-100 dark:border-white/[0.03] rounded-[2rem] transition-all duration-500 hover:shadow-2xl animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-6 mb-6 sm:mb-0">
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm ${
          file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
        }`}>
          <FileIcon className="w-7 h-7 sm:w-10 sm:h-10" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            {moduleCode && <span className="text-[10px] font-black bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-white/40 px-3 py-1 rounded-lg uppercase tracking-widest border dark:border-white/[0.05]">{moduleCode}</span>}
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Lecture Note' : 'Gaka'}
            </span>
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl leading-tight break-words pr-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {file.title}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare} 
            title="Share to WhatsApp"
            className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-white/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-white/[0.05] rounded-full transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <a 
            href={file.viewUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            title="Preview File"
            className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all shadow-sm"
          >
            <ViewIcon className="w-6 h-6" />
          </a>
        </div>
        <a 
          href={file.downloadUrl} 
          onClick={onDownload} 
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-4 px-8 py-4 sm:py-5 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${
            isDownloading ? 'bg-slate-900 dark:bg-white text-white dark:text-black cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 hover:shadow-emerald-500/25'
          }`}
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-[3px] border-white/30 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin"></div>
          ) : (
            <>
              <DownloadIcon className="w-5 h-5" />
              <span>Download</span>
            </>
          )}
        </a>
      </div>
    </div>
  );
};