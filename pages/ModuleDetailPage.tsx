
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackIcon, FileIcon, ShareIcon, ViewIcon, DownloadIcon } from '../components/Icons';
import { Module, ResourceType, AcademicFile } from '../types';

interface ModuleDetailPageProps {
  modules: Module[];
}

const ModuleDetailPage: React.FC<ModuleDetailPageProps> = ({ modules }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const selectedModule = useMemo(() => modules.find(m => m.id === id), [modules, id]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  const handleShare = (resourceTitle: string) => {
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n*${resourceTitle}*\n ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, fileId: string, downloadUrl: string) => {
    if (downloadUrl === '#') { e.preventDefault(); return; }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  if (!selectedModule) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold mb-4">Module not found</h3>
        <button onClick={() => navigate('/modules')} className="text-emerald-600 font-bold uppercase tracking-widest">Back to Directory</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20 sm:pb-32">
      <div className="mb-8 px-1">
        <button onClick={() => navigate('/modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] sm:text-[14px] uppercase tracking-widest hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group">
          <BackIcon className="mr-3 w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-2 transition-transform" />Back to Modules
        </button>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 p-8 sm:p-24 rounded-[2rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 dark:shadow-none mb-8 sm:mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8 sm:mb-10">
            <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
            <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Files Available</span>
          </div>
          <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight sm:leading-[1.05] tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-white/5 transition-colors duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
          <div className="flex bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit animate-fade-in shadow-inner border dark:border-white/5">
            {['All', 'Notes', 'Past Paper'].map((v) => (
              <button 
                key={v} 
                onClick={() => setFilterType(v as any)} 
                className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg dark:shadow-emerald-900/10' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80'}`}
              >
                {v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredResources.map((file, i) => (
            <div 
              key={file.id} 
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#282828] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 rounded-3xl transition-all duration-500 hover:shadow-xl animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center space-x-5 mb-5 sm:mb-0">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 ${
                  file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                }`}>
                  <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
                      {file.type === 'Notes' ? 'Note' : 'Gaka'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white/90 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">
                    {file.title}
                  </h4>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleShare(file.title)} className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
                    <ShareIcon className="w-5 h-5" />
                  </button>
                  <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333333] hover:text-slate-800 dark:hover:text-white/90 rounded-2xl transition-all active:scale-90">
                    <ViewIcon className="w-5 h-5" />
                  </a>
                </div>
                <a 
                  href={file.downloadUrl} 
                  onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)} 
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 sm:px-8 sm:py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 ${
                    downloadingId === file.id ? 'bg-slate-800 dark:bg-black text-white shadow-none cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600'
                  }`}
                >
                  {downloadingId === file.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-4 h-4" /><span>Download</span></>}
                </a>
              </div>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <div className="text-center py-16 sm:py-24 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 px-4">
              <p className="text-slate-400 dark:text-white/20 font-medium text-base italic">No matching resources found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;
