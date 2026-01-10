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

  const onDownload = () => {
    if (file.downloadUrl === '#') return;
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 3000);
  };

  return (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#282828] border border-slate-100 dark:border-white/5 rounded-3xl transition-all duration-500 hover:shadow-xl animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-5 mb-5 sm:mb-0">
        <div className={`w-12 h-12 sm:w-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
          file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
        }`}>
          <FileIcon className="w-6 h-6 sm:w-8" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {moduleCode && <span className="text-[9px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-2 py-0.5 rounded-md uppercase border dark:border-white/5">{moduleCode}</span>}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>{file.type === 'Notes' ? 'Note' : 'Gaka'}</span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white/90 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">{file.title}</h4>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-full transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20"><ShareIcon className="w-5" /></button>
          <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333333] hover:text-slate-800 dark:hover:text-white/90 rounded-2xl transition-all"><ViewIcon className="w-5" /></a>
        </div>
        <a href={file.downloadUrl} onClick={onDownload} className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 ${
          isDownloading ? 'bg-slate-800 dark:bg-black text-white cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700'
        }`}>
          {isDownloading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-4" /><span>Download</span></>}
        </a>
      </div>
    </div>
  );
};